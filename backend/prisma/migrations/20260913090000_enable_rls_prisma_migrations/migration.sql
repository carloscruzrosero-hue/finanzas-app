-- El linter de seguridad de Supabase marcó "_prisma_migrations" (la tabla interna que
-- Prisma usa para llevar el historial de migraciones aplicadas) como públicamente
-- accesible sin RLS. No es un modelo del schema.prisma (Prisma la crea y gestiona sola),
-- así que quedó fuera de la migración 20260728120000_enable_rls que cerró las 5 tablas de
-- la app. El backend se conecta con el rol "postgres" (BYPASSRLS), así que esto no afecta
-- a `prisma migrate` en absoluto — solo le cierra el acceso público vía PostgREST.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
