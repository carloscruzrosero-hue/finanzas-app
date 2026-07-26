import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const cierres = await prisma.cierreMensual.findMany({ orderBy: [{ anio: "desc" }, { mes: "desc" }] });
    res.json(cierres);
  } catch (err) {
    next(err);
  }
});

router.get("/:mes/:anio", async (req, res, next) => {
  try {
    const mes = Number(req.params.mes);
    const anio = Number(req.params.anio);
    const cierre = await prisma.cierreMensual.findUnique({ where: { mes_anio: { mes, anio } } });
    if (!cierre) return res.status(404).json({ error: "No hay cierre para ese periodo todavía." });
    res.json(cierre);
  } catch (err) {
    next(err);
  }
});

const cerrarSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int(),
});

// Calcula (o recalcula) los totales del periodo a partir de las transacciones
// CONFIRMADA de ese mes/año y marca el cierre como CERRADO. Es idempotente: si ya
// existe un cierre para ese periodo, lo actualiza en vez de duplicarlo.
router.post("/cerrar", async (req, res, next) => {
  try {
    const { mes, anio } = cerrarSchema.parse(req.body);

    const transacciones = await prisma.transaccion.findMany({
      where: { mes, anio, estado: "CONFIRMADA" },
    });
    const totalIngresos = transacciones.filter((t) => t.tipo === "INGRESO").reduce((acc, t) => acc + t.valor, 0);
    const totalGastos = transacciones.filter((t) => t.tipo === "GASTO").reduce((acc, t) => acc + t.valor, 0);

    const cierre = await prisma.cierreMensual.upsert({
      where: { mes_anio: { mes, anio } },
      create: {
        mes,
        anio,
        totalIngresos,
        totalGastos,
        saldoNeto: totalIngresos - totalGastos,
        fechaCierre: new Date(),
        estado: "CERRADO",
      },
      update: {
        totalIngresos,
        totalGastos,
        saldoNeto: totalIngresos - totalGastos,
        fechaCierre: new Date(),
        estado: "CERRADO",
      },
    });
    res.json(cierre);
  } catch (err) {
    next(err);
  }
});

router.post("/reabrir", async (req, res, next) => {
  try {
    const { mes, anio } = cerrarSchema.parse(req.body);
    const existente = await prisma.cierreMensual.findUnique({ where: { mes_anio: { mes, anio } } });
    if (!existente) return res.status(404).json({ error: "No hay cierre para ese periodo." });
    const cierre = await prisma.cierreMensual.update({
      where: { mes_anio: { mes, anio } },
      data: { estado: "ABIERTO" },
    });
    res.json(cierre);
  } catch (err) {
    next(err);
  }
});

export default router;
