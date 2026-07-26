/*
  Warnings:

  - Added the required column `nombre` to the `transacciones` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "categorias_gasto" ADD COLUMN     "categoriaPadreId" INTEGER;

-- AlterTable
ALTER TABLE "transacciones" ADD COLUMN     "nombre" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "categorias_gasto_categoriaPadreId_idx" ON "categorias_gasto"("categoriaPadreId");

-- AddForeignKey
ALTER TABLE "categorias_gasto" ADD CONSTRAINT "categorias_gasto_categoriaPadreId_fkey" FOREIGN KEY ("categoriaPadreId") REFERENCES "categorias_gasto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
