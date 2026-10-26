> Alcance vigente — 26/10/2026: acceso previsto sólo para Ricardo y personal administrativo. Se excluyen el módulo de administración de usuarios/técnicos, el acceso de técnicos y el catálogo de mesas. La ubicación libre de una orden puede conservarse. Inicio tiene exactamente cuatro tarjetas: Clientes, Órdenes de trabajo, Cheques y Comprobantes. Cheques y Comprobantes tienen sólo estructura visual; sus operaciones y los demás módulos pendientes no se consideran implementados. La adaptación del código de roles existente se entrega como tarea pendiente en docs/tasks/006-continuidad-administrativa.md.

# Órdenes online — 26/10/2026

## Objetivo
Crear y seguir reparaciones de clientes existentes. Listado, búsqueda, filtros, ficha, edición, asignación y estados TURNO → TERMINADO → ENTREGADO con historial transaccional.

## Paso 0
Revalidar base main e5d139b, clientes integrados, permiso work:read y customers:write existentes y PostgreSQL con Drizzle/pg. El alcance offline fue retirado el 22/10. No existe importador ni libro comercial.

## Contexto
docs/contracts/reemplazo.md: reglas; src/server/auth/permissions.ts: roles; src/app/clientes/: formularios controlados y rutas protegidas; src/server/db/schema/index.ts y scripts/runtime-grants.sql: migraciones y rol mínimo.

## Congelado
Autenticación y clientes. Exactamente tres estados. Ubicación/mesa es texto operativo separado del estado. Ningún comando crea deuda.

## Fuera de alcance
Importación/continuidad de históricos, impresión definitiva, finanzas, ARCA, offline y despliegue. Código secuencial interno independiente del legado; minutos enteros como unidad explícita para nuevos registros, sin interpretar unidades históricas.

Findings during this task go to `docs/research/` (or wherever this repo keeps investigation writeups — create it if there is none); scope creep goes to a new task file, not into this diff.

Log every judgment call — anything this task didn't decide and you had to — to `NOTES.md` beside the diff, visibly, as you go (not reconstructed after).

## Entregables
- Órdenes con UUID, número interno, cliente fijo, equipo/marca/modelo/serie, descripción de ingreso, observaciones, mesa, técnico, diagnóstico, trabajo realizado, minutos acumulados y presupuesto decimal opcional en ARS con evidencia de aprobación textual opcional.
- Admin/recepción crean/editan y avanzan estados. Técnico sólo consulta sus órdenes asignadas y edita diagnóstico, trabajo y minutos; no presupuesto ni estado. Consulta lee operación sin presupuesto. Admin puede corregir estado con motivo obligatorio. No borrar órdenes ni eventos.
- Presupuesto exacto como cadena decimal, nunca aritmética de punto flotante. No bloquear estados por aprobación no acordada.
- Comandos validan actor vigente en servidor, versión esperada y asignación; transacción de orden e historial con snapshot antes/después. Cada versión tiene un único evento. Alta con UUID estable para evitar duplicación por reintento; reutilización diferente rechazada.
- Listado paginado por 25, filtros estado/mesa/cliente y búsqueda por número, cliente o equipo. Desde clientes se puede ingresar/ver órdenes del mismo cliente. Historial muestra actor/fecha y campos operativos antes/después; datos financieros sólo para roles autorizados.

## Fallos conocidos
NOTES.md registra pérdida de formularios por useActionState y carga de rutas sin sesión: campos controlados y redirección en cada página. Clientes detecta concurrencia con versión: mantener el patrón dentro de transacción. El historial del repo no tiene incidentes del módulo de órdenes. No trasladar importes al cliente sin permiso ni actualizar permisos de otras áreas.

## Gate
Lint, TypeScript, unitarias, integración PostgreSQL y build. Integración comprueba secuencia, corrección sólo admin con motivo, presupuesto exacto, concurrencia, rollback sin evento huérfano, reintento de alta y técnicos no asignados sin lectura/escritura. E2E recorre alta desde cliente, búsqueda, edición y terminación/entrega. Esperado/obtenido en aserciones; capturas informativas.

## Verificación adicional
Revisar capturas escritorio/móvil y grants runtime. Pruebas sintéticas; no acreditan migración ni reemplazo productivo.

## Revisión del contrato
Spec-review contra contrato, schema y permisos existentes: cliente permanece fijo tras ingreso; no financieros en payload de consulta/técnico; correcciones con evento y motivo. Decisiones nuevas explícitas arriba, sin cambiar los estados confirmados.
