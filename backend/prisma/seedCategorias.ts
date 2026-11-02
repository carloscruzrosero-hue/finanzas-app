// Precarga categorías comunes de gasto/ingreso con subcategorías, para que el usuario
// no tenga que armar el catálogo desde cero. Es idempotente: si una categoría (por
// nombre + tipo + padre) ya existe, no la duplica. La migración
// 20261102120000_ampliar_catalogo_categorias aplica este mismo catálogo en bases ya creadas.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CategoriaSeed {
  nombre: string;
  tipo: "GASTO" | "INGRESO";
  color: string;
  subcategorias: string[];
}

const CATEGORIAS: CategoriaSeed[] = [
  { nombre: "Vivienda", tipo: "GASTO", color: "#0f766e", subcategorias: ["Arriendo o hipoteca", "Servicios básicos (luz, agua, gas)", "Internet y cable", "Plan de celular", "Mantenimiento del hogar", "Seguro de hogar", "Alícuota / condominio", "Muebles y electrodomésticos", "Artículos de limpieza", "Servicio doméstico"] },
  { nombre: "Alimentación", tipo: "GASTO", color: "#ca8a04", subcategorias: ["Supermercado", "Restaurantes", "Comida rápida y delivery", "Mercado y verdulería", "Panadería y cafetería", "Licores y bebidas"] },
  { nombre: "Compras", tipo: "GASTO", color: "#9333ea", subcategorias: ["Tecnología y electrónica", "Compras en línea", "Artículos para el hogar y decoración", "Ferretería", "Papelería y oficina"] },
  { nombre: "Transporte", tipo: "GASTO", color: "#2563eb", subcategorias: ["Combustible", "Transporte público", "Taxi y apps (Uber, inDrive)", "Mantenimiento vehicular", "Seguro vehicular", "Parqueadero y peajes", "Cuota del vehículo", "Lavado del vehículo"] },
  { nombre: "Salud", tipo: "GASTO", color: "#dc2626", subcategorias: ["Farmacia y medicinas", "Consultas médicas", "Seguro médico", "Gimnasio", "Odontología", "Exámenes de laboratorio", "Óptica", "Psicología y terapias"] },
  { nombre: "Educación", tipo: "GASTO", color: "#7c3aed", subcategorias: ["Colegiatura y matrícula", "Útiles y materiales", "Cursos y capacitación", "Universidad y posgrado", "Idiomas", "Libros", "Uniformes", "Transporte escolar"] },
  { nombre: "Familia e hijos", tipo: "GASTO", color: "#e11d48", subcategorias: ["Guardería y cuidado", "Pañales y artículos de bebé", "Juguetes", "Mesada", "Apoyo a familiares"] },
  { nombre: "Entretenimiento", tipo: "GASTO", color: "#db2777", subcategorias: ["Streaming (Netflix, Spotify, etc.)", "Cine y espectáculos", "Salidas y ocio", "Videojuegos y hobbies", "Viajes y vacaciones", "Deportes", "Eventos y conciertos"] },
  { nombre: "Ropa y cuidado personal", tipo: "GASTO", color: "#0891b2", subcategorias: ["Ropa y calzado", "Peluquería y estética", "Cuidado personal", "Accesorios y joyería", "Spa y masajes"] },
  { nombre: "Inversiones", tipo: "GASTO", color: "#0e7490", subcategorias: ["Inversión en negocios", "Acciones y fondos de inversión", "Pólizas y certificados de depósito", "Criptomonedas", "Bienes raíces", "Ahorro programado"] },
  { nombre: "Gastos del negocio", tipo: "GASTO", color: "#b45309", subcategorias: ["Mercadería e inventario", "Sueldos de empleados", "Arriendo de local", "Marketing y publicidad", "Software y herramientas", "Servicios profesionales (contador, abogado)", "Insumos y suministros"] },
  { nombre: "Deudas y finanzas", tipo: "GASTO", color: "#78716c", subcategorias: ["Tarjeta de crédito", "Préstamos", "Comisiones bancarias", "Intereses y moras", "Seguro de vida"] },
  { nombre: "Impuestos y trámites", tipo: "GASTO", color: "#475569", subcategorias: ["Impuesto a la renta", "Impuesto predial", "Matrícula vehicular", "Trámites y notarías", "Multas"] },
  { nombre: "Mascotas", tipo: "GASTO", color: "#65a30d", subcategorias: ["Alimento para mascotas", "Veterinario", "Medicinas para mascotas", "Peluquería de mascotas", "Accesorios y juguetes"] },
  { nombre: "Otros gastos", tipo: "GASTO", color: "#57534e", subcategorias: ["Regalos", "Donaciones", "Imprevistos", "Celebraciones y fiestas", "Envíos y courier"] },
  { nombre: "Salario", tipo: "INGRESO", color: "#16a34a", subcategorias: ["Sueldo / nómina", "Bonos y comisiones", "Horas extra", "Décimo tercero", "Décimo cuarto", "Fondos de reserva", "Utilidades"] },
  { nombre: "Negocio propio", tipo: "INGRESO", color: "#059669", subcategorias: ["Ventas", "Honorarios profesionales", "Servicios y freelance", "Comisiones por ventas"] },
  { nombre: "Inversiones", tipo: "INGRESO", color: "#0d9488", subcategorias: ["Dividendos", "Intereses", "Retorno de inversión en negocios", "Venta de inversiones", "Criptomonedas"] },
  { nombre: "Arriendos", tipo: "INGRESO", color: "#0891b2", subcategorias: ["Arriendo de inmuebles", "Arriendo de vehículos o equipos"] },
  { nombre: "Otros ingresos", tipo: "INGRESO", color: "#15803d", subcategorias: ["Reembolsos", "Regalos recibidos", "Cobro de préstamos a terceros", "Venta de artículos usados", "Devolución de impuestos", "Premios y sorteos"] },
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
