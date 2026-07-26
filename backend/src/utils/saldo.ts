import { Prisma } from "@prisma/client";

// Una transacción solo afecta el saldo de la cuenta cuando está CONFIRMADA; mientras
// esté PENDIENTE es solo un registro informativo. El signo del ajuste depende del tipo.
export function delta(tipo: string, valor: number): number {
  return tipo === "INGRESO" ? valor : -valor;
}

export async function ajustarSaldo(tx: Prisma.TransactionClient, cuentaId: number, monto: number): Promise<void> {
  if (monto === 0) return;
  await tx.cuenta.update({ where: { id: cuentaId }, data: { saldoActual: { increment: monto } } });
}
