import { useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../services/api";
import { Alerta } from "./Alerta";
import { SelectorCategoria } from "./SelectorCategoria";
import type { CategoriaGasto, Cuenta, TipoCategoria } from "../types";
import { fechaInputAIso } from "../utils/formato";

const hoy = new Date().toISOString().substring(0, 10);
const FORM_VACIO = {
  valor: "",
  tipo: "GASTO" as TipoCategoria,
  categoriaId: "",
  nombre: "",
  fecha: hoy,
  cuentaId: "",
  descripcion: "",
  pendiente: false,
};

// Formulario de alta rápida: el monto es el dato más relevante (grande, arriba, como en
// una calculadora) y el resto de campos van en una sola columna de filas "icono + valor",
// en vez del grid de <OrdenesPermanentes>/<Deudas> — pensado para llenarse de un tirón,
// como pidió el usuario tomando de referencia otra app de finanzas personales.
export function ModalNuevaTransaccion({
  categorias,
  cuentas,
  onCerrar,
  onGuardado,
}: {
  categorias: CategoriaGasto[];
  cuentas: Cuenta[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.categoriaId || !form.cuentaId) {
      setError("Selecciona categoría y cuenta.");
      return;
    }
    setGuardando(true);
    try {
      await api.post("/transacciones", {
        nombre: form.nombre || (categorias.find((c) => c.id === Number(form.categoriaId))?.nombre ?? "Movimiento"),
        tipo: form.tipo,
        categoriaId: Number(form.categoriaId),
        cuentaId: Number(form.cuentaId),
        valor: Number(form.valor),
        fecha: fechaInputAIso(form.fecha),
        descripcion: form.descripcion || undefined,
        estado: form.pendiente ? "PENDIENTE" : "CONFIRMADA",
      });
      onGuardado();
      onCerrar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <form className="modal-transaccion" onSubmit={guardar}>
        <div className="modal-header">
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <IconoCerrar />
          </button>
          <h3>Nueva transacción</h3>
        </div>

        {error && (
          <div style={{ padding: "0 20px" }}>
            <Alerta tipo="error" mensaje={error} onClose={() => setError("")} />
          </div>
        )}

        <div className="monto-fila">
          <span className="signo">$</span>
          <input
            required
            autoFocus
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
          />
        </div>

        <div className="fila-campo">
          <span className="fila-icono">
            <IconoTipo />
          </span>
          <span className="fila-etiqueta">Tipo</span>
          <div className="tipo-toggle" style={{ flex: 1 }}>
            <button
              type="button"
              className={form.tipo === "GASTO" ? "activo-gasto" : ""}
              onClick={() => setForm({ ...form, tipo: "GASTO", categoriaId: "" })}
            >
              Gasto
            </button>
            <button
              type="button"
              className={form.tipo === "INGRESO" ? "activo-ingreso" : ""}
              onClick={() => setForm({ ...form, tipo: "INGRESO", categoriaId: "" })}
            >
              Ingreso
            </button>
          </div>
        </div>

        <div className="fila-campo">
          <span className="fila-icono">
            <IconoCategoria />
          </span>
          <span className="fila-etiqueta">Categoría</span>
          <div className="fila-valor">
            <SelectorCategoria
              categorias={categorias}
              tipo={form.tipo}
              valor={form.categoriaId}
              onSeleccionar={(c) => setForm({ ...form, categoriaId: String(c.id) })}
            />
          </div>
        </div>

        <div className="fila-campo">
          <span className="fila-icono">
            <IconoTitulo />
          </span>
          <span className="fila-etiqueta">Título</span>
          <div className="fila-valor">
            <input
              placeholder="Insertar título"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
        </div>

        <div className="fila-campo">
          <span className="fila-icono">
            <IconoFecha />
          </span>
          <span className="fila-etiqueta">Fecha</span>
          <div className="fila-valor">
            <input required type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </div>
        </div>

        <div className="fila-campo">
          <span className="fila-icono">
            <IconoCuenta />
          </span>
          <span className="fila-etiqueta">Cuenta</span>
          <div className="fila-valor">
            <select required value={form.cuentaId} onChange={(e) => setForm({ ...form, cuentaId: e.target.value })}>
              <option value="">Seleccionar cuenta</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="fila-campo">
          <span className="fila-icono">
            <IconoNotas />
          </span>
          <span className="fila-etiqueta">Notas</span>
          <div className="fila-valor">
            <input
              placeholder="Insertar apunte"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>
        </div>

        <label className="checkbox-linea">
          <input type="checkbox" checked={form.pendiente} onChange={(e) => setForm({ ...form, pendiente: e.target.checked })} />
          <span>Guardar como pendiente (todavía no afecta el saldo de la cuenta)</span>
        </label>

        <div className="modal-footer">
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? "Guardando..." : "Aceptar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function IconoCerrar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconoTipo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10l5-6 5 6M7 14l5 6 5-6" />
    </svg>
  );
}

function IconoCategoria() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L3.24 3.24A1 1 0 0 0 2.24 4.24l0 6.35a2 2 0 0 0 .59 1.41l9.59 9.59a2 2 0 0 0 2.82 0l6.35-6.35a2 2 0 0 0 0-2.82Z" />
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconoTitulo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function IconoFecha() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconoCuenta() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10 12 4l9 6M4 10v9M20 10v9M8 19v-6M12 19v-6M16 19v-6M2 21h20" />
    </svg>
  );
}

function IconoNotas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}
