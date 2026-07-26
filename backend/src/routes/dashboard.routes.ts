import { Router } from "express";
import { prisma } from "../db";
import { mesActual } from "../utils/fechas";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const { mes, anio } = mesActual();
    const hoy = new Date();

    const [cuentas, transaccionesMes, cierreMes, proximasProgramadas, ordenesActivas] = await Promise.all([
      prisma.cuenta.findMany({ orderBy: { nombre: "asc" } }),
      prisma.transaccion.findMany({ where: { mes, anio, estado: "CONFIRMADA" } }),
      prisma.cierreMensual.findUnique({ where: { mes_anio: { mes, anio } } }),
      prisma.transaccionProgramada.findMany({
        where: { estado: "PENDIENTE", fechaProgramada: { gte: hoy } },
        include: { categoria: true, cuenta: true },
        orderBy: { fechaProgramada: "asc" },
        take: 5,
      }),
      prisma.ordenPermanente.findMany({
        where: { activa: true },
        include: { categoria: true, cuenta: true },
        orderBy: { diaCobroPago: "asc" },
      }),
    ]);

    const saldoTotal = cuentas.reduce((acc, c) => acc + c.saldoActual, 0);
    const ingresosMes = transaccionesMes.filter((t) => t.tipo === "INGRESO").reduce((acc, t) => acc + t.valor, 0);
    const gastosMes = transaccionesMes.filter((t) => t.tipo === "GASTO").reduce((acc, t) => acc + t.valor, 0);

    const pendientesMes = await prisma.transaccion.count({ where: { mes, anio, estado: "PENDIENTE" } });

    res.json({
      periodo: { mes, anio },
      saldoTotal,
      cuentas,
      ingresosMes,
      gastosMes,
      saldoNetoMes: ingresosMes - gastosMes,
      pendientesMes,
      cierreMesActual: cierreMes,
      proximasTransaccionesProgramadas: proximasProgramadas,
      ordenesPermanentesActivas: ordenesActivas,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
