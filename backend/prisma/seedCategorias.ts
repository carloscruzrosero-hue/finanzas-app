// Precarga categorías comunes de gasto/ingreso con subcategorías, para que el usuario
// no tenga que armar el catálogo desde cero. Es idempotente: si una categoría (por
// nombre + tipo + padre) ya existe, no la duplica.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CategoriaSeed {
  nombre: string;
  tipo: "GASTO" | "INGRESO";
  color: string;
  subcategorias: string[];
}

const CATEGORIAS: CategoriaSeed[] = [
  { nombre: "Vivienda", tipo: "GASTO", color: "#0f766e", subcategorias: ["Arriendo o hipoteca", "Servicios básicos (luz, agua, gas)", "Internet y cable", "Mantenimiento del hogar", "Seguro de hogar"] },
  { nombre: "Alimentación", tipo: "GASTO", color: "#ca8a04", subcategorias: ["Supermercado", "Restaurantes", "Comida rápida y delivery"] },
  { nombre: "Transporte", tipo: "GASTO", color: "#2563eb", subcategorias: ["Combustible", "Transporte público", "Mantenimiento vehicular", "Seguro vehicular", "Parqueadero y peajes"] },
  { nombre: "Salud", tipo: "GASTO", color: "#dc2626", subcategorias: ["Farmacia y medicinas", "Consultas médicas", "Seguro médico", "Gimnasio"] },
  { nombre: "Educación", tipo: "GASTO", color: "#7c3aed", subcategorias: ["Colegiatura y matrícula", "Útiles y materiales", "Cursos y capacitación"] },
  { nombre: "Entretenimiento", tipo: "GASTO", color: "#db2777", subcategorias: ["Streaming (Netflix, Spotify, etc.)", "Cine y espectáculos", "Salidas y ocio", "Videojuegos y hobbies"] },
  { nombre: "Ropa y cuidado personal", tipo: "GASTO", color: "#0891b2", subcategorias: ["Ropa y calzado", "Peluquería y estética", "Cuidado personal"] },
  { nombre: "Deudas y finanzas", tipo: "GASTO", color: "#78716c", subcategorias: ["Tarjeta de crédito", "Préstamos", "Comisiones bancarias"] },
  { nombre: "Mascotas", tipo: "GASTO", color: "#65a30d", subcategorias: ["Alimento para mascotas", "Veterinario"] },
  { nombre: "Otros gastos", tipo: "GASTO", color: "#57534e", subcategorias: ["Regalos", "Donaciones", "Imprevistos"] },

  { nombre: "Salario", tipo: "INGRESO", color: "#16a34a", subcategorias: ["Sueldo / nómina", "Bonos y comisiones"] },
  { nombre: "Negocio propio", tipo: "INGRESO", color: "#059669", subcategorias: ["Ventas", "Honorarios profesionales"] },
  { nombre: "Inversiones", tipo: "INGRESO", color: "#0d9488", subcategorias: ["Dividendos", "Intereses"] },
  { nombre: "Otros ingresos", tipo: "INGRESO", color: "#15803d", subcategorias: ["Reembolsos", "Regalos recibidos"] },
];

async function obtenerOCrear(nombre: string, tipo: string, categoriaPadreId: number | null, color?: string) {
  const existente = await prisma.categoriaGasto.findFirst({ where: { nombre, tipo, categoriaPadreId } });
  if (existente) return existente;
  return prisma.categoriaGasto.create({ data: { nombre, tipo, categoriaPadreId, color } });
}

async function main() {
  let creadas = 0;
  for (const cat of CATEGORIAS) {
    const padre = await obtenerOCrear(cat.nombre, cat.tipo, null, cat.color);
    for (const sub of cat.subcategorias) {
      const antes = await prisma.categoriaGasto.count({ where: { nombre: sub, tipo: cat.tipo, categoriaPadreId: padre.id } });
      await obtenerOCrear(sub, cat.tipo, padre.id);
      if (antes === 0) creadas++;
    }
  }
  console.log(`Categorías/subcategorías listas. Nuevas subcategorías creadas en esta corrida: ${creadas}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
