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
GRANT SELECT ON public.import_sources TO galante_runtime;
GRANT SELECT, UPDATE (continued_order_id) ON public.historical_orders TO galante_runtime;
GRANT SELECT, INSERT ON public.order_sheets TO galante_runtime;
GRANT SELECT, INSERT ON public.account_entries TO galante_runtime;
GRANT SELECT, INSERT ON public.application_batches, public.credit_applications, public.payment_receipts, public.payment_components TO galante_runtime;
GRANT USAGE ON SEQUENCE public.payment_receipts_number_seq TO galante_runtime;
GRANT SELECT, INSERT ON public.third_party_cheques, public.cheque_movements, public.credit_reversals TO galante_runtime;
GRANT UPDATE (status, version) ON public.third_party_cheques TO galante_runtime;
GRANT SELECT, INSERT ON public.delivery_notes TO galante_runtime;
GRANT USAGE ON SEQUENCE public.delivery_notes_number_seq TO galante_runtime;
-- Sin DELETE, TRUNCATE, CREATE ni acceso al esquema drizzle de migraciones.
