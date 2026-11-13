import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mensajeError } from "../services/api";
import { Alerta } from "../components/Alerta";
import { GraficoEvolutivo } from "../components/GraficoEvolutivo";
import { Icono } from "../components/Iconos";
import type { NombreIcono } from "../components/Iconos";
import type { DashboardData, ResumenMensual, TotalesPeriodo } from "../types";
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
  const c = datos.comparativos;

  return (
    <div>
      <h2 className="page-title">
        Panel principal — {nombreMes(datos.periodo.mes)} {datos.periodo.anio}
      </h2>

      <div className="stat-grid">
        <div className="stat-card">
          <p className="label">
            <span className="stat-icono"><Icono nombre="cuentas" tamano={16} /></span>
            Saldo total
          </p>
          <p className="valor">{formatoMoneda(datos.saldoTotal)}</p>
        </div>
        <Link
          to={`/transacciones?tipo=INGRESO&mes=${datos.periodo.mes}&anio=${datos.periodo.anio}`}
          className="stat-card positivo"
          style={{ display: "block", textDecoration: "none" }}
        >
          <p className="label">
            <span className="stat-icono stat-icono-verde"><Icono nombre="ingreso" tamano={16} /></span>
            Ingresos del mes
          </p>
          <p className="valor">{formatoMoneda(datos.ingresosMes)}</p>
          <Variacion actual={datos.ingresosMes} sinDatos={sinMovimientos(c.mesAnterior)} anterior={c.mesAnterior.ingresos} etiqueta={mesCorto(c.mesAnterior.mes)} />
          <Variacion actual={datos.ingresosMes} sinDatos={sinMovimientos(c.mismoMesAnioAnterior)} anterior={c.mismoMesAnioAnterior.ingresos} etiqueta={`${mesCorto(c.mismoMesAnioAnterior.mes)} ${c.mismoMesAnioAnterior.anio}`} />
        </Link>
        <Link
          to={`/transacciones?tipo=GASTO&mes=${datos.periodo.mes}&anio=${datos.periodo.anio}`}
          className="stat-card negativo"
          style={{ display: "block", textDecoration: "none" }}
        >
          <p className="label">
            <span className="stat-icono stat-icono-rojo"><Icono nombre="gasto" tamano={16} /></span>
            Gastos del mes
          </p>
          <p className="valor">{formatoMoneda(datos.gastosMes)}</p>
          <Variacion actual={datos.gastosMes} sinDatos={sinMovimientos(c.mesAnterior)} anterior={c.mesAnterior.gastos} etiqueta={mesCorto(c.mesAnterior.mes)} subirEsMalo />
          <Variacion
            actual={datos.gastosMes}
            sinDatos={sinMovimientos(c.mismoMesAnioAnterior)}
            anterior={c.mismoMesAnioAnterior.gastos}
            etiqueta={`${mesCorto(c.mismoMesAnioAnterior.mes)} ${c.mismoMesAnioAnterior.anio}`}
            subirEsMalo
          />
        </Link>
        <div className={`stat-card ${datos.saldoNetoMes >= 0 ? "positivo" : "negativo"}`}>
          <p className="label">
            <span className={`stat-icono ${datos.saldoNetoMes >= 0 ? "stat-icono-verde" : "stat-icono-rojo"}`}>
              <Icono nombre="neto" tamano={16} />
            </span>
            Saldo neto del mes
          </p>
          <p className="valor">{formatoMoneda(datos.saldoNetoMes)}</p>
          <Variacion actual={datos.saldoNetoMes} sinDatos={sinMovimientos(c.mesAnterior)} anterior={c.mesAnterior.neto} etiqueta={mesCorto(c.mesAnterior.mes)} enMonto />
          <Variacion
            actual={datos.saldoNetoMes}
            sinDatos={sinMovimientos(c.mismoMesAnioAnterior)}
            anterior={c.mismoMesAnioAnterior.neto}
            etiqueta={`${mesCorto(c.mismoMesAnioAnterior.mes)} ${c.mismoMesAnioAnterior.anio}`}
            enMonto
          />
        </div>
        <Link
          to={`/transacciones?estado=PENDIENTE&mes=${datos.periodo.mes}&anio=${datos.periodo.anio}`}
          className="stat-card"
          style={{ display: "block", textDecoration: "none" }}
        >
          <p className="label">
            <span className="stat-icono"><Icono nombre="pendiente" tamano={16} /></span>
            Movimientos pendientes
          </p>
          <p className="valor">{datos.pendientesMes}</p>
        </Link>
      </div>

      <p className="nota-comparativos">
        Variaciones contra el mes completo indicado. {nombreMes(datos.periodo.mes)} todavía está en curso, así que puede seguir cambiando.
      </p>

      <div className="card">
        <h3 className="titulo-icono" style={{ marginTop: 0 }}>
          <Icono nombre="neto" tamano={18} /> Cómo vamos
        </h3>
        <div className="resumen-acumulado">
          <BloqueAcumulado icono="acumulado" titulo={`En lo que va de ${c.acumuladoAnio.anio}`} totales={c.acumuladoAnio} />
          <BloqueAcumulado icono="historico" titulo="Histórico total" totales={c.historico} />
        </div>
      </div>

      <div className="card">
        <div className="flex-between">
          <h3 className="titulo-icono" style={{ margin: 0 }}>
            <Icono nombre="reportes" tamano={18} /> Evolución de los últimos meses
          </h3>
          <Link to="/reportes" className="btn btn-secondary">
            Ver reportes completos
          </Link>
        </div>
        <GraficoEvolutivo datos={evolucion} />
      </div>

      <div className="card">
        <h3 className="titulo-icono" style={{ marginTop: 0 }}>
          <Icono nombre="alerta" tamano={18} /> Pagos atrasados
        </h3>
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
        <h3 className="titulo-icono" style={{ marginTop: 0 }}>
          <Icono nombre="ordenes" tamano={18} /> Órdenes permanentes del mes
        </h3>
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

/** Un periodo sin ingresos ni gastos confirmados no es comparable (no hay registros, no es $0 real). */
function sinMovimientos(t: TotalesPeriodo): boolean {
  return t.ingresos === 0 && t.gastos === 0;
}

function mesCorto(mes: number): string {
  return nombreMes(mes).slice(0, 3).toLowerCase() + ".";
}

/**
 * Línea pequeña de variación contra un periodo anterior. En porcentaje por defecto; `enMonto`
 * la muestra como diferencia en dinero (para el neto, donde un % sobre un valor negativo
 * no tiene sentido). `subirEsMalo` invierte el color (para gastos, subir es rojo).
 */
function Variacion({
  actual,
  anterior,
  etiqueta,
  subirEsMalo = false,
  enMonto = false,
  sinDatos = false,
}: {
  actual: number;
  anterior: number;
  sinDatos?: boolean;
  etiqueta: string;
  subirEsMalo?: boolean;
  enMonto?: boolean;
}) {
  const diferencia = actual - anterior;
  const titulo = `${etiqueta}: ${formatoMoneda(anterior)}`;

  if (sinDatos || (!enMonto && anterior === 0)) {
    return (
      <p className="variacion neutra" title={titulo}>
        Sin datos de {etiqueta}
      </p>
    );
  }
  if (Math.abs(diferencia) < 0.005) {
    return (
      <p className="variacion neutra" title={titulo}>
        = Igual que {etiqueta}
      </p>
    );
  }

  const sube = diferencia > 0;
  const esBueno = subirEsMalo ? !sube : sube;
  const texto = enMonto
    ? `${sube ? "+" : "−"}${formatoMoneda(Math.abs(diferencia))}`
    : `${Math.round((Math.abs(diferencia) / Math.abs(anterior)) * 100)}%`;

  return (
    <p className={`variacion ${esBueno ? "buena" : "mala"}`} title={titulo}>
      <Icono nombre={sube ? "subida" : "bajada"} tamano={13} />
      {texto} vs {etiqueta}
    </p>
  );
}

function BloqueAcumulado({ icono, titulo, totales }: { icono: NombreIcono; titulo: string; totales: TotalesPeriodo }) {
  return (
    <div className="bloque-acumulado">
      <p className="bloque-titulo">
        <Icono nombre={icono} tamano={16} />
        {titulo}
      </p>
      <div className="bloque-fila">
        <span>Ingresos</span>
        <strong className="texto-verde">{formatoMoneda(totales.ingresos)}</strong>
      </div>
      <div className="bloque-fila">
        <span>Gastos</span>
        <strong className="texto-rojo">{formatoMoneda(totales.gastos)}</strong>
      </div>
      <div className="bloque-fila bloque-total">
        <span>Neto</span>
        <strong className={totales.neto >= 0 ? "texto-verde" : "texto-rojo"}>{formatoMoneda(totales.neto)}</strong>
      </div>
    </div>
  );
}
