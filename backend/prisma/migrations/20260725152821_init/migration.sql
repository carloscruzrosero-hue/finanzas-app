-- CreateTable
CREATE TABLE "cuentas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "saldoActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_gasto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "color" TEXT,
    "icono" TEXT,

    CONSTRAINT "categorias_gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacciones" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "cuentaId" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ordenPermanenteId" INTEGER,
    "transaccionProgramadaId" INTEGER,

    CONSTRAINT "transacciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_permanentes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "cuentaId" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "diaCobroPago" INTEGER NOT NULL,
    "frecuencia" TEXT NOT NULL DEFAULT 'MENSUAL',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_permanentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacciones_programadas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "cuentaId" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transacciones_programadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cierres_mensuales" (
    "id" SERIAL NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "totalIngresos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalGastos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoNeto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaCierre" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cierres_mensuales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transacciones_transaccionProgramadaId_key" ON "transacciones"("transaccionProgramadaId");

-- CreateIndex
CREATE INDEX "transacciones_mes_anio_idx" ON "transacciones"("mes", "anio");

-- CreateIndex
CREATE INDEX "transacciones_cuentaId_idx" ON "transacciones"("cuentaId");

-- CreateIndex
CREATE INDEX "transacciones_categoriaId_idx" ON "transacciones"("categoriaId");

-- CreateIndex
CREATE INDEX "transacciones_ordenPermanenteId_idx" ON "transacciones"("ordenPermanenteId");

-- CreateIndex
CREATE INDEX "ordenes_permanentes_cuentaId_idx" ON "ordenes_permanentes"("cuentaId");

-- CreateIndex
CREATE INDEX "ordenes_permanentes_categoriaId_idx" ON "ordenes_permanentes"("categoriaId");

-- CreateIndex
CREATE INDEX "transacciones_programadas_cuentaId_idx" ON "transacciones_programadas"("cuentaId");

-- CreateIndex
CREATE INDEX "transacciones_programadas_categoriaId_idx" ON "transacciones_programadas"("categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "cierres_mensuales_mes_anio_key" ON "cierres_mensuales"("mes", "anio");

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_gasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_ordenPermanenteId_fkey" FOREIGN KEY ("ordenPermanenteId") REFERENCES "ordenes_permanentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_transaccionProgramadaId_fkey" FOREIGN KEY ("transaccionProgramadaId") REFERENCES "transacciones_programadas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_permanentes" ADD CONSTRAINT "ordenes_permanentes_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_gasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_permanentes" ADD CONSTRAINT "ordenes_permanentes_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_programadas" ADD CONSTRAINT "transacciones_programadas_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_gasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_programadas" ADD CONSTRAINT "transacciones_programadas_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "cuentas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
