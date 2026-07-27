import { prisma } from "../db";
import { ejecutarTransaccionProgramada } from "../utils/transaccionesProgramadas";

const INTERVALO_MS = 15 * 60 * 1000;

// Busca transacciones programadas cuya fecha ya llegó y las ejecuta automáticamente (antes solo
// existía un botón manual "Ejecutar", así que una programada vencida se quedaba en PENDIENTE
// para siempre y nunca generaba el movimiento real que debía sumar en los gastos del mes).
async function revisarPendientes() {
  try {
    const vencidas = await prisma.transaccionProgramada.findMany({
      where: { estado: "PENDIENTE", fechaProgramada: { lte: new Date() } },
      include: { categoria: true },
    });

    for (const programada of vencidas) {
      try {
        await ejecutarTransaccionProgramada(programada);
        console.log(`[transacciones-programadas] Ejecutada automáticamente #${programada.id} "${programada.nombre}".`);
      } catch (err) {
        console.error(`[transacciones-programadas] Error ejecutando #${programada.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[transacciones-programadas] Error revisando pendientes:", err);
  }
}

// Corre inmediatamente al arrancar (para ponerse al día tras un despliegue o un reinicio por
// suspensión del plan gratuito de Render) y luego cada 15 minutos.
export function iniciarEjecucionTransaccionesProgramadas() {
  revisarPendientes();
  setInterval(revisarPendientes, INTERVALO_MS);
}
