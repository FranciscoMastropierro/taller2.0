# Siguiente entrega: prueba vertical offline

## Objetivo

Ejecutar etapa 3A del plan rector antes de extender clientes/órdenes o finanzas. Crear/editar cliente sintético, crear orden y cambiar estado; guardar sin conexión, reiniciar y sincronizar sin duplicación.

## Entrada y contexto

Leer `docs/plans/sistema-galante-v2.md`, `docs/contracts/reemplazo.md`, esquema y autenticación actuales. Revalidar tests de etapa 3. La base vigente sigue pendiente y no se importa en esta prueba. Primero cerrar `docs/specs/01-base-y-sincronizacion.md` y ADR topológico con protocolo preciso y revisión spec-review antes de implementar.

## Congelado y fuera de alcance

Una PC, tres estados, IndexedDB y servidor central. Auth.js para online; sesión local separada. No dinero, emisión fiscal, importación histórica ni despliegue productivo.

Findings during this task go to `docs/research/` (or wherever this repo keeps investigation writeups — create it if there is none); scope creep goes to a new task file, not into this diff.

Log every judgment call — anything this task didn't decide and you had to — to `NOTES.md` beside the diff, visibly, as you go (not reconstructed after).

## Entregables

1. Contratos Zod de comandos/resultados/errores v1, UUID estables, dependencias y versiones base. Identidad autenticada coincide con actor original, sin aceptar actor del payload como autoridad.
2. Migraciones PostgreSQL para mínimo cliente/orden/historial, resultados idempotentes y publicación serializada de cambios mediante contador transaccional. Misma clave/payload retorna resultado; clave reutilizada con payload distinto se rechaza.
3. IndexedDB: entidad, outbox y metadatos en transacción local atómica; aislamiento por usuario. Un coordinador por dispositivo entre pestañas y reintento manual/online/al abrir. Actualización de aplicación no borra comandos pendientes.
4. Shell aprovisionado online y arranque tras reinicio sin conexión, sin dependencia de Server Actions para guardar. Service worker sólo shell; datos privados autorizados en almacenamiento local. Conflictos conservan propuestas y la cola no cambia de dueño al reautenticar.
5. Habilitación offline firmada, vencimiento y permisos; política local de recuperación y cuota explícitas. ADR registra resultados del navegador real y límites de la PC pendiente.

## Fallos conocidos y gate

Probar cliente antes que orden dependiente; sesión vencida/revocada sin pérdida de pendientes; cuota agotada sin confirmar guardado; dos pestañas; respuesta perdida y reintento; payload cambiado con mismo ID; versión concurrente; actualización del shell/IndexedDB con cola; publicación de dos commits fuera de orden sin omisiones del cursor. Pruebas automatizadas con fixture y esperado/obtenido en logs; capturas no son gate de integridad.

Sólo pasar a módulos siguientes si persistencia/reintentos/conflictos conservan operaciones. Equipo, navegador, almacenamiento persistente y recuperación ante daño del puesto se verifican por separado antes de producción; no inferirlos de una prueba de Chromium en desarrollo.
