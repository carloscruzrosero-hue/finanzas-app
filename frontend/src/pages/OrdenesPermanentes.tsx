import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../services/api";
import { Alerta } from "../components/Alerta";
import { SelectorCategoria } from "../components/SelectorCategoria";
import { FRECUENCIA_LABEL } from "../types";
import type { CategoriaGasto, Cuenta, FrecuenciaOrden, OrdenPermanente } from "../types";
import { fechaInputAIso, formatoFecha, formatoMoneda, nombreMes } from "../utils/formato";

const hoy = new Date().toISOString().substring(0, 10);

// Una orden "finalizada" es la que ya no debería seguir generando movimientos: se
// desactivó manualmente, o su fecha de fin ya pasó (aunque nadie la haya desactivado a
// mano todavía) — se calcula al vuelo, nunca se guarda, para que no quede desactualizada.
function estaFinalizada(o: { activa: boolean; fechaFin?: string | null }): boolean {
  if (!o.activa) return true;
  return Boolean(o.fechaFin && new Date(o.fechaFin) < new Date());
}

const FORM_VACIO = {
  nombre: "",
  categoriaId: "",
  cuentaId: "",
  valor: "",
  diaCobroPago: "1",
  frecuencia: "MENSUAL" as FrecuenciaOrden,
  fechaInicio: hoy,
  fechaFin: "",
};

