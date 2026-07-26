import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { TIPOS_CATEGORIA } from "../utils/constants";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { tipo } = req.query;
    const where = tipo ? { tipo: String(tipo) } : {};
    const categorias = await prisma.categoriaGasto.findMany({ where, orderBy: { nombre: "asc" } });
    res.json(categorias);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const categoria = await prisma.categoriaGasto.findUnique({ where: { id: Number(req.params.id) } });
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
});

router.post("/", async (req, res, next) => {
  try {
    const data = crearCategoriaSchema.parse(req.body);
    const categoria = await prisma.categoriaGasto.create({ data });
    res.status(201).json(categoria);
  } catch (err) {
    next(err);
  }
});

const actualizarCategoriaSchema = crearCategoriaSchema.partial();

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.categoriaGasto.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: "Categoría no encontrada." });
    const data = actualizarCategoriaSchema.parse(req.body);
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
      return res.status(409).json({ error: "No se puede eliminar: la categoría tiene movimientos asociados." });
    }
    next(err);
  }
});

export default router;
