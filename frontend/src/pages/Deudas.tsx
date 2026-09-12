import { Fragment, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, mensajeError } from "../services/api";
import { Alerta } from "../components/Alerta";
import { SelectorCategoria } from "../components/SelectorCategoria";
import { FRECUENCIA_DEUDA_LABEL } from "../types";
import type { CategoriaGasto, Cuenta, Deuda, FrecuenciaDeuda } from "../types";
import { fechaInputAIso, formatoFecha, formatoMoneda } from "../utils/formato";

const hoy = new Date().toISOString().substring(0, 10);
const FORM_VACIO = {
  deudor: "",
  concepto: "",
  montoTotal: "",
  frecuencia: "MENSUAL" as FrecuenciaDeuda,
  numeroCuotas: "1",
  fechaInicio: hoy,
  observaciones: "",
};

const FORM_PAGO_VACIO = {
  monto: "",
  fecha: hoy,
  cuentaId: "",
  categoriaId: "",
  observaciones: "",
};

// Semáforo de estado de una cuota individual — mismo criterio visual de badges
// (verde/ámbar/rojo/gris) ya usado en el resto de la app.
function badgeCuota(cuota: { estado: string; vencida?: boolean }) {
  if (cuota.estado === "PAGADA") return <span className="badge badge-green">Pagada</span>;
  if (cuota.vencida) return <span className="badge badge-red">Vencida</span>;
  return <span className="badge badge-amber">Pendiente</span>;
}

// Semáforo de estado a nivel de deuda, para la tabla principal.
function badgeDeuda(d: Deuda) {
  if (d.estado === "CANCELADA") return <span className="badge badge-gray">Cancelada</span>;
  if (d.estado === "PAGADA") return <span className="badge badge-green">Pagada</span>;
  if (d.tieneVencidas) return <span className="badge badge-red">Vencida</span>;
  return <span className="badge badge-amber">Al día</span>;
}

