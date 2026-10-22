# Clientes — primera entrega

## Objetivo
Pantalla online de clientes con listado paginado, búsqueda, ficha, alta y edición persistentes. Pedido del responsable del 22/10/2026: dejar sin efecto el guardado offline y continuar módulos.

## Paso 0 — hechos a revalidar
Base inicial: commit 283c98c. Auth.js y PostgreSQL/Drizzle existentes; permisos customers:write para admin/reception y work:read para consulta. No había tablas de clientes. Verificado contra código el 22/10/2026.

## Contexto
src/server/auth/permissions.ts define permisos; src/app/ingresar/form.tsx fija precedente de formularios; scripts/runtime-grants.sql fija rol mínimo. docs/contracts/reemplazo.md conserva reglas operativas.

## Congelado
Autenticación, roles y tablas de acceso. No cambiar las reglas de órdenes ni cuenta corriente.

## Fuera de alcance
Offline queda retirado del alcance vigente por pedido del usuario; los documentos anteriores se conservan como antecedentes. Sin importación, eliminación, finanzas, órdenes ni despliegue. El código interno de cliente es nuevo y no representa el número del sistema anterior.

Findings during this task go to `docs/research/` (or wherever this repo keeps investigation writeups — create it if there is none); scope creep goes to a new task file, not into this diff.

Log every judgment call — anything this task didn't decide and you had to — to `NOTES.md` beside the diff, visibly, as you go (not reconstructed after).

## Entregables
Tabla customers y migración; grants de consulta/alta/edición, sin DELETE; rutas /clientes, /clientes/nuevo y /clientes/[id]; validación Zod en servidor; cada acción revalida identidad y permisos. Páginas de 25 filas, búsqueda literal parametrizada por código/nombre/documento/contacto. Edición condicionada por versión, conflicto visible y formulario conservado. Enlace desde inicio.

## Fallos conocidos
NOTES.md y el único commit de base registran pérdida de valores tras useActionState: usar campos controlados. Ningún historial previo del módulo de clientes. Mantener rol mínimo al agregar tablas y secuencia. No mostrar guardado exitoso ante error de DB ni sobrescribir una edición concurrente.

## Gate de aceptación
Lint y TypeScript correctos; migración desde base de pruebas, pruebas de acceso existentes y recorrido E2E de alta, búsqueda, edición, conflicto y consulta sin botones de modificación. Logs de Playwright identifican pasos y valores esperados/obtenidos; fixtures exclusivamente sintéticos.

## Verificación adicional
Build de producción y captura de listado/formulario; no certificar producción ni importación por estas pruebas.

## Revisión del contrato
Revisión con spec-review el 22/10/2026 contra schema, permisos, formularios y grants: se explicita código nuevo separado de legado, persistencia online y conservación de formulario. Sin delegación.