export default function OrdenesPermanentes() {
  const [ordenes, setOrdenes] = useState<OrdenPermanente[]>([]);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [generando, setGenerando] = useState(false);
  const [filtro, setFiltro] = useState<"vigentes" | "finalizadas" | "todas">("vigentes");
  const [avisoMesPasado, setAvisoMesPasado] = useState<{ ordenId: number; nombre: string; inicio: Date } | null>(null);

  function cargar() {
    api
      .get("/ordenes-permanentes")
      .then((res) => setOrdenes(res.data))
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
      const res = await api.post("/ordenes-permanentes", {
        nombre: form.nombre,
        categoriaId: Number(form.categoriaId),
        cuentaId: Number(form.cuentaId),
        valor: Number(form.valor),
        diaCobroPago: Number(form.diaCobroPago),
        frecuencia: form.frecuencia,
        fechaInicio: fechaInputAIso(form.fechaInicio),
        fechaFin: form.fechaFin ? fechaInputAIso(form.fechaFin) : null,
      });
      const nuevaOrden = res.data;
      setForm({ ...FORM_VACIO, fechaInicio: hoy });
      setMostrarForm(false);

      // Antes había que acordarse de pulsar "Generar movimientos del mes" aparte — una
      // orden creada hoy (o con fecha ya pasada) se quedaba sin su transacción del mes
      // actual hasta que alguien lo hiciera manualmente. Ahora se genera sola de una vez
      // (idempotente: no duplica si luego se vuelve a generar el mes).
      const ahora = new Date();
      const r = await api.post("/ordenes-permanentes/generar", {
        ordenId: nuevaOrden.id,
        mes: ahora.getMonth() + 1,
        anio: ahora.getFullYear(),
      });
      setExito(
        r.data.generadas > 0
          ? "Orden permanente creada y se generó su transacción de este mes."
          : "Orden permanente creada."
      );
      cargar();

      // Si además arranca en un mes ya pasado, esos meses anteriores no se generan
      // solos — se le pregunta al usuario, con un aviso visible en pantalla (no un
      // window.confirm nativo, fácil de pasar por alto), si quiere completar también
      // ese historial retroactivo o dejarlo solo desde este mes (ya generado arriba).
      const inicio = new Date(`${form.fechaInicio}T12:00:00`);
      const esMesPasado = inicio.getFullYear() < ahora.getFullYear() || (inicio.getFullYear() === ahora.getFullYear() && inicio.getMonth() < ahora.getMonth());
      if (esMesPasado) {
        setAvisoMesPasado({ ordenId: nuevaOrden.id, nombre: nuevaOrden.nombre, inicio });
      }
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function generarDesdeInicioOriginal() {
    if (!avisoMesPasado) return;
    const { ordenId, nombre, inicio } = avisoMesPasado;
    const ahora = new Date();
    setAvisoMesPasado(null);
    setGenerando(true);
    try {
      const r = await api.post("/ordenes-permanentes/generar", {
        ordenId,
        mes: inicio.getMonth() + 1,
        anio: inicio.getFullYear(),
        hasta: { mes: ahora.getMonth() + 1, anio: ahora.getFullYear() },
      });
      setExito(`"${nombre}": se generaron ${r.data.generadas} transacción(es) desde ${nombreMes(inicio.getMonth() + 1)} ${inicio.getFullYear()} hasta hoy.`);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGenerando(false);
    }
  }

  // La transacción del mes actual ya se generó sola al crear la orden (ver guardar()) —
  // este botón solo descarta el historial retroactivo de los meses anteriores.
  function dejarSoloDesdeAhora() {
    if (!avisoMesPasado) return;
    setExito(`"${avisoMesPasado.nombre}" quedó activa solo desde este mes en adelante.`);
    setAvisoMesPasado(null);
  }

  async function alternarActiva(o: OrdenPermanente) {
    try {
      await api.put(`/ordenes-permanentes/${o.id}`, { activa: !o.activa });
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function eliminar(o: OrdenPermanente) {
    if (!window.confirm(`¿Eliminar la orden permanente "${o.nombre}"?`)) return;
    try {
      await api.delete(`/ordenes-permanentes/${o.id}`);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function generar() {
    setError("");
    setExito("");
    setGenerando(true);
    try {
      const res = await api.post("/ordenes-permanentes/generar", {});
      setExito(
        res.data.generadas > 0
          ? `Se generaron ${res.data.generadas} transacción(es) pendiente(s) para este mes.`
          : "No había movimientos nuevos por generar para este mes (ya estaban generados)."
      );
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGenerando(false);
    }
  }

  const ordenesFiltradas = ordenes.filter((o) => {
    if (filtro === "todas") return true;
    const finalizada = estaFinalizada(o);
    return filtro === "finalizadas" ? finalizada : !finalizada;
  });

  return (
    <div>
      <div className="flex-between">
        <h2 className="page-title">Órdenes permanentes</h2>
        <div className="gap-sm">
          <button className="btn btn-secondary" onClick={generar} disabled={generando}>
            {generando ? "Generando..." : "Generar movimientos del mes"}
          </button>
          <button className="btn btn-primary" onClick={() => setMostrarForm((v) => !v)}>
            {mostrarForm ? "Cancelar" : "+ Nueva orden"}
          </button>
        </div>
      </div>

      <p className="text-muted" style={{ marginTop: -12, marginBottom: 16 }}>
        Representan pagos o cobros fijos recurrentes (arriendo, suscripciones, nómina). Usa "Generar movimientos del mes" para replicarlas como
        transacciones pendientes del periodo actual — es seguro repetirlo, no duplica lo ya generado.
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
              <label>Día de cobro/pago</label>
              <input required type="number" min={1} max={31} value={form.diaCobroPago} onChange={(e) => setForm({ ...form, diaCobroPago: e.target.value })} />
            </div>
            <div className="field">
              <label>Frecuencia</label>
              <select value={form.frecuencia} onChange={(e) => setForm({ ...form, frecuencia: e.target.value as FrecuenciaOrden })}>
                {Object.entries(FRECUENCIA_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Fecha de inicio</label>
              <input required type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
            </div>
            <div className="field">
              <label>Fecha de fin (opcional)</label>
              <input type="date" value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} />
            </div>
            <div className="field">
              <button type="submit" className="btn btn-primary">
                Crear orden
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="card gap-sm">
        <select value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)} style={{ maxWidth: 200 }}>
          <option value="vigentes">Solo vigentes</option>
          <option value="finalizadas">Solo finalizadas</option>
          <option value="todas">Todas</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Cuenta</th>
              <th>Día</th>
              <th>Frecuencia</th>
              <th>Valor</th>
              <th>Vigencia</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ordenesFiltradas.length === 0 && (
              <tr>
                <td colSpan={9} className="text-muted" style={{ textAlign: "center", padding: 24 }}>
                  {ordenes.length === 0 ? "No hay órdenes permanentes registradas todavía." : "No hay órdenes que coincidan con este filtro."}
                </td>
              </tr>
            )}
            {ordenesFiltradas.map((o) => {
              const finalizada = estaFinalizada(o);
              return (
                <tr key={o.id}>
                  <td>{o.nombre}</td>
                  <td>{o.categoria?.nombre}</td>
                  <td>{o.cuenta?.nombre}</td>
                  <td>{o.diaCobroPago}</td>
                  <td>{FRECUENCIA_LABEL[o.frecuencia]}</td>
                  <td style={{ fontWeight: 700 }}>{formatoMoneda(o.valor)}</td>
                  <td className="text-muted">
                    {formatoFecha(o.fechaInicio)} {o.fechaFin ? `→ ${formatoFecha(o.fechaFin)}` : "→ indefinido"}
                  </td>
                  <td>
                    <span className={`badge ${finalizada ? "badge-gray" : "badge-green"}`}>{finalizada ? "Finalizada" : "Vigente"}</span>
                  </td>
                  <td className="gap-sm">
                    <button className="btn btn-secondary" onClick={() => alternarActiva(o)}>
                      {o.activa ? "Desactivar" : "Activar"}
                    </button>
                    <button className="btn btn-danger" onClick={() => eliminar(o)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {avisoMesPasado && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && dejarSoloDesdeAhora()}>
          <div className="card" style={{ maxWidth: 460, margin: 0 }}>
            <h3 style={{ marginTop: 0, color: "var(--color-navy)" }}>Esta orden inicia en un mes ya pasado</h3>
            <p className="text-muted">
              "{avisoMesPasado.nombre}" inicia en{" "}
              <strong>
                {nombreMes(avisoMesPasado.inicio.getMonth() + 1)} {avisoMesPasado.inicio.getFullYear()}
              </strong>
              . Ya se generó su transacción de este mes. ¿Quieres completar también las transacciones pendientes de los meses anteriores desde
              esa fecha, o dejarlo solo desde ahora?
            </p>
            <div className="gap-sm" style={{ justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={dejarSoloDesdeAhora} disabled={generando}>
                Dejarlo solo desde ahora
              </button>
              <button className="btn btn-primary" onClick={generarDesdeInicioOriginal} disabled={generando}>
                Completar desde {nombreMes(avisoMesPasado.inicio.getMonth() + 1)} {avisoMesPasado.inicio.getFullYear()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
