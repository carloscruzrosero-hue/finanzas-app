export function formatoMoneda(valor: number, moneda = "USD"): string {
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: moneda }).format(valor);
}

export function formatoFecha(fecha: string | Date): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return d.toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "2-digit" });
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function nombreMes(mes: number): string {
  return MESES[mes - 1] ?? String(mes);
}

// Convierte un valor de <input type="date"> (YYYY-MM-DD, hora local implícita) a un
// ISO string a mediodía para evitar que el cambio de zona horaria lo mande al día
// anterior al guardarlo.
export function fechaInputAIso(valor: string): string {
  return new Date(`${valor}T12:00:00`).toISOString();
}

export function isoAFechaInput(iso: string): string {
  return iso.substring(0, 10);
}
