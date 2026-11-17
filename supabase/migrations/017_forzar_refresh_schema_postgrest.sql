-- 017_forzar_refresh_schema_postgrest.sql
-- Forzar la invalidación del schema cache de PostgREST

-- Invalidar el schema cache de PostgREST
-- Esto hace que PostgREST vuelva a leer el schema completo
SELECT pg_notify('pgrst', 'diff');
