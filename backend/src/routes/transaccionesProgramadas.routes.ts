import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { ESTADOS_PROGRAMADA } from "../utils/constants";
import { ajustarSaldo, delta } from "../utils/saldo";
import { mesAnioDe } from "../utils/fechas";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { estado } = req.query;
    const where: any = {};
    if (estado) where.estado = String(estado);
    const programadas = await prisma.transaccionProgramada.findMany({
      where,
      include: { categoria: true, cuenta: true },
      orderBy: { fechaProgramada: "asc" },
    });
    res.json(programadas);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const programada = await prisma.transaccionProgramada.findUnique({
      where: { id: Number(req.params.id) },
      include: { categoria: true, cuenta: true },
    });
    if (!programada) return res.status(404).json({ error: "Transacción programada no encontrada." });
    res.json(programada);
  } catch (err) {
    next(err);
  }
});

const crearProgramadaSchema = z.object({
  nombre: z.string().min(1),
  categoriaId: z.number().int(),
  cuentaId: z.number().int(),
  valor: z.number().positive(),
  fechaProgramada: z.coerce.date(),
  estado: z.enum(ESTADOS_PROGRAMADA).default("PENDIENTE"),
});

router.post("/", async (req, res, next) => {
  try {
    const data = crearProgramadaSchema.parse(req.body);
    const programada = await prisma.transaccionProgramada.create({ data });
    res.status(201).json(programada);
  } catch (err) {
    next(err);
  }
});

// No se deriva con .partial(): Zod reaplica el .default() de "estado" en campos
// ausentes aunque el schema sea parcial, lo que resetearía silenciosamente el estado
// a PENDIENTE en cualquier PUT que no lo incluya explícitamente.
const actualizarProgramadaSchema = z.object({
  nombre: z.string().min(1).optional(),
  categoriaId: z.number().int().optional(),
  cuentaId: z.number().int().optional(),
  valor: z.number().positive().optional(),
  fechaProgramada: z.coerce.date().optional(),
  estado: z.enum(ESTADOS_PROGRAMADA).optional(),
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.transaccionProgramada.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: "Transacción programada no encontrada." });
    if (existente.estado === "EJECUTADA") {
      return res.status(409).json({ error: "No se puede editar una transacción programada ya ejecutada." });
    }
    const data = actualizarProgramadaSchema.parse(req.body);
    const programada = await prisma.transaccionProgramada.update({ where: { id }, data });
    res.json(programada);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.transaccionProgramada.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: "Transacción programada no encontrada." });
    if (existente.estado === "EJECUTADA") {
      return res.status(409).json({ error: "No se puede eliminar una transacción programada ya ejecutada." });
    }
    await prisma.transaccionProgramada.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Convierte la transacción programada en un movimiento real y confirmado, aplicando
// su efecto en el saldo de la cuenta. Queda enlazada vía transaccionProgramadaId para
// trazabilidad y para no poder ejecutarse dos veces.
router.post("/:id/ejecutar", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const programada = await prisma.transaccionProgramada.findUnique({
      where: { id },
      include: { categoria: true },
    });
    if (!programada) return res.status(404).json({ error: "Transacción programada no encontrada." });
    if (programada.estado !== "PENDIENTE") {
      return res.status(409).json({ error: `Esta transacción programada ya está ${programada.estado.toLowerCase()}.` });
    }

    const fecha = new Date();
    const { mes, anio } = mesAnioDe(fecha);

    const transaccion = await prisma.$transaction(async (tx) => {
      const creada = await tx.transaccion.create({
        data: {
          nombre: programada.nombre,
          tipo: programada.categoria.tipo,
          categoriaId: programada.categoriaId,
          cuentaId: programada.cuentaId,
          valor: programada.valor,
          fecha,
          descripcion: "Generada al ejecutar una transacción programada.",
          mes,
          anio,
          estado: "CONFIRMADA",
          transaccionProgramadaId: programada.id,
        },
      });
      await ajustarSaldo(tx, programada.cuentaId, delta(programada.categoria.tipo, programada.valor));
      await tx.transaccionProgramada.update({ where: { id }, data: { estado: "EJECUTADA" } });
      return creada;
    });

    res.json(transaccion);
  } catch (err) {
    next(err);
  }
});

export default router;
