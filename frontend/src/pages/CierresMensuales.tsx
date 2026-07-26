import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../services/api";
import { Alerta } from "../components/Alerta";
import type { CierreMensual } from "../types";
import { formatoFecha, formatoMoneda, nombreMes } from "../utils/formato";

const ahora = new Date();

export default function CierresMensuales() {
  const [cierres, setCierres] = useState<CierreMensual[]>([]);
  const [mes, setMes] = useState(ahora.getMonth() + 1);
  const [anio, setAnio] = useState(ahora.getFullYear());
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [procesando, setProcesando] = useState(false);

  function cargar() {
    api
      .get("/cierres-mensuales")
      .then((res) => setCierres(res.data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, []);

  async function cerrarMes(e: FormEvent) {
    e.preventDefault();
    setError("");
    setExito("");
    setProcesando(true);
    try {
      await api.post("/cierres-mensuales/cerrar", { mes, anio });
      setExito(`Cierre de ${nombreMes(mes)} ${anio} realizado correctamente.`);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setProcesando(false);
    }
  }

  async function reabrir(c: CierreMensual) {
    if (!window.confirm(`¿Reabrir el mes ${nombreMes(c.mes)} ${c.anio}? Podrás volver a modificar transacciones de ese periodo.`)) return;
    try {
      await api.post("/cierres-mensuales/reabrir", { mes: c.mes, anio: c.anio });
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div>
      <h2 className="page-title">Cierres mensuales</h2>
      <p className="text-muted" style={{ marginTop: -12, marginBottom: 16 }}>
        Al cerrar un mes se calculan los totales a partir de las transacciones confirmadas de ese periodo. Es seguro repetirlo: recalcula en vez de
        duplicar.
      </p>

      {error && <Alerta tipo="error" mensaje={error} onClose={() => setError("")} />}
      {exito && <Alerta tipo="success" mensaje={exito} onClose={() => setExito("")} />}

      <form onSubmit={cerrarMes} className="card">
        <div className="form-grid">
          <div className="field">
            <label>Mes</label>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {nombreMes(m)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Año</label>
            <input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} />
          </div>
          <div className="field">
            <button type="submit" className="btn btn-primary" disabled={procesando}>
              {procesando ? "Cerrando..." : "Cerrar / recalcular este mes"}
            </button>
          </div>
        </div>
      </form>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Periodo</th>
              <th>Ingresos</th>
              <th>Gastos</th>
              <th>Saldo neto</th>
              <th>Fecha de cierre</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cierres.length === 0 && (
              <tr>
                <td colSpan={7} className="text-muted" style={{ textAlign: "center", padding: 24 }}>
                  Todavía no se ha cerrado ningún mes.
                </td>
              </tr>
            )}
            {cierres.map((c) => (
              <tr key={c.id}>
                <td>
                  {nombreMes(c.mes)} {c.anio}
                </td>
                <td style={{ color: "#16a34a" }}>{formatoMoneda(c.totalIngresos)}</td>
                <td style={{ color: "#dc2626" }}>{formatoMoneda(c.totalGastos)}</td>
                <td style={{ fontWeight: 700 }}>{formatoMoneda(c.saldoNeto)}</td>
                <td className="text-muted">{c.fechaCierre ? formatoFecha(c.fechaCierre) : "—"}</td>
                <td>
                  <span className={`badge ${c.estado === "CERRADO" ? "badge-green" : "badge-amber"}`}>{c.estado}</span>
                </td>
                <td>
                  {c.estado === "CERRADO" && (
                    <button className="btn btn-secondary" onClick={() => reabrir(c)}>
                      Reabrir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
