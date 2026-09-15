import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { FRECUENCIAS_ORDEN } from "../utils/constants";
import { diasDelMes, mesActual } from "../utils/fechas";
import { ajustarSaldo, delta } from "../utils/saldo";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { activa } = req.query;
    const where: any = {};
    if (activa !== undefined) where.activa = activa === "true";
    const ordenes = await prisma.ordenPermanente.findMany({
      where,
      include: { categoria: true, cuenta: true },
      orderBy: { nombre: "asc" },
    });
    res.json(ordenes);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const orden = await prisma.ordenPermanente.findUnique({
      where: { id: Number(req.params.id) },
      include: { categoria: true, cuenta: true },
    });
    if (!orden) return res.status(404).json({ error: "Orden permanente no encontrada." });
    res.json(orden);
  } catch (err) {
    next(err);
  }
});

const crearOrdenSchema = z.object({
  nombre: z.string().min(1),
  categoriaId: z.number().int(),
  cuentaId: z.number().int(),
  valor: z.number().positive(),
  diaCobroPago: z.number().int().min(1).max(31),
  frecuencia: z.enum(FRECUENCIAS_ORDEN).default("MENSUAL"),
  activa: z.boolean().default(true),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date().nullable().optional(),
});

router.post("/", async (req, res, next) => {
  try {
    const data = crearOrdenSchema.parse(req.body);
    const orden = await prisma.ordenPermanente.create({ data });
    res.status(201).json(orden);
  } catch (err) {
    next(err);
  }
});

// No se deriva con .partial(): Zod reaplica los .default() de "frecuencia"/"activa" en
// campos ausentes aunque el schema sea parcial, lo que los resetearía silenciosamente
// en cualquier PUT que no los incluya explícitamente (por ejemplo, desactivar una orden
// con { activa: false } estaría bien, pero editar solo "valor" reactivaría la orden).
const actualizarOrdenSchema = z.object({
  nombre: z.string().min(1).optional(),
  categoriaId: z.number().int().optional(),
  cuentaId: z.number().int().optional(),
  valor: z.number().positive().optional(),
  diaCobroPago: z.number().int().min(1).max(31).optional(),
  frecuencia: z.enum(FRECUENCIAS_ORDEN).optional(),
  activa: z.boolean().optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFin: z.coerce.date().nullable().optional(),
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.ordenPermanente.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: "Orden permanente no encontrada." });
    const data = actualizarOrdenSchema.parse(req.body);
    const orden = await prisma.ordenPermanente.update({ where: { id }, data });
    res.json(orden);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.ordenPermanente.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: "Orden permanente no encontrada." });
    await prisma.ordenPermanente.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

const generarSchema = z.object({
  mes: z.number().int().min(1).max(12).optional(),
  anio: z.number().int().optional(),
  // Si se indica, genera para todo el rango [mes/anio, hasta] en vez de un solo mes —
  // usado para el "backfill" cuando una orden permanente arranca en un mes ya pasado.
  hasta: z.object({ mes: z.number().int().min(1).max(12), anio: z.number().int() }).optional(),
  ordenId: z.number().int().optional(),
});

// Replica las órdenes permanentes activas y vigentes en el periodo indicado como
// transacciones ya CONFIRMADAS (ajustando el saldo de la cuenta al vuelo, igual que
// cualquier otra transacción confirmada) — un pago/cobro fijo recurrente no necesita
// confirmarse aparte cada mes, ya se sabe que va a ocurrir. Si alguna no debía haberse
// generado, se elimina desde Transacciones (revierte el saldo automáticamente). Evita
// duplicar si ya se generó para ese mismo periodo: es idempotente, se puede volver a
// llamar sin riesgo.
async function generarPeriodo(mes: number, anio: number, ordenId?: number) {
  const inicioPeriodo = new Date(anio, mes - 1, 1);
  const finPeriodo = new Date(anio, mes, 0, 23, 59, 59);

  return prisma.$transaction(async (tx) => {
    const ordenes = await tx.ordenPermanente.findMany({
      where: {
        id: ordenId,
        activa: true,
        fechaInicio: { lte: finPeriodo },
        OR: [{ fechaFin: null }, { fechaFin: { gte: inicioPeriodo } }],
      },
      include: { categoria: true },
    });

    const generadas = [];
    for (const orden of ordenes) {
      if (orden.frecuencia === "ANUAL" && orden.fechaInicio.getMonth() + 1 !== mes) continue;

      const yaGeneradas = await tx.transaccion.count({ where: { ordenPermanenteId: orden.id, mes, anio } });
      const vecesEsperadas = orden.frecuencia === "QUINCENAL" ? 2 : 1;
      if (yaGeneradas >= vecesEsperadas) continue;

      const ultimoDia = diasDelMes(mes, anio);
      const diasDePago = [Math.min(orden.diaCobroPago, ultimoDia)];
      if (orden.frecuencia === "QUINCENAL") {
        diasDePago.push(Math.min(orden.diaCobroPago + 15, ultimoDia));
      }

      for (let i = yaGeneradas; i < diasDePago.length; i++) {
        const fecha = new Date(anio, mes - 1, diasDePago[i]);
        const creada = await tx.transaccion.create({
          data: {
            nombre: orden.nombre,
            tipo: orden.categoria.tipo,
            categoriaId: orden.categoriaId,
            cuentaId: orden.cuentaId,
            valor: orden.valor,
            fecha,
            descripcion: "Generada automáticamente por orden permanente.",
            mes,
            anio,
            estado: "CONFIRMADA",
            ordenPermanenteId: orden.id,
          },
        });
        await ajustarSaldo(tx, orden.cuentaId, delta(orden.categoria.tipo, orden.valor));
        generadas.push(creada);
      }
    }
    return generadas;
  });
}

router.post("/generar", async (req, res, next) => {
  try {
    const { mes: mesBody, anio: anioBody, hasta, ordenId } = generarSchema.parse(req.body ?? {});
    const inicio = mesBody && anioBody ? { mes: mesBody, anio: anioBody } : mesActual();

    const periodos: { mes: number; anio: number }[] = [inicio];
    if (hasta) {
      let cursor = new Date(inicio.anio, inicio.mes - 1, 1);
      const limite = new Date(hasta.anio, hasta.mes - 1, 1);
      periodos.length = 0;
      while (cursor <= limite) {
        periodos.push({ mes: cursor.getMonth() + 1, anio: cursor.getFullYear() });
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      }
    }

    let generadas: Awaited<ReturnType<typeof generarPeriodo>> = [];
    for (const p of periodos) {
      generadas = generadas.concat(await generarPeriodo(p.mes, p.anio, ordenId));
    }

    res.json({ generadas: generadas.length, transacciones: generadas });
  } catch (err) {
    next(err);
  }
});

export default router;
