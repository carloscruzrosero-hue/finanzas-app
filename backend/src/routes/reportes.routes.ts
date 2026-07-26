import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { mesActual } from "../utils/fechas";

const router = Router();

const resumenSchema = z.object({
  desdeMes: z.coerce.number().int().min(1).max(12).optional(),
  desdeAnio: z.coerce.number().int().optional(),
  hastaMes: z.coerce.number().int().min(1).max(12).optional(),
  hastaAnio: z.coerce.number().int().optional(),
});

// Reporte de ingresos/gastos por mes, calculado en vivo a partir de las transacciones
// CONFIRMADA de cada periodo (no depende de ningún "cierre" guardado). Por defecto
// cubre los últimos 6 meses hasta el actual.
router.get("/resumen-mensual", async (req, res, next) => {
  try {
    const query = resumenSchema.parse(req.query);
    const actual = mesActual();
    const hasta = query.hastaMes && query.hastaAnio ? { mes: query.hastaMes, anio: query.hastaAnio } : actual;
    let desde = query.desdeMes && query.desdeAnio ? { mes: query.desdeMes, anio: query.desdeAnio } : null;
    if (!desde) {
      const cursor = new Date(hasta.anio, hasta.mes - 1 - 5, 1);
      desde = { mes: cursor.getMonth() + 1, anio: cursor.getFullYear() };
    }

    const periodos: { mes: number; anio: number }[] = [];
    let cursor = new Date(desde.anio, desde.mes - 1, 1);
    const limite = new Date(hasta.anio, hasta.mes - 1, 1);
    while (cursor <= limite) {
      periodos.push({ mes: cursor.getMonth() + 1, anio: cursor.getFullYear() });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    const inicioRango = new Date(desde.anio, desde.mes - 1, 1);
    const finRango = new Date(hasta.anio, hasta.mes, 0, 23, 59, 59);

    const transacciones = await prisma.transaccion.findMany({
      where: { estado: "CONFIRMADA", fecha: { gte: inicioRango, lte: finRango } },
      select: { tipo: true, valor: true, mes: true, anio: true },
    });

    const resumen = periodos.map(({ mes, anio }) => {
      const delPeriodo = transacciones.filter((t) => t.mes === mes && t.anio === anio);
      const totalIngresos = delPeriodo.filter((t) => t.tipo === "INGRESO").reduce((acc, t) => acc + t.valor, 0);
      const totalGastos = delPeriodo.filter((t) => t.tipo === "GASTO").reduce((acc, t) => acc + t.valor, 0);
      return { mes, anio, totalIngresos, totalGastos, saldoNeto: totalIngresos - totalGastos };
    });

    res.json(resumen);
  } catch (err) {
    next(err);
  }
});

// Detalle de transacciones confirmadas del rango, agrupables por el frontend para el
// export a Excel (una fila por movimiento, no solo el total por mes).
router.get("/detalle", async (req, res, next) => {
  try {
    const query = resumenSchema.parse(req.query);
    const actual = mesActual();
    const hasta = query.hastaMes && query.hastaAnio ? { mes: query.hastaMes, anio: query.hastaAnio } : actual;
    const desde = query.desdeMes && query.desdeAnio ? { mes: query.desdeMes, anio: query.desdeAnio } : actual;

    const inicioRango = new Date(desde.anio, desde.mes - 1, 1);
    const finRango = new Date(hasta.anio, hasta.mes, 0, 23, 59, 59);

    const transacciones = await prisma.transaccion.findMany({
      where: { estado: "CONFIRMADA", fecha: { gte: inicioRango, lte: finRango } },
      include: { categoria: true, cuenta: true },
      orderBy: [{ fecha: "asc" }],
    });
    res.json(transacciones);
  } catch (err) {
    next(err);
  }
});

export default router;
