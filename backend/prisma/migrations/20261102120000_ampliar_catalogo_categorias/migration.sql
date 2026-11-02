-- Amplía el catálogo de categorías y subcategorías (inversión en negocios, compras,
-- familia, gastos del negocio, impuestos, arriendos, etc.). Es solo de datos e idempotente:
-- inserta cada categoría o subcategoría únicamente si no existe ya una con el mismo nombre,
-- tipo y categoría padre, así que no duplica lo existente ni toca lo que el usuario ya
-- creó o editó. Mismo catálogo que prisma/seedCategorias.ts.

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Vivienda', 'GASTO', '#0f766e', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Vivienda' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'GASTO', padre.id
FROM (VALUES
  ('Arriendo o hipoteca'),
  ('Servicios básicos (luz, agua, gas)'),
  ('Internet y cable'),
  ('Plan de celular'),
  ('Mantenimiento del hogar'),
  ('Seguro de hogar'),
  ('Alícuota / condominio'),
  ('Muebles y electrodomésticos'),
  ('Artículos de limpieza'),
  ('Servicio doméstico')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Vivienda' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'GASTO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Alimentación', 'GASTO', '#ca8a04', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Alimentación' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'GASTO', padre.id
FROM (VALUES
  ('Supermercado'),
  ('Restaurantes'),
  ('Comida rápida y delivery'),
  ('Mercado y verdulería'),
  ('Panadería y cafetería'),
  ('Licores y bebidas')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Alimentación' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'GASTO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Compras', 'GASTO', '#9333ea', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Compras' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'GASTO', padre.id
FROM (VALUES
  ('Tecnología y electrónica'),
  ('Compras en línea'),
  ('Artículos para el hogar y decoración'),
  ('Ferretería'),
  ('Papelería y oficina')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Compras' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'GASTO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Transporte', 'GASTO', '#2563eb', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Transporte' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'GASTO', padre.id
FROM (VALUES
  ('Combustible'),
  ('Transporte público'),
  ('Taxi y apps (Uber, inDrive)'),
  ('Mantenimiento vehicular'),
  ('Seguro vehicular'),
  ('Parqueadero y peajes'),
  ('Cuota del vehículo'),
  ('Lavado del vehículo')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Transporte' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'GASTO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Salud', 'GASTO', '#dc2626', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Salud' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'GASTO', padre.id
FROM (VALUES
  ('Farmacia y medicinas'),
  ('Consultas médicas'),
  ('Seguro médico'),
  ('Gimnasio'),
  ('Odontología'),
  ('Exámenes de laboratorio'),
  ('Óptica'),
  ('Psicología y terapias')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Salud' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'GASTO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Educación', 'GASTO', '#7c3aed', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Educación' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'GASTO', padre.id
FROM (VALUES
  ('Colegiatura y matrícula'),
  ('Útiles y materiales'),
  ('Cursos y capacitación'),
  ('Universidad y posgrado'),
  ('Idiomas'),
  ('Libros'),
  ('Uniformes'),
  ('Transporte escolar')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Educación' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'GASTO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Familia e hijos', 'GASTO', '#e11d48', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Familia e hijos' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'GASTO', padre.id
FROM (VALUES
  ('Guardería y cuidado'),
  ('Pañales y artículos de bebé'),
  ('Juguetes'),
  ('Mesada'),
  ('Apoyo a familiares')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Familia e hijos' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'GASTO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Entretenimiento', 'GASTO', '#db2777', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Entretenimiento' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'GASTO', padre.id
FROM (VALUES
  ('Streaming (Netflix, Spotify, etc.)'),
  ('Cine y espectáculos'),
  ('Salidas y ocio'),
  ('Videojuegos y hobbies'),
  ('Viajes y vacaciones'),
  ('Deportes'),
  ('Eventos y conciertos')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Entretenimiento' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'GASTO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Ropa y cuidado personal', 'GASTO', '#0891b2', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Ropa y cuidado personal' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'GASTO', padre.id
FROM (VALUES
  ('Ropa y calzado'),
  ('Peluquería y estética'),
  ('Cuidado personal'),
  ('Accesorios y joyería'),
  ('Spa y masajes')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Ropa y cuidado personal' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'GASTO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Inversiones', 'GASTO', '#0e7490', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Inversiones' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'GASTO', padre.id
FROM (VALUES
  ('Inversión en negocios'),
  ('Acciones y fondos de inversión'),
  ('Pólizas y certificados de depósito'),
  ('Criptomonedas'),
  ('Bienes raíces'),
  ('Ahorro programado')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Inversiones' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'GASTO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Gastos del negocio', 'GASTO', '#b45309', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Gastos del negocio' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'GASTO', padre.id
FROM (VALUES
  ('Mercadería e inventario'),
  ('Sueldos de empleados'),
  ('Arriendo de local'),
  ('Marketing y publicidad'),
  ('Software y herramientas'),
  ('Servicios profesionales (contador, abogado)'),
  ('Insumos y suministros')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Gastos del negocio' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'GASTO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Deudas y finanzas', 'GASTO', '#78716c', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Deudas y finanzas' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'GASTO', padre.id
FROM (VALUES
  ('Tarjeta de crédito'),
  ('Préstamos'),
  ('Comisiones bancarias'),
  ('Intereses y moras'),
  ('Seguro de vida')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Deudas y finanzas' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'GASTO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Impuestos y trámites', 'GASTO', '#475569', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Impuestos y trámites' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'GASTO', padre.id
FROM (VALUES
  ('Impuesto a la renta'),
  ('Impuesto predial'),
  ('Matrícula vehicular'),
  ('Trámites y notarías'),
  ('Multas')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Impuestos y trámites' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'GASTO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Mascotas', 'GASTO', '#65a30d', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Mascotas' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'GASTO', padre.id
FROM (VALUES
  ('Alimento para mascotas'),
  ('Veterinario'),
  ('Medicinas para mascotas'),
  ('Peluquería de mascotas'),
  ('Accesorios y juguetes')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Mascotas' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'GASTO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Otros gastos', 'GASTO', '#57534e', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Otros gastos' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'GASTO', padre.id
FROM (VALUES
  ('Regalos'),
  ('Donaciones'),
  ('Imprevistos'),
  ('Celebraciones y fiestas'),
  ('Envíos y courier')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Otros gastos' AND "tipo" = 'GASTO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'GASTO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Salario', 'INGRESO', '#16a34a', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Salario' AND "tipo" = 'INGRESO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'INGRESO', padre.id
FROM (VALUES
  ('Sueldo / nómina'),
  ('Bonos y comisiones'),
  ('Horas extra'),
  ('Décimo tercero'),
  ('Décimo cuarto'),
  ('Fondos de reserva'),
  ('Utilidades')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Salario' AND "tipo" = 'INGRESO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'INGRESO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Negocio propio', 'INGRESO', '#059669', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Negocio propio' AND "tipo" = 'INGRESO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'INGRESO', padre.id
FROM (VALUES
  ('Ventas'),
  ('Honorarios profesionales'),
  ('Servicios y freelance'),
  ('Comisiones por ventas')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Negocio propio' AND "tipo" = 'INGRESO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'INGRESO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Inversiones', 'INGRESO', '#0d9488', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Inversiones' AND "tipo" = 'INGRESO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'INGRESO', padre.id
FROM (VALUES
  ('Dividendos'),
  ('Intereses'),
  ('Retorno de inversión en negocios'),
  ('Venta de inversiones'),
  ('Criptomonedas')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Inversiones' AND "tipo" = 'INGRESO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'INGRESO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Arriendos', 'INGRESO', '#0891b2', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Arriendos' AND "tipo" = 'INGRESO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'INGRESO', padre.id
FROM (VALUES
  ('Arriendo de inmuebles'),
  ('Arriendo de vehículos o equipos')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Arriendos' AND "tipo" = 'INGRESO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'INGRESO' AND c."categoriaPadreId" = padre.id);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "color", "categoriaPadreId")
SELECT 'Otros ingresos', 'INGRESO', '#15803d', NULL
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" WHERE "nombre" = 'Otros ingresos' AND "tipo" = 'INGRESO' AND "categoriaPadreId" IS NULL);

INSERT INTO "categorias_gasto" ("nombre", "tipo", "categoriaPadreId")
SELECT sub.nombre, 'INGRESO', padre.id
FROM (VALUES
  ('Reembolsos'),
  ('Regalos recibidos'),
  ('Cobro de préstamos a terceros'),
  ('Venta de artículos usados'),
  ('Devolución de impuestos'),
  ('Premios y sorteos')
) AS sub(nombre)
CROSS JOIN (SELECT MIN("id") AS id FROM "categorias_gasto" WHERE "nombre" = 'Otros ingresos' AND "tipo" = 'INGRESO' AND "categoriaPadreId" IS NULL) AS padre
WHERE NOT EXISTS (SELECT 1 FROM "categorias_gasto" c WHERE c."nombre" = sub.nombre AND c."tipo" = 'INGRESO' AND c."categoriaPadreId" = padre.id);

