-- Se elimina el concepto de "cierre mensual" persistido: ahora los reportes de
-- ingresos/gastos por mes se calculan en vivo a partir de las transacciones
-- confirmadas, sin necesidad de una tabla de estado abierto/cerrado.
DROP TABLE IF EXISTS "cierres_mensuales";