export default function Deudas() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const [deudaAbiertaId, setDeudaAbiertaId] = useState<number | null>(null);
  const [deudaDetalle, setDeudaDetalle] = useState<Deuda | null>(null);
  const [cuotaPagoId, setCuotaPagoId] = useState<number | null>(null);
  const [formPago, setFormPago] = useState(FORM_PAGO_VACIO);

  function cargar() {
    api
      .get("/deudas")
      .then((res) => setDeudas(res.data))
      .catch((err) => setError(mensajeError(err)));
  }

  useEffect(cargar, []);
  useEffect(() => {
    api.get("/categorias").then((res) => setCategorias(res.data));
    api.get("/cuentas").then((res) => setCuentas(res.data));
  }, []);

  function cargarDetalle(id: number) {
    api
      .get(`/deudas/${id}`)
      .then((res) => setDeudaDetalle(res.data))
      .catch((err) => setError(mensajeError(err)));
  }

  function alternarDetalle(id: number) {
    if (deudaAbiertaId === id) {
      setDeudaAbiertaId(null);
      setDeudaDetalle(null);
      setCuotaPagoId(null);
    } else {
      setDeudaAbiertaId(id);
      setCuotaPagoId(null);
      cargarDetalle(id);
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setExito("");
    try {
      await api.post("/deudas", {
        deudor: form.deudor,
        concepto: form.concepto,
        montoTotal: Number(form.montoTotal),
        frecuencia: form.frecuencia,
        numeroCuotas: Number(form.numeroCuotas),
        fechaInicio: fechaInputAIso(form.fechaInicio),
        observaciones: form.observaciones || undefined,
      });
      setExito("Deuda registrada.");
      setForm({ ...FORM_VACIO, fechaInicio: hoy });
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function eliminar(d: Deuda) {
    if (!window.confirm(`¿Eliminar la deuda "${d.concepto}" de ${d.deudor}? Esto revierte cualquier pago ya reflejado en tus cuentas.`)) return;
    try {
      await api.delete(`/deudas/${d.id}`);
      if (deudaAbiertaId === d.id) {
        setDeudaAbiertaId(null);
        setDeudaDetalle(null);
      }
      cargar();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function cancelar(d: Deuda) {
    if (!window.confirm(`¿Marcar como cancelada la deuda "${d.concepto}" de ${d.deudor}? Las cuotas ya pagadas no se ven afectadas.`)) return;
    try {
      await api.put(`/deudas/${d.id}`, { estado: "CANCELADA" });
      cargar();
      if (deudaAbiertaId === d.id) cargarDetalle(d.id);
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  function abrirFormPago(cuotaId: number) {
    setCuotaPagoId(cuotaId);
    setFormPago(FORM_PAGO_VACIO);
  }

  async function registrarPago(e: FormEvent, deudaId: number) {
    e.preventDefault();
    setError("");
    setExito("");
    if (!cuotaPagoId) return;
    try {
      await api.post(`/deudas/${deudaId}/cuotas/${cuotaPagoId}/pagos`, {
        monto: Number(formPago.monto),
        fecha: fechaInputAIso(formPago.fecha),
        cuentaId: formPago.cuentaId ? Number(formPago.cuentaId) : undefined,
        categoriaId: formPago.categoriaId ? Number(formPago.categoriaId) : undefined,
        observaciones: formPago.observaciones || undefined,
      });
      setExito("Pago registrado.");
      setCuotaPagoId(null);
      cargar();
      cargarDetalle(deudaId);
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  async function eliminarPago(deudaId: number, cuotaId: number, pagoId: number) {
    if (!window.confirm("¿Eliminar este pago? Si generó un movimiento en una cuenta, también se revierte.")) return;
    try {
      await api.delete(`/deudas/${deudaId}/cuotas/${cuotaId}/pagos/${pagoId}`);
      cargar();
      cargarDetalle(deudaId);
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div>
      <div className="flex-between">
        <h2 className="page-title">Deudas pendientes</h2>
        <button className="btn btn-primary" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? "Cancelar" : "+ Nueva deuda"}
        </button>
      </div>

      <p className="text-muted" style={{ marginTop: -12, marginBottom: 16 }}>
        Valores que te deben pagar a ti. Registra la periodicidad de pago y ve dando de baja cada cuota a medida que te pagan — si te abonan más
        de lo que corresponde a una cuota, el excedente se aplica automáticamente a la(s) siguiente(s).
      </p>

      {error && <Alerta tipo="error" mensaje={error} onClose={() => setError("")} />}
      {exito && <Alerta tipo="success" mensaje={exito} onClose={() => setExito("")} />}

      {mostrarForm && (
        <form onSubmit={guardar} className="card">
          <div className="form-grid">
            <div className="field">
              <label>Deudor</label>
              <input required value={form.deudor} onChange={(e) => setForm({ ...form, deudor: e.target.value })} />
            </div>
            <div className="field">
              <label>Concepto</label>
              <input required value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} />
            </div>
            <div className="field">
              <label>Monto total</label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={form.montoTotal}
                onChange={(e) => setForm({ ...form, montoTotal: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Número de cuotas</label>
              <input
                required
                type="number"
                min={1}
                value={form.numeroCuotas}
                onChange={(e) => setForm({ ...form, numeroCuotas: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Periodicidad</label>
              <select value={form.frecuencia} onChange={(e) => setForm({ ...form, frecuencia: e.target.value as FrecuenciaDeuda })}>
                {Object.entries(FRECUENCIA_DEUDA_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Fecha de la primera cuota</label>
              <input required type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
            </div>
            <div className="field">
              <label>Observaciones (opcional)</label>
              <input value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
            </div>
            <div className="field">
              <button type="submit" className="btn btn-primary">
                Registrar deuda
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Deudor</th>
              <th>Concepto</th>
              <th>Periodicidad</th>
              <th>Cuotas</th>
              <th>Saldo pendiente</th>
              <th>Próximo vencimiento</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {deudas.length === 0 && (
              <tr>
                <td colSpan={8} className="text-muted" style={{ textAlign: "center", padding: 24 }}>
                  No hay deudas registradas todavía.
                </td>
              </tr>
            )}
            {deudas.map((d) => (
              <Fragment key={d.id}>
                <tr>
                  <td>{d.deudor}</td>
                  <td>{d.concepto}</td>
                  <td>{FRECUENCIA_DEUDA_LABEL[d.frecuencia]}</td>
                  <td>
                    {d.cuotasPagadas}/{d.totalCuotas}
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatoMoneda(d.saldoPendiente)}</td>
                  <td className="text-muted">{d.proximoVencimiento ? formatoFecha(d.proximoVencimiento) : "—"}</td>
                  <td>{badgeDeuda(d)}</td>
                  <td className="gap-sm">
                    <button className="btn btn-secondary" onClick={() => alternarDetalle(d.id)}>
                      {deudaAbiertaId === d.id ? "Ocultar" : "Ver cuotas"}
                    </button>
                    {d.estado === "ACTIVA" && (
                      <button className="btn btn-secondary" onClick={() => cancelar(d)}>
                        Cancelar
                      </button>
                    )}
                    <button className="btn btn-danger" onClick={() => eliminar(d)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
                {deudaAbiertaId === d.id && (
                  <tr>
                    <td colSpan={8} style={{ background: "var(--color-bg)", padding: 16 }}>
                      {!deudaDetalle ? (
                        <p className="text-muted">Cargando cuotas...</p>
                      ) : (
                        <div>
                          {deudaDetalle.observaciones && <p className="text-muted">{deudaDetalle.observaciones}</p>}
                          <table>
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Vencimiento</th>
                                <th>Monto esperado</th>
                                <th>Pagado</th>
                                <th>Estado</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {deudaDetalle.cuotas.map((c) => (
                                <Fragment key={c.id}>
                                  <tr>
                                    <td>{c.numero}</td>
                                    <td>{formatoFecha(c.fechaVencimiento)}</td>
                                    <td>{formatoMoneda(c.montoEsperado)}</td>
                                    <td>{formatoMoneda(c.montoPagado)}</td>
                                    <td>{badgeCuota(c)}</td>
                                    <td className="gap-sm">
                                      {c.estado === "PENDIENTE" && d.estado === "ACTIVA" && (
                                        <button className="btn btn-secondary" onClick={() => abrirFormPago(c.id)}>
                                          Registrar pago
                                        </button>
                                      )}
                                      {c.pagos && c.pagos.length > 0 && (
                                        <span className="text-muted">
                                          {c.pagos.length} pago{c.pagos.length > 1 ? "s" : ""}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                  {c.pagos && c.pagos.length > 0 && (
                                    <tr>
                                      <td></td>
                                      <td colSpan={5}>
                                        <div className="gap-sm" style={{ flexWrap: "wrap" }}>
                                          {c.pagos.map((p) => (
                                            <span key={p.id} className="badge badge-gray">
                                              {formatoFecha(p.fecha)} — {formatoMoneda(p.monto)}
                                              {p.cuenta ? ` (${p.cuenta.nombre})` : ""}
                                              <button
                                                onClick={() => eliminarPago(d.id, c.id, p.id)}
                                                style={{ marginLeft: 6, cursor: "pointer", border: "none", background: "none" }}
                                                title="Eliminar pago"
                                              >
                                                ✕
                                              </button>
                                            </span>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                  {cuotaPagoId === c.id && (
                                    <tr>
                                      <td colSpan={6}>
                                        <form onSubmit={(e) => registrarPago(e, d.id)} className="card" style={{ margin: "8px 0" }}>
                                          <div className="form-grid">
                                            <div className="field">
                                              <label>Monto</label>
                                              <input
                                                required
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={formPago.monto}
                                                onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                                              />
                                            </div>
                                            <div className="field">
                                              <label>Fecha</label>
                                              <input
                                                required
                                                type="date"
                                                value={formPago.fecha}
                                                onChange={(e) => setFormPago({ ...formPago, fecha: e.target.value })}
                                              />
                                            </div>
                                            <div className="field">
                                              <label>Cuenta (opcional)</label>
                                              <select
                                                value={formPago.cuentaId}
                                                onChange={(e) => setFormPago({ ...formPago, cuentaId: e.target.value })}
                                              >
                                                <option value="">No reflejar en ninguna cuenta</option>
                                                {cuentas.map((cta) => (
                                                  <option key={cta.id} value={cta.id}>
                                                    {cta.nombre}
                                                  </option>
                                                ))}
                                              </select>
                                            </div>
                                            {formPago.cuentaId && (
                                              <div className="field">
                                                <label>Categoría</label>
                                                <SelectorCategoria
                                                  categorias={categorias}
                                                  tipo="INGRESO"
                                                  valor={formPago.categoriaId}
                                                  onSeleccionar={(cat) => setFormPago({ ...formPago, categoriaId: String(cat.id) })}
                                                />
                                              </div>
                                            )}
                                            <div className="field">
                                              <label>Observaciones (opcional)</label>
                                              <input
                                                value={formPago.observaciones}
                                                onChange={(e) => setFormPago({ ...formPago, observaciones: e.target.value })}
                                              />
                                            </div>
                                            <div className="field gap-sm">
                                              <button type="submit" className="btn btn-primary">
                                                Guardar pago
                                              </button>
                                              <button type="button" className="btn btn-secondary" onClick={() => setCuotaPagoId(null)}>
                                                Cancelar
                                              </button>
                                            </div>
                                          </div>
                                          {formPago.cuentaId && (
                                            <p className="text-muted" style={{ marginBottom: 0 }}>
                                              Este pago se reflejará como un ingreso confirmado en la cuenta seleccionada.
                                            </p>
                                          )}
                                        </form>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
