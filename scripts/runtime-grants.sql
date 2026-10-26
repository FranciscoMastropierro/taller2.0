-- Ejecutar como propietario DESPUÉS de migrar, en cada base/ambiente.
-- Crear galante_runtime y su contraseña por canal seguro, fuera de Git.
GRANT USAGE ON SCHEMA public TO galante_runtime;
GRANT USAGE ON TYPE public.app_role TO galante_runtime;
GRANT SELECT, INSERT, UPDATE ON public.app_users, public.login_limits TO galante_runtime;
GRANT SELECT, INSERT ON public.access_audit TO galante_runtime;
GRANT SELECT, INSERT, UPDATE ON public.customers TO galante_runtime;
GRANT USAGE ON SEQUENCE public.customers_code_seq TO galante_runtime;
GRANT SELECT, INSERT, UPDATE ON public.work_orders TO galante_runtime;
GRANT USAGE ON SEQUENCE public.work_orders_number_seq TO galante_runtime;
GRANT SELECT, INSERT ON public.order_events TO galante_runtime;
-- Sin DELETE, TRUNCATE, CREATE ni acceso al esquema drizzle de migraciones.
