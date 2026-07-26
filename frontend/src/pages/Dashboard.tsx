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
        <div className="stat-card">
          <p className="label">Cierre del mes</p>
          <p className="valor" style={{ fontSize: "1.1rem" }}>
            {datos.cierreMesActual ? <span className="badge badge-green">Cerrado</span> : <span className="badge badge-amber">Abierto</span>}
          </p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Cuentas</h3>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {datos.cuentas.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{c.tipo}</td>
                <td style={{ fontWeight: 700 }}>{formatoMoneda(c.saldoActual, c.moneda)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Órdenes permanentes activas</h3>
        {datos.ordenesPermanentesActivas.length === 0 ? (
          <p className="text-muted">No hay órdenes permanentes activas.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Día de pago</th>
                <th>Frecuencia</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {datos.ordenesPermanentesActivas.map((o) => (
                <tr key={o.id}>
                  <td>{o.nombre}</td>
                  <td>{o.categoria?.nombre}</td>
                  <td>{o.diaCobroPago}</td>
                  <td>{o.frecuencia}</td>
                  <td>{formatoMoneda(o.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
