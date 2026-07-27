import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { api, mensajeError } from "../services/api";
import { Alerta } from "../components/Alerta";
import { GraficoEvolutivo } from "../components/GraficoEvolutivo";
import type { ResumenMensual, Transaccion } from "../types";
import { formatoFecha, formatoMoneda, nombreMes } from "../utils/formato";

const ahora = new Date();

function ultimosMeses(cantidad: number) {
  const cursor = new Date(ahora.getFullYear(), ahora.getMonth() - (cantidad - 1), 1);
  return { mes: cursor.getMonth() + 1, anio: cursor.getFullYear() };
}

export default function Reportes() {
  const inicioDefecto = ultimosMeses(6);
  const [desdeMes, setDesdeMes] = useState(inicioDefecto.mes);
  const [desdeAnio, setDesdeAnio] = useState(inicioDefecto.anio);
  const [hastaMes, setHastaMes] = useState(ahora.getMonth() + 1);
  const [hastaAnio, setHastaAnio] = useState(ahora.getFullYear());
  const [resumen, setResumen] = useState<ResumenMensual[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState(false);

  function cargar() {
    setCargando(true);
    setError("");
    api
      .get("/reportes/resumen-mensual", { params: { desdeMes, desdeAnio, hastaMes, hastaAnio } })
      .then((res) => setResumen(res.data))
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }

  // Carga inicial con los valores por defecto del rango; deliberadamente solo al montar.
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(cargar, []);

  const totalIngresos = resumen.reduce((acc, r) => acc + r.totalIngresos, 0);
  const totalGastos = resumen.reduce((acc, r) => acc + r.totalGastos, 0);

  async function exportarExcel() {
    setExportando(true);
    setError("");
    try {
      const res = await api.get<Transaccion[]>("/reportes/detalle", { params: { desdeMes, desdeAnio, hastaMes, hastaAnio } });
      const detalle = res.data;

      const hojaResumen = XLSX.utils.json_to_sheet(
        resumen.map((r) => ({
          Mes: `${nombreMes(r.mes)} ${r.anio}`,
          Ingresos: r.totalIngresos,
          Gastos: r.totalGastos,
          "Saldo neto": r.saldoNeto,
        }))
      );
      const hojaDetalle = XLSX.utils.json_to_sheet(
        detalle.map((t) => ({
          Fecha: formatoFecha(t.fecha),
          Nombre: t.nombre,
          Tipo: t.tipo,
          Categoría: t.categoria?.nombre ?? "",
          Cuenta: t.cuenta?.nombre ?? "",
          Valor: t.valor,
          Notas: t.descripcion ?? "",
        }))
      );

      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hojaResumen, "Resumen mensual");
      XLSX.utils.book_append_sheet(libro, hojaDetalle, "Detalle de movimientos");
      XLSX.writeFile(libro, `reporte-finanzas-${desdeAnio}-${desdeMes}_a_${hastaAnio}-${hastaMes}.xlsx`);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setExportando(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">Reportes</h2>
      <p className="text-muted" style={{ marginTop: -12, marginBottom: 16 }}>
        Resumen de ingresos y gastos por mes, calculado en vivo a partir de tus transacciones confirmadas.
      </p>

      {error && <Alerta tipo="error" mensaje={error} onClose={() => setError("")} />}

      <div className="card">
        <div className="form-grid">
          <div className="field">
            <label>Desde (mes)</label>
            <select value={desdeMes} onChange={(e) => setDesdeMes(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {nombreMes(m)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Desde (año)</label>
            <input type="number" value={desdeAnio} onChange={(e) => setDesdeAnio(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>Hasta (mes)</label>
            <select value={hastaMes} onChange={(e) => setHastaMes(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {nombreMes(m)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Hasta (año)</label>
            <input type="number" value={hastaAnio} onChange={(e) => setHastaAnio(Number(e.target.value))} />
          </div>
          <div className="field gap-sm">
            <button className="btn btn-primary" onClick={cargar} disabled={cargando}>
              {cargando ? "Consultando..." : "Consultar"}
            </button>
            <button className="btn btn-secondary" onClick={exportarExcel} disabled={exportando || resumen.length === 0}>
              {exportando ? "Exportando..." : "Exportar a Excel"}
            </button>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card positivo">
          <p className="label">Total ingresos del rango</p>
          <p className="valor">{formatoMoneda(totalIngresos)}</p>
        </div>
        <div className="stat-card negativo">
          <p className="label">Total gastos del rango</p>
          <p className="valor">{formatoMoneda(totalGastos)}</p>
        </div>
        <div className={`stat-card ${totalIngresos - totalGastos >= 0 ? "positivo" : "negativo"}`}>
          <p className="label">Saldo neto del rango</p>
          <p className="valor">{formatoMoneda(totalIngresos - totalGastos)}</p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Evolución mensual</h3>
        <GraficoEvolutivo datos={resumen} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Mes</th>
              <th>Ingresos</th>
              <th>Gastos</th>
              <th>Saldo neto</th>
            </tr>
          </thead>
          <tbody>
            {resumen.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted" style={{ textAlign: "center", padding: 24 }}>
                  {cargando ? "Consultando..." : "Sin datos para el rango seleccionado."}
                </td>
              </tr>
            )}
            {resumen.map((r) => (
              <tr key={`${r.anio}-${r.mes}`}>
                <td>
                  {nombreMes(r.mes)} {r.anio}
                </td>
                <td style={{ color: "#16a34a" }}>{formatoMoneda(r.totalIngresos)}</td>
                <td style={{ color: "#dc2626" }}>{formatoMoneda(r.totalGastos)}</td>
                <td style={{ fontWeight: 700 }}>{formatoMoneda(r.saldoNeto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
