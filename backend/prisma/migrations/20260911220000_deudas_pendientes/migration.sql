-- CreateTable
CREATE TABLE "deudas" (
    "id" SERIAL NOT NULL,
    "deudor" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "montoTotal" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "frecuencia" TEXT NOT NULL DEFAULT 'MENSUAL',
    "numeroCuotas" INTEGER NOT NULL DEFAULT 1,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deudas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuotas_deuda" (
    "id" SERIAL NOT NULL,
    "deudaId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "montoEsperado" DOUBLE PRECISION NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "montoPagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaPago" TIMESTAMP(3),

    CONSTRAINT "cuotas_deuda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_deuda" (
    "id" SERIAL NOT NULL,
    "cuotaId" INTEGER NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cuentaId" INTEGER,
    "transaccionId" INTEGER,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_deuda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cuotas_deuda_deudaId_numero_key" ON "cuotas_deuda"("deudaId", "numero");

-- CreateIndex
CREATE INDEX "cuotas_deuda_deudaId_idx" ON "cuotas_deuda"("deudaId");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_deuda_transaccionId_key" ON "pagos_deuda"("transaccionId");

-- CreateIndex
CREATE INDEX "pagos_deuda_cuotaId_idx" ON "pagos_deuda"("cuotaId");

-- AddForeignKey
ALTER TABLE "cuotas_deuda" ADD CONSTRAINT "cuotas_deuda_deudaId_fkey" FOREIGN KEY ("deudaId") REFERENCES "deudas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_deuda" ADD CONSTRAINT "pagos_deuda_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "cuotas_deuda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_deuda" ADD CONSTRAINT "pagos_deuda_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_deuda" ADD CONSTRAINT "pagos_deuda_transaccionId_fkey" FOREIGN KEY ("transaccionId") REFERENCES "transacciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Mismo criterio que la migración 20260728120000_enable_rls: el backend usa el rol
-- "postgres" (BYPASSRLS), así que esto no afecta a la app — solo cierra el acceso
-- público que el linter de seguridad de Supabase marca en toda tabla nueva sin RLS.
ALTER TABLE "deudas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cuotas_deuda" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pagos_deuda" ENABLE ROW LEVEL SECURITY;
