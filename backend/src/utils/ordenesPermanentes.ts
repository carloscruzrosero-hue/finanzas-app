import { prisma } from "../db";
import { diasDelMes } from "./fechas";
import { ajustarSaldo, delta } from "./saldo";

// Replica las órdenes permanentes activas y vigentes en el periodo indicado como
// transacciones ya CONFIRMADAS (ajustando el saldo de la cuenta al vuelo, igual que
// cualquier otra transacción confirmada) — un pago/cobro fijo recurrente no necesita
// confirmarse aparte cada mes, ya se sabe que va a ocurrir. Si alguna no debía haberse
// generado, se elimina desde Transacciones (revierte el saldo automáticamente). Evita
// duplicar si ya se generó para ese mismo periodo: es idempotente, se puede volver a
// llamar sin riesgo. Compartida entre la ruta manual ("Generar movimientos del mes") y
// el job automático (ver jobs/generarOrdenesPermanentes.ts).
export async function generarPeriodo(mes: number, anio: number, ordenId?: number) {
  const inicioPeriodo = new Date(anio, mes - 1, 1);
  const finPeriodo = new Date(anio, mes, 0, 23, 59, 59);

  return prisma.$transaction(async (tx) => {
    const ordenes = await tx.ordenPermanente.findMany({
      where: {
        id: ordenId,
        activa: true,
        fechaInicio: { lte: finPeriodo },
        OR: [{ fechaFin: null }, { fechaFin: { gte: inicioPeriodo } }],
      },
      include: { categoria: true },
    });

    const generadas = [];
    for (const orden of ordenes) {
      if (orden.frecuencia === "ANUAL" && orden.fechaInicio.getMonth() + 1 !== mes) continue;

      const yaGeneradas = await tx.transaccion.count({ where: { ordenPermanenteId: orden.id, mes, anio } });
      const vecesEsperadas = orden.frecuencia === "QUINCENAL" ? 2 : 1;
      if (yaGeneradas >= vecesEsperadas) continue;

      const ultimoDia = diasDelMes(mes, anio);
      const diasDePago = [Math.min(orden.diaCobroPago, ultimoDia)];
      if (orden.frecuencia === "QUINCENAL") {
        diasDePago.push(Math.min(orden.diaCobroPago + 15, ultimoDia));
      }

      for (let i = yaGeneradas; i < diasDePago.length; i++) {
        const fecha = new Date(anio, mes - 1, diasDePago[i]);
        const creada = await tx.transaccion.create({
          data: {
            nombre: orden.nombre,
            tipo: orden.categoria.tipo,
            categoriaId: orden.categoriaId,
            cuentaId: orden.cuentaId,
            valor: orden.valor,
            fecha,
            descripcion: "Generada automáticamente por orden permanente.",
            mes,
            anio,
            estado: "CONFIRMADA",
            ordenPermanenteId: orden.id,
          },
        });
        await ajustarSaldo(tx, orden.cuentaId, delta(orden.categoria.tipo, orden.valor));
        generadas.push(creada);
      }
    }
    return generadas;
  });
}
