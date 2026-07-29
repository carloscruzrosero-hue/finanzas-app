-- El linter de seguridad de Supabase marcó las 5 tablas de la app como "publicly accessible":
-- sin Row Level Security, cualquiera con la URL del proyecto (y la clave anon/public, que suele
-- quedar expuesta en el frontend) puede leer, editar y borrar todos los datos vía la API REST
-- autogenerada de Supabase (PostgREST). El backend se conecta con el rol "postgres" (que tiene
-- BYPASSRLS), así que habilitar RLS aquí no afecta a la app en absoluto — solo le cierra el
-- acceso público a esos roles anon/authenticated que la app nunca usa.
ALTER TABLE "cuentas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categorias_gasto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transacciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ordenes_permanentes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transacciones_programadas" ENABLE ROW LEVEL SECURITY;
