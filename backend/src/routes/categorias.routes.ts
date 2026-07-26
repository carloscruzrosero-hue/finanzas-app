import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { TIPOS_CATEGORIA } from "../utils/constants";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { tipo, soloRaiz } = req.query;
    const where: any = {};
    if (tipo) where.tipo = String(tipo);
    if (soloRaiz === "true") where.categoriaPadreId = null;
    const categorias = await prisma.categoriaGasto.findMany({
      where,
      include: { subcategorias: { orderBy: { nombre: "asc" } } },
      orderBy: { nombre: "asc" },
    });
    res.json(categorias);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const categoria = await prisma.categoriaGasto.findUnique({
      where: { id: Number(req.params.id) },
      include: { subcategorias: true, categoriaPadre: true },
    });
    if (!categoria) return res.status(404).json({ error: "Categoría no encontrada." });
    res.json(categoria);
  } catch (err) {
    next(err);
  }
});

const crearCategoriaSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(TIPOS_CATEGORIA),
  color: z.string().optional(),
  icono: z.string().optional(),
  categoriaPadreId: z.number().int().nullable().optional(),
});

// Solo se admite un nivel de subcategoría: la categoría padre indicada debe ser
// ella misma una categoría raíz (sin padre) y del mismo tipo (GASTO/INGRESO).
async function validarPadre(categoriaPadreId: number | null | undefined, tipo: string, idPropio?: number) {
  if (!categoriaPadreId) return null;
  if (categoriaPadreId === idPropio) return "Una categoría no puede ser su propia categoría padre.";
  const padre = await prisma.categoriaGasto.findUnique({ where: { id: categoriaPadreId } });
  if (!padre) return "La categoría padre indicada no existe.";
  if (padre.categoriaPadreId) return "Solo se admite un nivel de subcategoría (la categoría padre ya es una subcategoría).";
  if (padre.tipo !== tipo) return "La subcategoría debe ser del mismo tipo (gasto/ingreso) que su categoría padre.";
  return null;
}

router.post("/", async (req, res, next) => {
  try {
    const data = crearCategoriaSchema.parse(req.body);
    const errorPadre = await validarPadre(data.categoriaPadreId, data.tipo);
    if (errorPadre) return res.status(400).json({ error: errorPadre });
    const categoria = await prisma.categoriaGasto.create({ data });
    res.status(201).json(categoria);
  } catch (err) {
    next(err);
  }
});

// No se deriva con .partial() de crearCategoriaSchema por consistencia con el resto de
// rutas del proyecto (ver nota en transacciones.routes.ts) y porque aquí también se
// necesita poder enviar categoriaPadreId: null explícitamente para quitarle el padre.
const actualizarCategoriaSchema = z.object({
  nombre: z.string().min(1).optional(),
  tipo: z.enum(TIPOS_CATEGORIA).optional(),
  color: z.string().optional(),
  icono: z.string().optional(),
  categoriaPadreId: z.number().int().nullable().optional(),
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.categoriaGasto.findUnique({ where: { id }, include: { subcategorias: true } });
    if (!existente) return res.status(404).json({ error: "Categoría no encontrada." });
    const data = actualizarCategoriaSchema.parse(req.body);

    if (data.categoriaPadreId !== undefined) {
      const errorPadre = await validarPadre(data.categoriaPadreId, data.tipo ?? existente.tipo, id);
      if (errorPadre) return res.status(400).json({ error: errorPadre });
    }
    if (data.categoriaPadreId && existente.subcategorias.length > 0) {
      return res.status(400).json({ error: "Esta categoría tiene subcategorías propias; no puede convertirse en subcategoría de otra." });
    }

    const categoria = await prisma.categoriaGasto.update({ where: { id }, data });
    res.json(categoria);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.categoriaGasto.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: "Categoría no encontrada." });
    await prisma.categoriaGasto.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === "P2003") {
      return res.status(409).json({ error: "No se puede eliminar: la categoría (o sus subcategorías) tiene movimientos asociados." });
    }
    next(err);
  }
});

export default router;
