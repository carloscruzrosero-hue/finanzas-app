import { Router } from "express";
import { prisma } from "../db";
import { mesActual } from "../utils/fechas";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const { mes, anio } = mesActual();
    const hoy = new Date();
    const inicioPeriodo = new Date(anio, mes - 1, 1);
    const finPeriodo = new Date(anio, mes, 0, 23, 59, 59);

    const [cuentas, transaccionesMes, proximasProgramadas, ordenesVigentesMes] = await Promise.all([
      prisma.cuenta.findMany(),
      prisma.transaccion.findMany({ where: { mes, anio, estado: "CONFIRMADA" } }),
      prisma.transaccionProgramada.findMany({
        where: { estado: "PENDIENTE", fechaProgramada: { gte: hoy } },
        include: { categoria: true, cuenta: true },
        orderBy: { fechaProgramada: "asc" },
        take: 5,
      }),
      prisma.ordenPermanente.findMany({
        where: {
          activa: true,
          fechaInicio: { lte: finPeriodo },
          OR: [{ fechaFin: null }, { fechaFin: { gte: inicioPeriodo } }],
        },
        include: { categoria: true, cuenta: true },
        orderBy: { diaCobroPago: "asc" },
      }),
    ]);

    const saldoTotal = cuentas.reduce((acc, c) => acc + c.saldoActual, 0);
    const ingresosMes = transaccionesMes.filter((t) => t.tipo === "INGRESO").reduce((acc, t) => acc + t.valor, 0);
    const gastosMes = transaccionesMes.filter((t) => t.tipo === "GASTO").reduce((acc, t) => acc + t.valor, 0);
    const pendientesMes = await prisma.transaccion.count({ where: { mes, anio, estado: "PENDIENTE" } });

    // Resumen de órdenes permanentes del mes en curso: cuáles ya se generaron como
    // transacción y cuáles siguen pendientes de generar.
    const resumenOrdenesMes = await Promise.all(
      ordenesVigentesMes
        .filter((orden) => orden.frecuencia !== "ANUAL" || orden.fechaInicio.getMonth() + 1 === mes)
        .map(async (orden) => {
          const vecesGeneradas = await prisma.transaccion.count({ where: { ordenPermanenteId: orden.id, mes, anio } });
          const vecesEsperadas = orden.frecuencia === "QUINCENAL" ? 2 : 1;
          return {
            id: orden.id,
            nombre: orden.nombre,
            valor: orden.valor,
            frecuencia: orden.frecuencia,
            categoria: orden.categoria,
            cuenta: orden.cuenta,
            generada: vecesGeneradas >= vecesEsperadas,
          };
        })
    );

    res.json({
      periodo: { mes, anio },
      saldoTotal,
      ingresosMes,
      gastosMes,
      saldoNetoMes: ingresosMes - gastosMes,
      pendientesMes,
      resumenOrdenesMes,
      proximasTransaccionesProgramadas: proximasProgramadas,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
