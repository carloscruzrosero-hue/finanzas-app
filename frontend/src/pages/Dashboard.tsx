import { useEffect, useState } from "react";
import { api, mensajeError } from "../services/api";
import { Alerta } from "../components/Alerta";
import type { DashboardData } from "../types";
import { formatoFecha, formatoMoneda, nombreMes } from "../utils/formato";

export default function Dashboard() {
  const [datos, setDatos] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setDatos(res.data))
      .catch((err) => setError(mensajeError(err)));
  }, []);

  if (error) return <Alerta tipo="error" mensaje={error} />;
  if (!datos) return <p className="text-muted">Cargando...</p>;

  return (
    <div>
      <h2 className="page-title">
        Panel principal — {nombreMes(datos.periodo.mes)} {datos.periodo.anio}
      </h2>

      <div className="stat-grid">
        <div className="stat-card">
          <p className="label">Saldo total</p>
          <p className="valor">{formatoMoneda(datos.saldoTotal)}</p>
        </div>
        <div className="stat-card positivo">
          <p className="label">Ingresos del mes</p>
          <p className="valor">{formatoMoneda(datos.ingresosMes)}</p>
        </div>
        <div className="stat-card negativo">
          <p className="label">Gastos del mes</p>
          <p className="valor">{formatoMoneda(datos.gastosMes)}</p>
        </div>
        <div className={`stat-card ${datos.saldoNetoMes >= 0 ? "positivo" : "negativo"}`}>
          <p className="label">Saldo neto del mes</p>
          <p className="valor">{formatoMoneda(datos.saldoNetoMes)}</p>
        </div>
        <div className="stat-card">
          <p className="label">Movimientos pendientes</p>
          <p className="valor">{datos.pendientesMes}</p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Órdenes permanentes del mes</h3>
        {datos.resumenOrdenesMes.length === 0 ? (
          <p className="text-muted">No hay órdenes permanentes vigentes este mes.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Cuenta</th>
                <th>Frecuencia</th>
                <th>Valor</th>
                <th>Estado del mes</th>
              </tr>
            </thead>
            <tbody>
              {datos.resumenOrdenesMes.map((o) => (
                <tr key={o.id}>
                  <td>{o.nombre}</td>
                  <td>{o.categoria?.nombre}</td>
                  <td>{o.cuenta?.nombre}</td>
                  <td>{o.frecuencia}</td>
                  <td>{formatoMoneda(o.valor)}</td>
                  <td>
                    {o.generada ? <span className="badge badge-green">Generada</span> : <span className="badge badge-amber">Pendiente</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Próximas transacciones programadas</h3>
        {datos.proximasTransaccionesProgramadas.length === 0 ? (
          <p className="text-muted">No hay movimientos programados próximos.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Fecha</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {datos.proximasTransaccionesProgramadas.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.categoria?.nombre}</td>
                  <td>{formatoFecha(p.fechaProgramada)}</td>
                  <td>{formatoMoneda(p.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
