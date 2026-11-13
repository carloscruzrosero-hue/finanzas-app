import { Router } from "express";
import { prisma } from "../db";
import { mesActual } from "../utils/fechas";

const router = Router();

interface TotalesPeriodo {
  ingresos: number;
  gastos: number;
  neto: number;
}

interface FilaTotales {
  anio: number;
  mes: number;
  tipo: string;
  _sum: { valor: number | null };
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/** Suma ingresos y gastos confirmados de las filas agrupadas que cumplen el filtro. */
function totalesDe(filas: FilaTotales[], filtro: (f: FilaTotales) => boolean): TotalesPeriodo {
  let ingresos = 0;
  let gastos = 0;
  for (const f of filas) {
    if (!filtro(f)) continue;
    if (f.tipo === "INGRESO") ingresos += f._sum.valor ?? 0;
    else if (f.tipo === "GASTO") gastos += f._sum.valor ?? 0;
  }
  return { ingresos: redondear(ingresos), gastos: redondear(gastos), neto: redondear(ingresos - gastos) };
}

router.get("/", async (_req, res, next) => {
  try {
    const { mes, anio } = mesActual();
    const hoy = new Date();
    const inicioPeriodo = new Date(anio, mes - 1, 1);
    const finPeriodo = new Date(anio, mes, 0, 23, 59, 59);

    const [cuentas, transaccionesMes, proximasProgramadas, ordenesVigentesMes, cuotasVencidas, totalesPorMes] = await Promise.all([
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
      // Cuotas de deudas pendientes cuyo vencimiento ya pasó — la alerta de "pagos no
      // efectuados" del módulo de Deudas pendientes.
      prisma.cuotaDeuda.findMany({
        where: { estado: "PENDIENTE", fechaVencimiento: { lt: hoy } },
        include: { deuda: { select: { id: true, deudor: true, concepto: true } } },
        orderBy: { fechaVencimiento: "asc" },
      }),
      // Totales confirmados por mes y tipo, en una sola consulta agrupada: alimenta las
      // comparaciones (mes anterior, mismo mes del año pasado) y los acumulados.
      prisma.transaccion.groupBy({
        by: ["anio", "mes", "tipo"],
        where: { estado: "CONFIRMADA" },
        _sum: { valor: true },
      }),
    ]);

    const mesAnterior = mes === 1 ? { mes: 12, anio: anio - 1 } : { mes: mes - 1, anio };
    const comparativos = {
      mesAnterior: { ...mesAnterior, ...totalesDe(totalesPorMes, (f) => f.anio === mesAnterior.anio && f.mes === mesAnterior.mes) },
      mismoMesAnioAnterior: { mes, anio: anio - 1, ...totalesDe(totalesPorMes, (f) => f.anio === anio - 1 && f.mes === mes) },
      acumuladoAnio: { anio, ...totalesDe(totalesPorMes, (f) => f.anio === anio && f.mes <= mes) },
      // Hasta el mes en curso, igual que el acumulado del año: no suma movimientos ya
      // registrados para meses futuros (ej. órdenes permanentes generadas por adelantado).
      historico: totalesDe(totalesPorMes, (f) => f.anio < anio || (f.anio === anio && f.mes <= mes)),
    };

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
      comparativos,
      resumenOrdenesMes,
      proximasTransaccionesProgramadas: proximasProgramadas,
      alertasDeudas: cuotasVencidas.map((c) => ({
        cuotaId: c.id,
        deudaId: c.deuda.id,
        deudor: c.deuda.deudor,
        concepto: c.deuda.concepto,
        numero: c.numero,
        montoPendiente: Math.round((c.montoEsperado - c.montoPagado) * 100) / 100,
        fechaVencimiento: c.fechaVencimiento,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
