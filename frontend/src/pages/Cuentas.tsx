import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../services/api";
import { Alerta } from "../components/Alerta";
import { TIPOS_CUENTA_LABEL } from "../types";
import type { Cuenta, TipoCuenta } from "../types";
import { formatoMoneda } from "../utils/formato";

const FORM_VACIO = { nombre: "", tipo: "BANCO" as TipoCuenta, saldoActual: "0", moneda: "USD" };

export default function Cuentas() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  function cargar() {
    api
      .get("/cuentas")
      .then((res) => setCuentas(res.data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, []);

  function editar(c: Cuenta) {
    setEditandoId(c.id);
    setForm({ nombre: c.nombre, tipo: c.tipo, saldoActual: String(c.saldoActual), moneda: c.moneda });
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
    const payload = { nombre: form.nombre, tipo: form.tipo, saldoActual: Number(form.saldoActual), moneda: form.moneda };
    try {
      if (editandoId) {
        await api.put(`/cuentas/${editandoId}`, payload);
        setExito("Cuenta actualizada.");
      } else {
        await api.post("/cuentas", payload);
        setExito("Cuenta creada.");
      }
      cancelar();
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function eliminar(c: Cuenta) {
    if (!window.confirm(`¿Eliminar la cuenta "${c.nombre}"?`)) return;
    try {
      await api.delete(`/cuentas/${c.id}`);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div>
      <div className="flex-between">
        <h2 className="page-title">Cuentas</h2>
        <button className="btn btn-primary" onClick={() => (mostrarForm ? cancelar() : setMostrarForm(true))}>
          {mostrarForm ? "Cancelar" : "+ Nueva cuenta"}
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
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoCuenta })}>
                {Object.entries(TIPOS_CUENTA_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Saldo {editandoId ? "actual" : "inicial"}</label>
              <input required type="number" step="0.01" value={form.saldoActual} onChange={(e) => setForm({ ...form, saldoActual: e.target.value })} />
            </div>
            <div className="field">
              <label>Moneda</label>
              <input required value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value.toUpperCase() })} maxLength={3} />
            </div>
            <div className="field">
              <button type="submit" className="btn btn-primary">
                {editandoId ? "Guardar cambios" : "Crear cuenta"}
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
              <th>Saldo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cuentas.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted" style={{ textAlign: "center", padding: 24 }}>
                  No hay cuentas registradas todavía.
                </td>
              </tr>
            )}
            {cuentas.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{TIPOS_CUENTA_LABEL[c.tipo]}</td>
                <td style={{ fontWeight: 700 }}>{formatoMoneda(c.saldoActual, c.moneda)}</td>
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
