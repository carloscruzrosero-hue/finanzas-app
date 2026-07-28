import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../services/api";
import { Alerta } from "../components/Alerta";
import { SelectorCategoria } from "../components/SelectorCategoria";
import type { CategoriaGasto, Cuenta, TransaccionProgramada } from "../types";
import { fechaInputAIso, formatoFecha, formatoMoneda } from "../utils/formato";

const hoy = new Date().toISOString().substring(0, 10);
const FORM_VACIO = { nombre: "", categoriaId: "", cuentaId: "", valor: "", fechaProgramada: hoy };

export default function TransaccionesProgramadas() {
  const [programadas, setProgramadas] = useState<TransaccionProgramada[]>([]);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  function cargar() {
    api
      .get("/transacciones-programadas")
      .then((res) => setProgramadas(res.data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, []);
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
      await api.post("/transacciones-programadas", {
        nombre: form.nombre,
        categoriaId: Number(form.categoriaId),
        cuentaId: Number(form.cuentaId),
        valor: Number(form.valor),
        fechaProgramada: fechaInputAIso(form.fechaProgramada),
      });
      setExito("Movimiento programado creado.");
      setForm({ ...FORM_VACIO, fechaProgramada: hoy });
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function ejecutar(p: TransaccionProgramada) {
    if (!window.confirm(`¿Ejecutar "${p.nombre}" ahora? Se registrará como transacción confirmada.`)) return;
    setError("");
    setExito("");
    try {
      await api.post(`/transacciones-programadas/${p.id}/ejecutar`);
      setExito(`"${p.nombre}" ejecutada correctamente.`);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function cancelar(p: TransaccionProgramada) {
    if (!window.confirm(`¿Cancelar "${p.nombre}"?`)) return;
    try {
      await api.put(`/transacciones-programadas/${p.id}`, { estado: "CANCELADA" });
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function eliminar(p: TransaccionProgramada) {
    if (!window.confirm(`¿Eliminar "${p.nombre}"?`)) return;
    try {
      await api.delete(`/transacciones-programadas/${p.id}`);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  const badgeClase = { PENDIENTE: "badge-amber", EJECUTADA: "badge-green", CANCELADA: "badge-gray" } as const;

  return (
    <div>
      <div className="flex-between">
        <h2 className="page-title">Transacciones programadas</h2>
        <button className="btn btn-primary" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? "Cancelar" : "+ Nueva programada"}
        </button>
      </div>
      <p className="text-muted" style={{ marginTop: -12, marginBottom: 16 }}>
        Movimientos puntuales a futuro que aún no han ocurrido. Al ejecutarlos se convierten en una transacción confirmada real.
      </p>

      {error && <Alerta tipo="error" mensaje={error} onClose={() => setError("")} />}
      {exito && <Alerta tipo="success" mensaje={exito} onClose={() => setExito("")} />}

      {mostrarForm && (
        <form onSubmit={guardar} className="card">
          <div className="form-grid">
            <div className="field">
              <label>Nombre</label>
              <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="field">
              <label>Categoría</label>
              <SelectorCategoria
                categorias={categorias}
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
              <label>Fecha programada</label>
              <input required type="date" value={form.fechaProgramada} onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })} />
            </div>
            <div className="field">
              <button type="submit" className="btn btn-primary">
                Programar
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Cuenta</th>
              <th>Fecha</th>
              <th>Valor</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {programadas.length === 0 && (
              <tr>
                <td colSpan={7} className="text-muted" style={{ textAlign: "center", padding: 24 }}>
                  No hay transacciones programadas todavía.
                </td>
              </tr>
            )}
            {programadas.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.categoria?.nombre}</td>
                <td>{p.cuenta?.nombre}</td>
                <td>{formatoFecha(p.fechaProgramada)}</td>
                <td style={{ fontWeight: 700 }}>{formatoMoneda(p.valor)}</td>
                <td>
                  <span className={`badge ${badgeClase[p.estado]}`}>{p.estado}</span>
                </td>
                <td className="gap-sm">
                  {p.estado === "PENDIENTE" && (
                    <>
                      <button className="btn btn-primary" onClick={() => ejecutar(p)}>
                        Ejecutar
                      </button>
                      <button className="btn btn-secondary" onClick={() => cancelar(p)}>
                        Cancelar
                      </button>
                    </>
                  )}
                  <button className="btn btn-danger" onClick={() => eliminar(p)}>
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
