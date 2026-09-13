// Evita que Render (plan gratuito) duerma el backend por inactividad: se auto-pinguea
// su propia URL pública cada cierto tiempo. Render duerme un web service tras ~15 min
// sin tráfico entrante real (no cuenta actividad interna del proceso, por eso los demás
// jobs con setInterval no evitan el sueño por sí solos — hace falta una petición HTTP
// real de entrada). 10 minutos deja margen de sobra sin pinguear más seguido de lo
// necesario. Usa /api/health, que no toca la base de datos. Mismo patrón que
// sistema-de-rutinas (ver backend/src/jobs/keepAlive.ts de ese proyecto).
const INTERVALO_MS = 10 * 60 * 1000;

function urlPropia(): string | null {
  const url = process.env.SELF_PING_URL || process.env.RENDER_EXTERNAL_URL;
  return url ? url.replace(/\/$/, "") : null;
}

async function ping(): Promise<void> {
  const base = urlPropia();
  if (!base) return;
  try {
    const res = await fetch(`${base}/api/health`);
    console.log(`[keep-alive] Ping a ${base}/api/health → ${res.status}`);
  } catch (err) {
    console.error("[keep-alive] Falló el ping:", err);
  }
}

export function iniciarKeepAlive(): void {
  if (!urlPropia()) {
    console.log("[keep-alive] SELF_PING_URL / RENDER_EXTERNAL_URL no configuradas, keep-alive desactivado.");
    return;
  }
  setInterval(ping, INTERVALO_MS);
}
