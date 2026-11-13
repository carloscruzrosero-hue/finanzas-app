// Set de iconos de línea (24×24, trazo redondeado) usado en la navegación y el panel.
// Se dibujan con SVG inline en vez de una librería de iconos para no sumar dependencias
// por una docena de formas simples; heredan el color del texto (currentColor).
const TRAZOS = {
  inicio: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  movimientos: "M7 7h13M16 3l4 4-4 4M17 17H4M8 13l-4 4 4 4",
  deudas: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3",
  reportes: "M4 20h16M7 16v-5M12 16V7M17 16v-8",
  mas: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  ordenes: "M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3",
  programadas: "M4 5h16v16H4zM4 9h16M8 3v4M16 3v4M8 13h3v3H8z",
  cuentas: "M3 7a2 2 0 0 1 2-2h12v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14.5h.01",
  categorias: "M20.6 13.4 11 3.8a2 2 0 0 0-1.4-.6H4.2a1 1 0 0 0-1 1v5.4a2 2 0 0 0 .6 1.4l9.6 9.6a2 2 0 0 0 2.8 0l4.4-4.4a2 2 0 0 0 0-2.8zM7.5 7.5h.01",
  ingreso: "M12 3v13M6 10l6 6 6-6M5 21h14",
  gasto: "M12 21V8M6 14l6-6 6 6M5 3h14",
  neto: "M3 17l6-6 4 4 8-8M15 7h6v6",
  pendiente: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  historico: "M3 12a9 9 0 1 0 2.6-6.4L3 8M3 3v5h5M12 7v5l3 2",
  acumulado: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  alerta: "M12 3 2 21h20zM12 10v5M12 18h.01",
  subida: "M3 17l6-6 4 4 8-8M15 7h6v6",
  bajada: "M3 7l6 6 4-4 8 8M15 17h6v-6",
  cerrar: "M6 6l12 12M18 6 6 18",
} as const;

export type NombreIcono = keyof typeof TRAZOS;

/** Icono de línea; decorativo (aria-hidden) salvo que se le pase un `titulo` accesible. */
export function Icono({ nombre, tamano = 20, titulo }: { nombre: NombreIcono; tamano?: number; titulo?: string }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={titulo ? undefined : true}
      role={titulo ? "img" : undefined}
    >
      {titulo && <title>{titulo}</title>}
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
