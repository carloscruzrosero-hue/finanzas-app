import { CategoriaGasto, TransaccionProgramada } from "@prisma/client";
import { prisma } from "../db";
import { ajustarSaldo, delta } from "./saldo";
import { mesAnioDe } from "./fechas";

// Convierte una transacción programada (ya validada como PENDIENTE por quien llama) en un
// movimiento real y confirmado, aplicando su efecto en el saldo de la cuenta. La fecha del
// movimiento generado usa la fecha programada original (no la fecha de ejecución), para que
// caiga en el mes contable correcto aunque la ejecución automática se demore unas horas.
export async function ejecutarTransaccionProgramada(programada: TransaccionProgramada & { categoria: CategoriaGasto }) {
  const { mes, anio } = mesAnioDe(programada.fechaProgramada);

  return prisma.$transaction(async (tx) => {
    const creada = await tx.transaccion.create({
      data: {
        nombre: programada.nombre,
        tipo: programada.categoria.tipo,
        categoriaId: programada.categoriaId,
        cuentaId: programada.cuentaId,
        valor: programada.valor,
        fecha: programada.fechaProgramada,
        descripcion: "Generada al ejecutar una transacción programada.",
        mes,
        anio,
        estado: "CONFIRMADA",
        transaccionProgramadaId: programada.id,
      },
    });
    await ajustarSaldo(tx, programada.cuentaId, delta(programada.categoria.tipo, programada.valor));
    await tx.transaccionProgramada.update({ where: { id: programada.id }, data: { estado: "EJECUTADA" } });
    return creada;
  });
}
