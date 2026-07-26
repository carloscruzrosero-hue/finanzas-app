export type TipoCuenta = "EFECTIVO" | "BANCO" | "TARJETA_CREDITO";
export type TipoCategoria = "GASTO" | "INGRESO";
export type EstadoTransaccion = "PENDIENTE" | "CONFIRMADA";
export type FrecuenciaOrden = "MENSUAL" | "QUINCENAL" | "ANUAL";
export type EstadoProgramada = "PENDIENTE" | "EJECUTADA" | "CANCELADA";
export type EstadoCierre = "ABIERTO" | "CERRADO";

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
}

export interface Transaccion {
  id: number;
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

export interface CierreMensual {
  id: number;
  mes: number;
  anio: number;
  totalIngresos: number;
  totalGastos: number;
  saldoNeto: number;
  fechaCierre?: string | null;
  estado: EstadoCierre;
}

export interface DashboardData {
  periodo: { mes: number; anio: number };
  saldoTotal: number;
  cuentas: Cuenta[];
  ingresosMes: number;
  gastosMes: number;
  saldoNetoMes: number;
  pendientesMes: number;
  cierreMesActual: CierreMensual | null;
  proximasTransaccionesProgramadas: TransaccionProgramada[];
  ordenesPermanentesActivas: OrdenPermanente[];
}
