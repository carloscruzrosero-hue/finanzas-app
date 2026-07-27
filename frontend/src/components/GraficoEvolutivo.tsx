import type { ResumenMensual } from "../types";
import { formatoMoneda, nombreMes } from "../utils/formato";

// Gráfico en SVG puro (sin librería externa): barras agrupadas de ingresos/gastos por mes,
// con una línea superpuesta de saldo neto. El viewBox usa un ancho porcentual (0-100) y
// preserveAspectRatio="none" para que escale de forma fluida con el contenedor, sin necesitar
// JS de redimensionado — se ve bien tanto en escritorio como en celular.
export function GraficoEvolutivo({ datos }: { datos: ResumenMensual[] }) {
  if (datos.length === 0) return <p className="text-muted">Sin datos para graficar.</p>;

  const ANCHO = 100;
  const ALTO = 60;
  const MARGEN_INF = 10;
  const MARGEN_SUP = 4;
  const ALTURA_UTIL = ALTO - MARGEN_INF - MARGEN_SUP;
  const baseY = ALTO - MARGEN_INF;

  const maxValor = Math.max(1, ...datos.flatMap((d) => [d.totalIngresos, d.totalGastos, Math.abs(d.saldoNeto)]));
  const escalaY = (valor: number) => (Math.abs(valor) / maxValor) * ALTURA_UTIL;

  const anchoGrupo = ANCHO / datos.length;
  const anchoBarra = anchoGrupo * 0.26;

  const puntosLinea = datos
    .map((d, i) => {
      const x = anchoGrupo * i + anchoGrupo / 2;
      const y = baseY - (d.saldoNeto >= 0 ? escalaY(d.saldoNeto) : -escalaY(d.saldoNeto));
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="grafico-evolutivo">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="none" className="grafico-svg" role="img" aria-label="Evolución mensual de ingresos, gastos y saldo neto">
        <line x1={0} y1={baseY} x2={ANCHO} y2={baseY} stroke="#e2e8f0" strokeWidth={0.3} />

        {datos.map((d, i) => {
          const xCentro = anchoGrupo * i + anchoGrupo / 2;
          const xIngreso = xCentro - anchoBarra - 0.4;
          const xGasto = xCentro + 0.4;
          return (
            <g key={`${d.anio}-${d.mes}`}>
              <rect
                x={xIngreso}
                y={baseY - escalaY(d.totalIngresos)}
                width={anchoBarra}
                height={escalaY(d.totalIngresos)}
                fill="#16a34a"
                rx={0.5}
              >
                <title>{`Ingresos ${nombreMes(d.mes)} ${d.anio}: ${formatoMoneda(d.totalIngresos)}`}</title>
              </rect>
              <rect x={xGasto} y={baseY - escalaY(d.totalGastos)} width={anchoBarra} height={escalaY(d.totalGastos)} fill="#dc2626" rx={0.5}>
                <title>{`Gastos ${nombreMes(d.mes)} ${d.anio}: ${formatoMoneda(d.totalGastos)}`}</title>
              </rect>
              <text x={xCentro} y={ALTO - 2} fontSize={3} textAnchor="middle" fill="#64748b">
                {nombreMes(d.mes).substring(0, 3)}
              </text>
            </g>
          );
        })}

        <polyline points={puntosLinea} fill="none" stroke="#1d4ed8" strokeWidth={0.7} />
        {datos.map((d, i) => {
          const x = anchoGrupo * i + anchoGrupo / 2;
          const y = baseY - (d.saldoNeto >= 0 ? escalaY(d.saldoNeto) : -escalaY(d.saldoNeto));
          return (
            <circle key={`punto-${d.anio}-${d.mes}`} cx={x} cy={y} r={0.9} fill="#1d4ed8">
              <title>{`Saldo neto ${nombreMes(d.mes)} ${d.anio}: ${formatoMoneda(d.saldoNeto)}`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="grafico-leyenda">
        <span>
          <i style={{ background: "#16a34a" }} /> Ingresos
        </span>
        <span>
          <i style={{ background: "#dc2626" }} /> Gastos
        </span>
        <span>
          <i style={{ background: "#1d4ed8" }} /> Saldo neto
        </span>
      </div>
    </div>
  );
}
