import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { FRECUENCIAS_DEUDA, ESTADOS_DEUDA } from "../utils/constants";
import { ajustarSaldo, delta } from "../utils/saldo";
import { mesAnioDe } from "../utils/fechas";

const router = Router();

// Cuánto avanzar la fecha de vencimiento de una cuota respecto a la anterior, según la
// frecuencia elegida — UNICO no itera (una sola cuota, sin sentido "avanzar").
function sumarIntervalo(fecha: Date, frecuencia: string): Date {
  const d = new Date(fecha);
  if (frecuencia === "QUINCENAL") d.setDate(d.getDate() + 15);
  else if (frecuencia === "MENSUAL") d.setMonth(d.getMonth() + 1);
  else if (frecuencia === "ANUAL") d.setFullYear(d.getFullYear() + 1);
  return d;
}

function hoyEcuador(): Date {
  return new Date();
}

// Deriva campos calculados que no se guardan (para que nunca queden desactualizados):
// "vencida" en cada cuota pendiente cuyo vencimiento ya pasó, y los agregados a nivel
// de deuda que alimentan el listado y la alerta del dashboard.
function conAgregados(deuda: { cuotas: { estado: string; montoEsperado: number; montoPagado: number; fechaVencimiento: Date }[] }) {
  const hoy = hoyEcuador();
  const cuotasPagadas = deuda.cuotas.filter((c) => c.estado === "PAGADA").length;
  const montoPagadoTotal = deuda.cuotas.reduce((acc, c) => acc + c.montoPagado, 0);
  const pendientes = deuda.cuotas.filter((c) => c.estado === "PENDIENTE");
  const vencidas = pendientes.filter((c) => c.fechaVencimiento < hoy);
  const proximaCuota = pendientes.sort((a, b) => a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime())[0];
  return {
    cuotasPagadas,
    totalCuotas: deuda.cuotas.length,
    montoPagadoTotal,
    saldoPendiente: deuda.cuotas.reduce((acc, c) => acc + c.montoEsperado, 0) - montoPagadoTotal,
    tieneVencidas: vencidas.length > 0,
    cuotasVencidas: vencidas.length,
    proximoVencimiento: proximaCuota?.fechaVencimiento ?? null,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const { estado } = req.query;
    const where: any = {};
    if (estado) where.estado = String(estado);

    const deudas = await prisma.deuda.findMany({
      where,
      include: { cuotas: { select: { estado: true, montoEsperado: true, montoPagado: true, fechaVencimiento: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(deudas.map((d) => ({ ...d, ...conAgregados(d) })));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const deuda = await prisma.deuda.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        cuotas: {
          include: { pagos: { include: { cuenta: true }, orderBy: { fecha: "asc" } } },
          orderBy: { numero: "asc" },
        },
      },
    });
    if (!deuda) return res.status(404).json({ error: "Deuda no encontrada." });

    const hoy = hoyEcuador();
    res.json({
      ...deuda,
      ...conAgregados(deuda),
      cuotas: deuda.cuotas.map((c) => ({ ...c, vencida: c.estado === "PENDIENTE" && c.fechaVencimiento < hoy })),
    });
  } catch (err) {
    next(err);
  }
});

const crearDeudaSchema = z.object({
  deudor: z.string().min(1),
  concepto: z.string().min(1),
  montoTotal: z.number().positive(),
  moneda: z.string().min(1).default("USD"),
  frecuencia: z.enum(FRECUENCIAS_DEUDA).default("MENSUAL"),
  numeroCuotas: z.number().int().min(1).default(1),
  fechaInicio: z.coerce.date(),
  observaciones: z.string().optional(),
});

router.post("/", async (req, res, next) => {
  try {
    const data = crearDeudaSchema.parse(req.body);

    // La última cuota absorbe el redondeo (ej. $100 / 3 = 33.33+33.33+33.34) para que
    // la suma de las cuotas sea siempre exactamente montoTotal, centavo a centavo.
    const montoBase = Math.round((data.montoTotal / data.numeroCuotas) * 100) / 100;
    const cuotas = Array.from({ length: data.numeroCuotas }, (_, i) => {
      const numero = i + 1;
      const esUltima = numero === data.numeroCuotas;
      const montoEsperado = esUltima ? Math.round((data.montoTotal - montoBase * (data.numeroCuotas - 1)) * 100) / 100 : montoBase;
      let fechaVencimiento = data.fechaInicio;
      for (let j = 1; j < numero; j++) fechaVencimiento = sumarIntervalo(fechaVencimiento, data.frecuencia);
      return { numero, montoEsperado, fechaVencimiento };
    });

    const deuda = await prisma.deuda.create({
      data: { ...data, cuotas: { create: cuotas } },
      include: { cuotas: { orderBy: { numero: "asc" } } },
    });
    res.status(201).json(deuda);
  } catch (err) {
    next(err);
  }
});

// Solo se editan datos descriptivos y de estado (ej. cancelar la deuda) — cambiar
// montoTotal/numeroCuotas/frecuencia/fechaInicio de una deuda que ya tiene pagos
// registrados dejaría las cuotas existentes inconsistentes con los nuevos parámetros;
// para eso hay que cancelarla y crear una nueva.
const actualizarDeudaSchema = z.object({
  deudor: z.string().min(1).optional(),
  concepto: z.string().min(1).optional(),
  estado: z.enum(ESTADOS_DEUDA).optional(),
  observaciones: z.string().optional(),
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.deuda.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: "Deuda no encontrada." });
    const data = actualizarDeudaSchema.parse(req.body);
    const deuda = await prisma.deuda.update({ where: { id }, data });
    res.json(deuda);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.deuda.findUnique({
      where: { id },
      include: { cuotas: { include: { pagos: true } } },
    });
    if (!existente) return res.status(404).json({ error: "Deuda no encontrada." });

    // Antes de borrar (cascada a cuotas/pagos): revierte cualquier Transaccion real que
    // esos pagos hayan generado, para no dejar dinero "cobrado" en una cuenta sin
    // ningún rastro de por qué entró.
    await prisma.$transaction(async (tx) => {
      for (const cuota of existente.cuotas) {
        for (const pago of cuota.pagos) {
          if (pago.transaccionId && pago.cuentaId) {
            const transaccion = await tx.transaccion.findUnique({ where: { id: pago.transaccionId } });
            if (transaccion?.estado === "CONFIRMADA") {
              await ajustarSaldo(tx, pago.cuentaId, -delta(transaccion.tipo, transaccion.valor));
            }
            await tx.transaccion.delete({ where: { id: pago.transaccionId } }).catch(() => {});
          }
        }
      }
      await tx.deuda.delete({ where: { id } });
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

const registrarPagoSchema = z
  .object({
    monto: z.number().positive(),
    fecha: z.coerce.date().optional(),
    cuentaId: z.number().int().optional(),
    categoriaId: z.number().int().optional(),
    observaciones: z.string().optional(),
  })
  .refine((d) => !d.cuentaId || d.categoriaId, {
    message: "Para reflejar el pago en una cuenta también debes indicar una categoría.",
    path: ["categoriaId"],
  });

// Registra un pago/abono contra una cuota. Si el monto supera lo que falta de esa
// cuota, el excedente se aplica en cascada a la(s) siguiente(s) cuota(s) pendientes —
// así un abono extra adelanta cuotas futuras, sin necesitar un concepto aparte de
// "abono libre". Si viene cuenta+categoría, se crea UNA sola Transaccion (por el monto
// total del pago, aunque internamente se haya repartido en varias cuotas) y se ajusta
// el saldo real de esa cuenta, igual que cualquier otro ingreso de la app.
router.post("/:id/cuotas/:cuotaId/pagos", async (req, res, next) => {
  try {
    const deudaId = Number(req.params.id);
    const cuotaInicialId = Number(req.params.cuotaId);
    const data = registrarPagoSchema.parse(req.body);
    const fecha = data.fecha ?? new Date();

    const cuotaInicial = await prisma.cuotaDeuda.findFirst({ where: { id: cuotaInicialId, deudaId } });
    if (!cuotaInicial) return res.status(404).json({ error: "Cuota no encontrada en esta deuda." });
    if (cuotaInicial.estado === "PAGADA") return res.status(400).json({ error: "Esta cuota ya está pagada." });

    const resultado = await prisma.$transaction(async (tx) => {
      let montoRestante = data.monto;
      let cuota: typeof cuotaInicial | null = cuotaInicial;
      let primerPagoId: number | null = null;
      const pagosCreados: { id: number; cuotaId: number; monto: number }[] = [];

      while (montoRestante > 0.001 && cuota) {
        const saldoCuota = Math.round((cuota.montoEsperado - cuota.montoPagado) * 100) / 100;
        const aplicado = Math.min(montoRestante, saldoCuota);
        const pago = await tx.pagoDeuda.create({
          data: {
            cuotaId: cuota.id,
            monto: aplicado,
            fecha,
            cuentaId: data.cuentaId,
            observaciones: data.observaciones,
          },
        });
        primerPagoId ??= pago.id;
        pagosCreados.push({ id: pago.id, cuotaId: cuota.id, monto: aplicado });

        const nuevoMontoPagado = Math.round((cuota.montoPagado + aplicado) * 100) / 100;
        const completada = nuevoMontoPagado >= cuota.montoEsperado - 0.001;
        await tx.cuotaDeuda.update({
          where: { id: cuota.id },
          data: { montoPagado: nuevoMontoPagado, estado: completada ? "PAGADA" : "PENDIENTE", fechaPago: completada ? fecha : null },
        });

        montoRestante = Math.round((montoRestante - aplicado) * 100) / 100;
        if (montoRestante > 0.001) {
          cuota = await tx.cuotaDeuda.findFirst({
            where: { deudaId, estado: "PENDIENTE", numero: { gt: cuota.numero } },
            orderBy: { numero: "asc" },
          });
        } else {
          cuota = null;
        }
      }

      // Una sola Transaccion por el total efectivamente aplicado (puede ser menor al
      // monto enviado si ya no quedaban más cuotas pendientes donde aplicar el resto).
      const totalAplicado = pagosCreados.reduce((acc, p) => acc + p.monto, 0);
      if (data.cuentaId && data.categoriaId && totalAplicado > 0) {
        const { mes, anio } = mesAnioDe(fecha);
        const transaccion = await tx.transaccion.create({
          data: {
            nombre: `Cobro deuda — ${cuotaInicial.numero > 1 ? "cuota #" + cuotaInicial.numero : "pago"}`,
            tipo: "INGRESO",
            categoriaId: data.categoriaId,
            cuentaId: data.cuentaId,
            valor: totalAplicado,
            fecha,
            descripcion: data.observaciones,
            mes,
            anio,
            estado: "CONFIRMADA",
          },
        });
        await ajustarSaldo(tx, data.cuentaId, totalAplicado);
        await tx.pagoDeuda.update({ where: { id: primerPagoId! }, data: { transaccionId: transaccion.id } });
      }

      // Si con este pago quedaron todas las cuotas pagadas, la deuda pasa a PAGADA sola.
      const cuotasRestantes = await tx.cuotaDeuda.count({ where: { deudaId, estado: "PENDIENTE" } });
      const deudaActual = await tx.deuda.findUnique({ where: { id: deudaId } });
      if (deudaActual?.estado === "ACTIVA" && cuotasRestantes === 0) {
        await tx.deuda.update({ where: { id: deudaId }, data: { estado: "PAGADA" } });
      }

      return tx.deuda.findUnique({
        where: { id: deudaId },
        include: { cuotas: { include: { pagos: true }, orderBy: { numero: "asc" } } },
      });
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
});

// Revierte un pago puntual: resta lo que había aportado a su cuota (regresándola a
// PENDIENTE si ya no alcanza a cubrir el monto esperado), y si generó una Transaccion
// real, revierte el saldo de la cuenta y la elimina — mismo criterio simétrico que
// transacciones.routes.ts.
router.delete("/:id/cuotas/:cuotaId/pagos/:pagoId", async (req, res, next) => {
  try {
    const deudaId = Number(req.params.id);
    const cuotaId = Number(req.params.cuotaId);
    const pagoId = Number(req.params.pagoId);

    const pago = await prisma.pagoDeuda.findFirst({ where: { id: pagoId, cuotaId }, include: { cuota: true } });
    if (!pago || pago.cuota.deudaId !== deudaId) return res.status(404).json({ error: "Pago no encontrado." });

    await prisma.$transaction(async (tx) => {
      if (pago.transaccionId && pago.cuentaId) {
        const transaccion = await tx.transaccion.findUnique({ where: { id: pago.transaccionId } });
        if (transaccion?.estado === "CONFIRMADA") {
          await ajustarSaldo(tx, pago.cuentaId, -delta(transaccion.tipo, transaccion.valor));
        }
        await tx.transaccion.delete({ where: { id: pago.transaccionId } }).catch(() => {});
      }

      const nuevoMontoPagado = Math.max(0, Math.round((pago.cuota.montoPagado - pago.monto) * 100) / 100);
      await tx.cuotaDeuda.update({
        where: { id: cuotaId },
        data: { montoPagado: nuevoMontoPagado, estado: "PENDIENTE", fechaPago: null },
      });
      await tx.pagoDeuda.delete({ where: { id: pagoId } });

      // Si la deuda se había marcado PAGADA automáticamente, vuelve a ACTIVA.
      const deuda = await tx.deuda.findUnique({ where: { id: deudaId } });
      if (deuda?.estado === "PAGADA") {
        await tx.deuda.update({ where: { id: deudaId }, data: { estado: "ACTIVA" } });
      }
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
