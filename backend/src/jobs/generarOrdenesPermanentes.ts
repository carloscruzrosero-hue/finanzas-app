import { mesActual } from "../utils/fechas";
import { generarPeriodo } from "../utils/ordenesPermanentes";

const INTERVALO_MS = 6 * 60 * 60 * 1000; // 6 horas

// Antes, una orden permanente solo generaba su transacción del mes al crearse (una sola
// vez) o cuando alguien apretaba "Generar movimientos del mes" a mano — al entrar un mes
// nuevo, cada orden se quedaba sin generar hasta que alguien lo recordara. Esto la pone
// al día sola. Corre inmediatamente al arrancar (el backend está en el plan gratuito de
// Render y se duerme tras 15 min sin uso — "al arrancar" es, en la práctica, cada vez que
// alguien entra a la app después de que estuvo dormida) y luego cada 6 horas mientras
// siga despierto. Es seguro llamarlo repetido: generarPeriodo no duplica lo ya generado.
async function generarMesActual() {
  try {
    const { mes, anio } = mesActual();
    const generadas = await generarPeriodo(mes, anio);
    if (generadas.length > 0) {
      console.log(`[ordenes-permanentes] Generadas ${generadas.length} transacción(es) automáticamente para ${mes}/${anio}.`);
    }
  } catch (err) {
    console.error("[ordenes-permanentes] Error generando el mes actual:", err);
  }
}

export function iniciarGeneracionOrdenesPermanentes(): void {
  generarMesActual();
  setInterval(generarMesActual, INTERVALO_MS);
}
