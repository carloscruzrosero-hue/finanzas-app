import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { TIPOS_CATEGORIA, ESTADOS_TRANSACCION } from "../utils/constants";
import { ajustarSaldo, delta } from "../utils/saldo";
import { mesAnioDe } from "../utils/fechas";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { mes, anio, cuentaId, categoriaId, tipo, estado } = req.query;
    const where: any = {};
    if (mes) where.mes = Number(mes);
    if (anio) where.anio = Number(anio);
    if (cuentaId) where.cuentaId = Number(cuentaId);
    if (categoriaId) where.categoriaId = Number(categoriaId);
    if (tipo) where.tipo = String(tipo);
    if (estado) where.estado = String(estado);

    const transacciones = await prisma.transaccion.findMany({
      where,
      include: { categoria: true, cuenta: true },
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
    });
    res.json(transacciones);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const transaccion = await prisma.transaccion.findUnique({
      where: { id: Number(req.params.id) },
      include: { categoria: true, cuenta: true },
    });
    if (!transaccion) return res.status(404).json({ error: "Transacción no encontrada." });
    res.json(transaccion);
  } catch (err) {
    next(err);
  }
});

const crearTransaccionSchema = z.object({
  tipo: z.enum(TIPOS_CATEGORIA),
  categoriaId: z.number().int(),
  cuentaId: z.number().int(),
  valor: z.number().positive(),
  fecha: z.coerce.date(),
  descripcion: z.string().optional(),
  mes: z.number().int().min(1).max(12).optional(),
  anio: z.number().int().optional(),
  estado: z.enum(ESTADOS_TRANSACCION).default("PENDIENTE"),
});

router.post("/", async (req, res, next) => {
  try {
    const data = crearTransaccionSchema.parse(req.body);
    const { mes, anio } = data.mes && data.anio ? { mes: data.mes, anio: data.anio } : mesAnioDe(data.fecha);

    const transaccion = await prisma.$transaction(async (tx) => {
      const creada = await tx.transaccion.create({ data: { ...data, mes, anio } });
      if (data.estado === "CONFIRMADA") {
        await ajustarSaldo(tx, data.cuentaId, delta(data.tipo, data.valor));
      }
      return creada;
    });
    res.status(201).json(transaccion);
  } catch (err) {
    next(err);
  }
});

// No se deriva con .partial() de crearTransaccionSchema: Zod reaplica el .default()
// de "estado" en cualquier campo ausente aunque el schema sea parcial, lo que
// resetearía silenciosamente una transacción CONFIRMADA a PENDIENTE en cualquier PUT
// que no incluya "estado" explícitamente.
const actualizarTransaccionSchema = z.object({
  tipo: z.enum(TIPOS_CATEGORIA).optional(),
  categoriaId: z.number().int().optional(),
  cuentaId: z.number().int().optional(),
  valor: z.number().positive().optional(),
  fecha: z.coerce.date().optional(),
  descripcion: z.string().optional(),
  mes: z.number().int().min(1).max(12).optional(),
  anio: z.number().int().optional(),
  estado: z.enum(ESTADOS_TRANSACCION).optional(),
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.transaccion.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: "Transacción no encontrada." });
    const data = actualizarTransaccionSchema.parse(req.body);

    const tipoFinal = data.tipo ?? existente.tipo;
    const valorFinal = data.valor ?? existente.valor;
    const cuentaFinal = data.cuentaId ?? existente.cuentaId;
    const estadoFinal = data.estado ?? existente.estado;
    const fechaFinal = data.fecha ?? existente.fecha;
    const { mes, anio } =
      data.mes && data.anio ? { mes: data.mes, anio: data.anio } : data.fecha ? mesAnioDe(data.fecha) : { mes: existente.mes, anio: existente.anio };

    const actualizada = await prisma.$transaction(async (tx) => {
      // Revierte el efecto anterior en la cuenta original si estaba confirmada...
      if (existente.estado === "CONFIRMADA") {
        await ajustarSaldo(tx, existente.cuentaId, -delta(existente.tipo, existente.valor));
      }
      // ...y aplica el nuevo efecto (si el resultado final sigue/queda confirmado).
      if (estadoFinal === "CONFIRMADA") {
        await ajustarSaldo(tx, cuentaFinal, delta(tipoFinal, valorFinal));
      }
      return tx.transaccion.update({
        where: { id },
        data: { ...data, fecha: fechaFinal, mes, anio },
      });
    });
    res.json(actualizada);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.transaccion.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: "Transacción no encontrada." });

    await prisma.$transaction(async (tx) => {
      if (existente.estado === "CONFIRMADA") {
        await ajustarSaldo(tx, existente.cuentaId, -delta(existente.tipo, existente.valor));
      }
      await tx.transaccion.delete({ where: { id } });
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
