// Valores permitidos para los campos tipo "enum" del schema (SQLite no soporta enums
// nativos de Prisma, así que se modelan como String y se validan aquí).

export const TIPOS_CUENTA = ["EFECTIVO", "BANCO", "TARJETA_CREDITO"] as const;
export type TipoCuenta = (typeof TIPOS_CUENTA)[number];

export const TIPOS_CATEGORIA = ["GASTO", "INGRESO"] as const;
export type TipoCategoria = (typeof TIPOS_CATEGORIA)[number];

export const ESTADOS_TRANSACCION = ["PENDIENTE", "CONFIRMADA"] as const;
export type EstadoTransaccion = (typeof ESTADOS_TRANSACCION)[number];

export const FRECUENCIAS_ORDEN = ["MENSUAL", "QUINCENAL", "ANUAL"] as const;
export type FrecuenciaOrden = (typeof FRECUENCIAS_ORDEN)[number];

export const ESTADOS_PROGRAMADA = ["PENDIENTE", "EJECUTADA", "CANCELADA"] as const;
export type EstadoProgramada = (typeof ESTADOS_PROGRAMADA)[number];

export const ESTADOS_CIERRE = ["ABIERTO", "CERRADO"] as const;
export type EstadoCierre = (typeof ESTADOS_CIERRE)[number];
