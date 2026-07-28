import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../services/api";
import { Alerta } from "../components/Alerta";
import { SelectorCategoria } from "../components/SelectorCategoria";
import type { CategoriaGasto, Cuenta, Transaccion, TipoCategoria } from "../types";
import { fechaInputAIso, formatoFecha, formatoMoneda } from "../utils/formato";

const hoy = new Date().toISOString().substring(0, 10);
const FORM_VACIO = {
  nombre: "",
  tipo: "GASTO" as TipoCategoria,
  categoriaId: "",
  cuentaId: "",
  valor: "",
  fecha: hoy,
  descripcion: "",
  estado: "CONFIRMADA",
};

export default function Transacciones() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [form, setForm] = useState(FORM_VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  function cargar() {
    const params: Record<string, string> = {};
    if (filtroEstado) params.estado = filtroEstado;
    if (filtroTipo) params.tipo = filtroTipo;
    api
      .get("/transacciones", { params })
      .then((res) => setTransacciones(res.data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, [filtroEstado, filtroTipo]);
  useEffect(() => {
    api.get("/categorias").then((res) => setCategorias(res.data));
    api.get("/cuentas").then((res) => setCuentas(res.data));
  }, []);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setExito("");
    if (!form.categoriaId || !form.cuentaId) {
      setError("Selecciona categoría y cuenta.");
      return;
    }
    try {
      await api.post("/transacciones", {
        nombre: form.nombre,
        tipo: form.tipo,
        categoriaId: Number(form.categoriaId),
        cuentaId: Number(form.cuentaId),
        valor: Number(form.valor),
        fecha: fechaInputAIso(form.fecha),
        descripcion: form.descripcion || undefined,
        estado: form.estado,
      });
      setExito("Transacción registrada.");
      setForm({ ...FORM_VACIO, fecha: hoy });
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

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
        <button className="btn btn-primary" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? "Cancelar" : "+ Nueva transacción"}
        </button>
      </div>

      {error && <Alerta tipo="error" mensaje={error} onClose={() => setError("")} />}
      {exito && <Alerta tipo="success" mensaje={exito} onClose={() => setExito("")} />}

      {mostrarForm && (
        <form onSubmit={guardar} className="card">
          <div className="form-grid">
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Nombre del gasto/ingreso</label>
              <input
                required
                placeholder="Ej: Supermercado Corabastos, Sueldo julio, Cine con amigos..."
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoCategoria, categoriaId: "" })}>
                <option value="GASTO">Gasto</option>
                <option value="INGRESO">Ingreso</option>
              </select>
            </div>
            <div className="field">
              <label>Categoría</label>
              <SelectorCategoria
                categorias={categorias}
                tipo={form.tipo}
                valor={form.categoriaId}
                onSeleccionar={(c) => setForm({ ...form, categoriaId: String(c.id) })}
              />
            </div>
            <div className="field">
              <label>Cuenta</label>
              <select required value={form.cuentaId} onChange={(e) => setForm({ ...form, cuentaId: e.target.value })}>
                <option value="">Selecciona...</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Valor</label>
              <input required type="number" step="0.01" min="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
            </div>
            <div className="field">
              <label>Fecha</label>
              <input required type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </div>
            <div className="field">
              <label>Estado</label>
              <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Notas adicionales (opcional)</label>
              <input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div className="field">
              <button type="submit" className="btn btn-primary">
                Registrar
              </button>
            </div>
          </div>
        </form>
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
    </div>
  );
}
