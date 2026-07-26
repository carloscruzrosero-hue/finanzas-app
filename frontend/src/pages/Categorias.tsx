import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../services/api";
import { Alerta } from "../components/Alerta";
import type { CategoriaGasto, TipoCategoria } from "../types";

const FORM_VACIO = { nombre: "", tipo: "GASTO" as TipoCategoria, color: "" };

export default function Categorias() {
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  function cargar() {
    api
      .get("/categorias")
      .then((res) => setCategorias(res.data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, []);

  function editar(c: CategoriaGasto) {
    setEditandoId(c.id);
    setForm({ nombre: c.nombre, tipo: c.tipo, color: c.color ?? "" });
    setMostrarForm(true);
  }

  function cancelar() {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setMostrarForm(false);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setExito("");
    const payload = { nombre: form.nombre, tipo: form.tipo, color: form.color || undefined };
    try {
      if (editandoId) {
        await api.put(`/categorias/${editandoId}`, payload);
        setExito("Categoría actualizada.");
      } else {
        await api.post("/categorias", payload);
        setExito("Categoría creada.");
      }
      cancelar();
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function eliminar(c: CategoriaGasto) {
    if (!window.confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return;
    try {
      await api.delete(`/categorias/${c.id}`);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div>
      <div className="flex-between">
        <h2 className="page-title">Categorías</h2>
        <button className="btn btn-primary" onClick={() => (mostrarForm ? cancelar() : setMostrarForm(true))}>
          {mostrarForm ? "Cancelar" : "+ Nueva categoría"}
        </button>
      </div>

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
              <label>Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoCategoria })}>
                <option value="GASTO">Gasto</option>
                <option value="INGRESO">Ingreso</option>
              </select>
            </div>
            <div className="field">
              <label>Color (opcional)</label>
              <input type="color" value={form.color || "#0f766e"} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
            <div className="field">
              <button type="submit" className="btn btn-primary">
                {editandoId ? "Guardar cambios" : "Crear categoría"}
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
              <th>Tipo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 && (
              <tr>
                <td colSpan={3} className="text-muted" style={{ textAlign: "center", padding: 24 }}>
                  No hay categorías registradas todavía.
                </td>
              </tr>
            )}
            {categorias.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.color && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: c.color,
                        marginRight: 8,
                      }}
                    />
                  )}
                  {c.nombre}
                </td>
                <td>
                  <span className={`badge ${c.tipo === "INGRESO" ? "badge-green" : "badge-red"}`}>{c.tipo}</span>
                </td>
                <td className="gap-sm">
                  <button className="btn btn-secondary" onClick={() => editar(c)}>
                    Editar
                  </button>
                  <button className="btn btn-danger" onClick={() => eliminar(c)}>
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
