import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../services/api";
import { Alerta } from "../components/Alerta";
import { GraficoEvolutivo } from "../components/GraficoEvolutivo";
import type { DashboardData, ResumenMensual } from "../types";
import { formatoFecha, formatoMoneda, nombreMes } from "../utils/formato";

export default function Dashboard() {
  const [datos, setDatos] = useState<DashboardData | null>(null);
  const [evolucion, setEvolucion] = useState<ResumenMensual[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setDatos(res.data))
      .catch((err) => setError(mensajeError(err)));
    // Sin parámetros, el backend devuelve los últimos 6 meses por defecto.
    api
      .get("/reportes/resumen-mensual")
      .then((res) => setEvolucion(res.data))
      .catch(() => {});
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
        <div className="flex-between">
          <h3 style={{ margin: 0 }}>Evolución de los últimos meses</h3>
          <Link to="/reportes" className="btn btn-secondary">
            Ver reportes completos
          </Link>
        </div>
        <GraficoEvolutivo datos={evolucion} />
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Pagos atrasados</h3>
        {datos.alertasDeudas.length === 0 ? (
          <p className="text-muted">No hay cuotas de deudas vencidas sin pagar. 🎉</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Deudor</th>
                <th>Concepto</th>
                <th>Cuota</th>
                <th>Monto pendiente</th>
                <th>Venció</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {datos.alertasDeudas.map((a) => (
                <tr key={a.cuotaId}>
                  <td>{a.deudor}</td>
                  <td>{a.concepto}</td>
                  <td>#{a.numero}</td>
                  <td style={{ fontWeight: 700 }}>{formatoMoneda(a.montoPendiente)}</td>
                  <td>
                    <span className="badge badge-red">{formatoFecha(a.fechaVencimiento)}</span>
                  </td>
                  <td>
                    <Link to="/deudas" className="btn btn-secondary">
                      Ver deuda
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
