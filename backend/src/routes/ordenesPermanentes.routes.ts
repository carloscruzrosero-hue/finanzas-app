import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { FRECUENCIAS_ORDEN } from "../utils/constants";
import { diasDelMes, mesActual } from "../utils/fechas";

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
});

// Replica las órdenes permanentes activas y vigentes en el periodo indicado (por
// defecto el mes en curso) como transacciones PENDIENTE, evitando duplicar si ya se
// generaron para ese mismo periodo. Se guarda de forma idempotente: se puede volver a
// llamar sin riesgo de duplicar movimientos ya generados.
router.post("/generar", async (req, res, next) => {
  try {
    const { mes: mesBody, anio: anioBody } = generarSchema.parse(req.body ?? {});
    const { mes, anio } = mesBody && anioBody ? { mes: mesBody, anio: anioBody } : mesActual();
    const inicioPeriodo = new Date(anio, mes - 1, 1);
    const finPeriodo = new Date(anio, mes, 0, 23, 59, 59);

    const ordenes = await prisma.ordenPermanente.findMany({
      where: {
        activa: true,
        fechaInicio: { lte: finPeriodo },
        OR: [{ fechaFin: null }, { fechaFin: { gte: inicioPeriodo } }],
      },
      include: { categoria: true },
    });

    const generadas = [];
    for (const orden of ordenes) {
      if (orden.frecuencia === "ANUAL" && orden.fechaInicio.getMonth() + 1 !== mes) continue;

      const yaGeneradas = await prisma.transaccion.count({ where: { ordenPermanenteId: orden.id, mes, anio } });
      const vecesEsperadas = orden.frecuencia === "QUINCENAL" ? 2 : 1;
      if (yaGeneradas >= vecesEsperadas) continue;

      const ultimoDia = diasDelMes(mes, anio);
      const diasDePago = [Math.min(orden.diaCobroPago, ultimoDia)];
      if (orden.frecuencia === "QUINCENAL") {
        diasDePago.push(Math.min(orden.diaCobroPago + 15, ultimoDia));
      }

      for (let i = yaGeneradas; i < diasDePago.length; i++) {
        const fecha = new Date(anio, mes - 1, diasDePago[i]);
        const creada = await prisma.transaccion.create({
          data: {
            tipo: orden.categoria.tipo,
            categoriaId: orden.categoriaId,
            cuentaId: orden.cuentaId,
            valor: orden.valor,
            fecha,
            descripcion: `${orden.nombre} (orden permanente)`,
            mes,
            anio,
            estado: "PENDIENTE",
            ordenPermanenteId: orden.id,
          },
        });
        generadas.push(creada);
      }
    }

    res.json({ generadas: generadas.length, transacciones: generadas });
  } catch (err) {
    next(err);
  }
});

export default router;
