import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, mensajeError } from "../services/api";
import { Alerta } from "../components/Alerta";
import { ModalNuevaTransaccion } from "../components/ModalNuevaTransaccion";
import type { CategoriaGasto, Cuenta, Transaccion } from "../types";
import { formatoFecha, formatoMoneda, nombreMes } from "../utils/formato";

export default function Transacciones() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get("estado") || "");
  const [filtroTipo, setFiltroTipo] = useState(searchParams.get("tipo") || "");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  // Filtro de mes/año que llega por la URL (ej. desde las tarjetas del Panel principal,
  // "Gastos del mes" → /transacciones?tipo=GASTO&mes=9&anio=2026) — no tiene selector
  // propio en esta pantalla, solo se puede llegar a él por enlace o quitarlo con "Ver todas".
  const mesFiltro = searchParams.get("mes");
  const anioFiltro = searchParams.get("anio");

  function cargar() {
    const params: Record<string, string> = {};
    if (filtroEstado) params.estado = filtroEstado;
    if (filtroTipo) params.tipo = filtroTipo;
    if (mesFiltro) params.mes = mesFiltro;
    if (anioFiltro) params.anio = anioFiltro;
    api
      .get("/transacciones", { params })
      .then((res) => setTransacciones(res.data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, [filtroEstado, filtroTipo, mesFiltro, anioFiltro]);
  useEffect(() => {
    api.get("/categorias").then((res) => setCategorias(res.data));
    api.get("/cuentas").then((res) => setCuentas(res.data));
  }, []);

  async function alternarEstado(t: Transaccion) {
    try {
      await api.put(`/transacciones/${t.id}`, { estado: t.estado === "CONFIRMADA" ? "PENDIENTE" : "CONFIRMADA" });
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function eliminar(t: Transaccion) {
    if (!window.confirm(`¿Eliminar la transacción "${t.nombre}"?`)) return;
    try {
      await api.delete(`/transacciones/${t.id}`);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div>
      <div className="flex-between">
        <h2 className="page-title">Transacciones</h2>
      </div>

      {error && <Alerta tipo="error" mensaje={error} onClose={() => setError("")} />}
      {exito && <Alerta tipo="success" mensaje={exito} onClose={() => setExito("")} />}

      {mesFiltro && anioFiltro && (
        <div className="alert alert-success flex-between" style={{ alignItems: "center" }}>
          <span>
            Mostrando solo {nombreMes(Number(mesFiltro))} {anioFiltro}
            {filtroTipo && ` · ${filtroTipo === "GASTO" ? "Gastos" : "Ingresos"}`}
            {filtroEstado && ` · ${filtroEstado === "CONFIRMADA" ? "Confirmadas" : "Pendientes"}`}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchParams({});
              setFiltroTipo("");
              setFiltroEstado("");
            }}
          >
            Ver todas
          </button>
        </div>
      )}

      <div className="card gap-sm">
        <select className="field" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">Todos los tipos</option>
          <option value="GASTO">Gasto</option>
          <option value="INGRESO">Ingreso</option>
        </select>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">Todos los estados</option>
          <option value="CONFIRMADA">Confirmada</option>
          <option value="PENDIENTE">Pendiente</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Cuenta</th>
              <th>Valor</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transacciones.length === 0 && (
              <tr>
                <td colSpan={7} className="text-muted" style={{ textAlign: "center", padding: 24 }}>
                  No hay transacciones para mostrar.
                </td>
              </tr>
            )}
            {transacciones.map((t) => (
              <tr key={t.id}>
                <td>{formatoFecha(t.fecha)}</td>
                <td>
                  {t.nombre}
                  {t.descripcion && <span className="text-muted" style={{ display: "block", fontSize: "0.78rem" }}>{t.descripcion}</span>}
                </td>
                <td>{t.categoria?.nombre}</td>
                <td>{t.cuenta?.nombre}</td>
                <td style={{ fontWeight: 700, color: t.tipo === "INGRESO" ? "#16a34a" : "#dc2626" }}>
                  {t.tipo === "INGRESO" ? "+" : "-"}
                  {formatoMoneda(t.valor)}
                </td>
                <td>
                  <span className={`badge ${t.estado === "CONFIRMADA" ? "badge-green" : "badge-amber"}`}>{t.estado}</span>
                </td>
                <td className="gap-sm">
                  <button className="btn btn-secondary" onClick={() => alternarEstado(t)}>
                    {t.estado === "CONFIRMADA" ? "Marcar pendiente" : "Confirmar"}
                  </button>
                  <button className="btn btn-danger" onClick={() => eliminar(t)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="fab" onClick={() => setModalAbierto(true)} aria-label="Nueva transacción">
        <IconoMas />
      </button>

      {modalAbierto && (
        <ModalNuevaTransaccion
          categorias={categorias}
          cuentas={cuentas}
          onCerrar={() => setModalAbierto(false)}
          onGuardado={() => {
            setExito("Transacción registrada.");
            cargar();
          }}
        />
      )}
    </div>
  );
}

function IconoMas() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
