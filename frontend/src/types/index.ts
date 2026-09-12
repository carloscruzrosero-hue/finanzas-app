export type TipoCuenta = "EFECTIVO" | "BANCO" | "TARJETA_CREDITO";
export type TipoCategoria = "GASTO" | "INGRESO";
export type EstadoTransaccion = "PENDIENTE" | "CONFIRMADA";
export type FrecuenciaOrden = "MENSUAL" | "QUINCENAL" | "ANUAL";
export type EstadoProgramada = "PENDIENTE" | "EJECUTADA" | "CANCELADA";
export type FrecuenciaDeuda = "UNICO" | "QUINCENAL" | "MENSUAL" | "ANUAL";
export type EstadoDeuda = "ACTIVA" | "PAGADA" | "CANCELADA";
export type EstadoCuota = "PENDIENTE" | "PAGADA";

export const TIPOS_CUENTA_LABEL: Record<TipoCuenta, string> = {
  EFECTIVO: "Efectivo",
  BANCO: "Banco",
  TARJETA_CREDITO: "Tarjeta de crédito",
};

export const FRECUENCIA_LABEL: Record<FrecuenciaOrden, string> = {
  MENSUAL: "Mensual",
  QUINCENAL: "Quincenal",
  ANUAL: "Anual",
};

export const FRECUENCIA_DEUDA_LABEL: Record<FrecuenciaDeuda, string> = {
  UNICO: "Pago único",
  QUINCENAL: "Quincenal",
  MENSUAL: "Mensual",
  ANUAL: "Anual",
};

export interface Cuenta {
  id: number;
  nombre: string;
  tipo: TipoCuenta;
  saldoActual: number;
  moneda: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoriaGasto {
  id: number;
  nombre: string;
  tipo: TipoCategoria;
  color?: string | null;
  icono?: string | null;
  categoriaPadreId?: number | null;
  categoriaPadre?: CategoriaGasto | null;
  subcategorias?: CategoriaGasto[];
}

export interface Transaccion {
  id: number;
  nombre: string;
  tipo: TipoCategoria;
  categoriaId: number;
  categoria?: CategoriaGasto;
  cuentaId: number;
  cuenta?: Cuenta;
  valor: number;
  fecha: string;
  descripcion?: string | null;
  mes: number;
  anio: number;
  estado: EstadoTransaccion;
  ordenPermanenteId?: number | null;
  transaccionProgramadaId?: number | null;
}

export interface OrdenPermanente {
  id: number;
  nombre: string;
  categoriaId: number;
  categoria?: CategoriaGasto;
  cuentaId: number;
  cuenta?: Cuenta;
  valor: number;
  diaCobroPago: number;
  frecuencia: FrecuenciaOrden;
  activa: boolean;
  fechaInicio: string;
  fechaFin?: string | null;
}

export interface TransaccionProgramada {
  id: number;
  nombre: string;
  categoriaId: number;
  categoria?: CategoriaGasto;
  cuentaId: number;
  cuenta?: Cuenta;
  valor: number;
  fechaProgramada: string;
  estado: EstadoProgramada;
}

export interface PagoDeuda {
  id: number;
  cuotaId: number;
  monto: number;
  fecha: string;
  cuentaId?: number | null;
  cuenta?: Cuenta | null;
  transaccionId?: number | null;
  observaciones?: string | null;
}

export interface CuotaDeuda {
  id: number;
  deudaId: number;
  numero: number;
  montoEsperado: number;
  fechaVencimiento: string;
  estado: EstadoCuota;
  montoPagado: number;
  fechaPago?: string | null;
  vencida?: boolean;
  pagos?: PagoDeuda[];
}

export interface Deuda {
  id: number;
  deudor: string;
  concepto: string;
  montoTotal: number;
  moneda: string;
  frecuencia: FrecuenciaDeuda;
  numeroCuotas: number;
  fechaInicio: string;
  estado: EstadoDeuda;
  observaciones?: string | null;
  cuotas: CuotaDeuda[];
  // Agregados calculados por el backend (ver deudas.routes.ts::conAgregados).
  cuotasPagadas: number;
  totalCuotas: number;
  montoPagadoTotal: number;
  saldoPendiente: number;
  tieneVencidas: boolean;
  cuotasVencidas: number;
  proximoVencimiento?: string | null;
}

export interface AlertaDeuda {
  cuotaId: number;
  deudaId: number;
  deudor: string;
  concepto: string;
  numero: number;
  montoPendiente: number;
  fechaVencimiento: string;
}

export interface ResumenMensual {
  mes: number;
  anio: number;
  totalIngresos: number;
  totalGastos: number;
  saldoNeto: number;
}

export interface ResumenOrdenMes {
  id: number;
  nombre: string;
  valor: number;
  frecuencia: FrecuenciaOrden;
  categoria?: CategoriaGasto;
  cuenta?: Cuenta;
  generada: boolean;
}

export interface DashboardData {
  periodo: { mes: number; anio: number };
  saldoTotal: number;
  ingresosMes: number;
  gastosMes: number;
  saldoNetoMes: number;
  pendientesMes: number;
  resumenOrdenesMes: ResumenOrdenMes[];
  proximasTransaccionesProgramadas: TransaccionProgramada[];
  alertasDeudas: AlertaDeuda[];
}
