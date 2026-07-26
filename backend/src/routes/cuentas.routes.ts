import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { TIPOS_CUENTA } from "../utils/constants";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const cuentas = await prisma.cuenta.findMany({ orderBy: { nombre: "asc" } });
    res.json(cuentas);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const cuenta = await prisma.cuenta.findUnique({ where: { id: Number(req.params.id) } });
    if (!cuenta) return res.status(404).json({ error: "Cuenta no encontrada." });
    res.json(cuenta);
  } catch (err) {
    next(err);
  }
});

const crearCuentaSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(TIPOS_CUENTA),
  saldoActual: z.number().default(0),
  moneda: z.string().min(1).default("USD"),
});

router.post("/", async (req, res, next) => {
  try {
    const data = crearCuentaSchema.parse(req.body);
    const cuenta = await prisma.cuenta.create({ data });
    res.status(201).json(cuenta);
  } catch (err) {
    next(err);
  }
});

// OJO: no se deriva con crearCuentaSchema.partial() porque Zod re-aplica los .default()
// de los campos ausentes incluso bajo .partial(), lo que resetearía silenciosamente
// saldoActual/moneda a su valor por defecto en cualquier PUT que no los incluya.
const actualizarCuentaSchema = z.object({
  nombre: z.string().min(1).optional(),
  tipo: z.enum(TIPOS_CUENTA).optional(),
  saldoActual: z.number().optional(),
  moneda: z.string().min(1).optional(),
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.cuenta.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: "Cuenta no encontrada." });
    const data = actualizarCuentaSchema.parse(req.body);
    const cuenta = await prisma.cuenta.update({ where: { id }, data });
    res.json(cuenta);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.cuenta.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: "Cuenta no encontrada." });
    await prisma.cuenta.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    // Restricción de clave foránea: la cuenta tiene transacciones/órdenes asociadas.
    if (err.code === "P2003") {
      return res.status(409).json({ error: "No se puede eliminar: la cuenta tiene movimientos asociados." });
    }
    next(err);
  }
});

export default router;
