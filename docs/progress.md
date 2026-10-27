> Actualización de alcance — 22/10/2026: por pedido del responsable se deja sin efecto el guardado offline. La etapa 3A no es requisito para continuar. El desarrollo sigue con módulos online, comenzando por clientes (docs/tasks/004-clientes.md). Las referencias offline siguientes son antecedentes históricos, no requisitos vigentes.

# Ejecución por partes

## Ajuste de alcance y estructura de Inicio — 26/10/2026

- Se retiran del plan la administración de usuarios/técnicos y el catálogo de mesas. Acceso previsto sólo para Ricardo y administración. Ubicación libre en órdenes puede mantenerse.
- Cuatro tarjetas: Clientes, Órdenes de trabajo, Cheques y Comprobantes. Nuevas rutas /cheques y /comprobantes protegidas por finance:read, con bloques pendientes y sin escrituras.
- Pendientes funcionales: impresión, importación/histórico, cuenta corriente, cobros/anticipos/recibos, cheques de terceros, remitos/listados y ARCA; también despliegue y restauración.
- Verificación de esta estructura: TypeScript, lint y build correctos; navegación de las cuatro tarjetas, aviso pendiente en ambas rutas y redirección sin sesión comprobados en navegador; capturas escritorio/móvil inspeccionadas. Cuenta sintética de verificación eliminada al terminar.
- Los perfiles técnicos ya implementados todavía requieren adaptación en código. No confundir la modificación documental con una revocación ejecutada. Contrato de continuidad: docs/tasks/006-continuidad-administrativa.md.

## Entrega 4 — órdenes online, 26/10/2026

- Rama `feat/modulo-ordenes` desde main con clientes integrado. Contrato: `docs/tasks/005-ordenes.md`.
- Listado /ordenes con búsqueda y filtros por estado, ubicación y cliente; alta /ordenes/nueva desde cliente existente; ficha /ordenes/[id] con edición, seguimiento técnico y estados TURNO → TERMINADO → ENTREGADO.
- Técnico asignado, mesa/ubicación, diagnóstico, trabajo realizado y minutos acumulados. Presupuesto ARS decimal opcional y aprobación textual, sin generar deuda. Número interno nuevo, sin interpretar numeración histórica.
- Historial antes/después, actor y motivo en correcciones administrativas, en transacción con la orden. Concurrencia por versión e idempotencia del ingreso por UUID/hash. Entregadas sólo consulta hasta corrección administrativa.
- Admin/recepción operan; técnico sólo sus órdenes y campos técnicos; consulta sin presupuesto. Presupuesto y aprobación excluidos también del historial enviado a roles sin finanzas.
- Migración 0002 y grants runtime aplicados localmente. Unitarias 6/6 e integración PostgreSQL 20/20 correctas. E2E de acceso y clientes correctos; E2E de órdenes 2/2: flujo completo con conflicto/corrección y permisos técnicos sin fuga de presupuesto. Lint, TypeScript y build correctos. Capturas de listado, formulario y ficha escritorio/móvil revisadas.
- Pendientes fuera de esta entrega: importación de históricos, impresión definitiva, finanzas y ARCA. Catálogo de mesas retirado del alcance posteriormente No se realizó despliegue ni corte productivo.

## Entrega 3 — clientes online, 22/10/2026

- Rama feat/modulo-clientes. Retirado offline del alcance por pedido del responsable; etapa 3A conservada sólo como antecedente.
- Pantallas /clientes, /clientes/nuevo y /clientes/[id]: búsqueda paginada, ficha, alta y edición. PostgreSQL con código nuevo, UUID, autor y fechas; control de versión evita sobrescritura concurrente.
- Permisos de escritura comprobados en servidor para administración/recepción. Los demás roles consultan. Datos sintéticos; sin importación del legado.
- Migración y grants aplicados en desarrollo local. Pruebas unitarias 4/4 e integración 8/8 correctas. E2E de acceso correcto y E2E de clientes correcto: alta, búsqueda, edición, conflicto conservando propuesta y denegación de escritura tras cambio de rol. Lint, TypeScript y build de producción correctos. Capturas de listado y formulario inspeccionadas.

## Entrega 1 — 21/10/2026

- Git inicializado dentro de NuevoSoft, rama main.
- Plan rector preservado en el repositorio sin datos personales.
- Etapa 1 ejecutada como contrato funcional: módulos, destino de pantallas, roles, invariantes y casos de aceptación definidos. Aceptación operativa pendiente de implementación/prueba con responsable.
- Etapa 3 desglosada en tarea ejecutable. No se instaló todavía el stack ni se implementó autenticación.
- Verificador existente ejecutado en lectura: 33 tablas, 190.829 filas, siete tablas modeladas y 2.467 incidencias. Última orden recuperada 31233, 19/02/2025. Esto no certifica actualidad ni corrección comercial.

## Orden de continuación

1. Etapa 2 cuando se obtenga copia actual: manifiesto, hash y comparación completa.
2. Etapa 3 con datos sintéticos, sin esperar esa copia: stack fijado, migraciones, acceso y CI.
3. Etapa 3A obligatoria: vertical offline cliente/orden/estado con persistencia, reintentos y conflictos.
4. Modelo/importador y módulos operativos; después finanzas y ARCA en entregas separadas según plan.

La fuente vigente, datos de impresión y relevamiento fiscal siguen pendientes antes de los gates correspondientes. No hay autorización ni preparación para corte productivo en esta entrega.

## Entrega 2 — base ejecutable, 21/10/2026

Carpeta actual: `Taller2.0` (renombrada desde NuevoSoft). Conserva el mismo Git en main, sin commits ni remoto creados en esta entrega.

Implementado: Next.js/TypeScript/Tailwind, componentes UI incorporados, ingreso Auth.js Credentials/JWT, hashes Argon2id, usuarios y roles propios, activo/session_version revalidados en cada entrada protegida, limitación persistente de login, bootstrap y recuperación administrativa auditados. Portada protegida y consultas `/api/me` y `/api/admin/users` con permisos y no-store.

Migración Drizzle generada y revisada para usuarios, intentos y auditoría. Base local vacía migrada; runtime separado del propietario con grants limitados. PostgreSQL local aislado, sin importar datos del taller. No se conectó Neon ni se desplegó. Workflow CI agregado, todavía sin ejecución remota.

Verificación ejecutada:

- `npm ci --no-audit`: instalación limpia correcta desde lockfile; versiones raíz coinciden con package.json.
- `npm run lint` y `npm run typecheck`: correctos.
- `npm test`: 4/4 correctas.
- `npm run test:integration`: 8/8 correctas en PostgreSQL 17. Incluyen migración repetida, bootstrap único, rol sin DDL/DELETE, autorización, revocación, recuperación y límite concurrente.
- `npm run build`: correcto con Next.js 16.4.2. Advertencia informativa por lockfile externo en perfil de usuario, ignorado por estar fuera del repositorio.
- `npm run test:e2e`: 1/1 correcto en Chromium. Ingreso fallido/correcto, endpoints directos 401/403, rol técnico, revocación y cierre de sesión. Capturas ingreso/portada inspeccionadas en `test-results/` (no versionadas).
- Chequeo de 14 bundles JS del cliente: sin valores de AUTH_SECRET ni URLs privadas de DB.
- `npm audit --omit=dev`: cero vulnerabilidades conocidas; nueve alertas en tooling documentadas en `docs/research/dependencias-etapa-3.md`.

App dejada ejecutándose localmente en puerto 3000. Base de desarrollo sin cuenta por defecto: el responsable crea su usuario con `npm run admin -- bootstrap`, por terminal y con contraseña oculta. La cuenta sintética de pruebas vive sólo en base de pruebas.

## Acceso administrativo — 26/10/2026

Fase 1 de tarea 006 implementada en `feat/acceso-administrativo`: sólo admin/reception pueden autenticar y autorizar sesiones o escribir órdenes. Los roles históricos conservan sus datos pero no tienen permisos de aplicación. Recepción conserva sus límites de corrección y gestión de cuentas.

Verificación: lint, typecheck, 7 unitarias, 21 casos de integración PostgreSQL, build y 5 E2E correctos. Inspección visual de escritorio/móvil realizada. Detalles y archivos modificados en `docs/tasks/006-continuidad-administrativa.md`. Cheques, Comprobantes y demás entregas de fase 2 siguen pendientes. Sin despliegue.

La referencia anterior a `003a-offline.md` queda sustituida por las entregas online de tareas 004–007; offline fue retirado del alcance.

## Impresión e histórico — 27/10/2026

Ficha de ingreso/trabajo según formato anterior, papel **15 × 20 cm**, número repetido en talón para cortar y pegar al equipo. Snapshots inmutables por revisión; reimpresión sin movimientos ni cambios de estado. Impresión directa de históricos sin reabrirlos.

Cargada la SQLite indicada por el usuario en la base local: **8.421 clientes y 31.233 órdenes**. Clientes reutilizables con código anterior, originales íntegros y sin fusiones por nombre. Histórico paginado, búsqueda por número viejo y continuidad explícita de reparaciones abiertas conservando UUID y número anterior. Referencias huérfanas se mantienen sin inventar clientes. No se convierten estados ambiguos, tiempos ni presupuestos automáticamente.

Verificación: 9 unitarias, 26 casos de integración y 6 E2E correctos; lint/typecheck/build correctos. Reimportación idempotente y comparación completa SQLite/PostgreSQL por runtime: cero diferencias. PDF sintético de una página 15 × 20 cm renderizado e inspeccionado. Calibración con impresora física pendiente.

Cuenta corriente/aperturas conciliadas, cobros/anticipos, cheques y remitos/reportes continúan en entregas separadas. ARCA espera confirmación de modalidad fiscal, comprobantes y punto de venta. Sin despliegue ni apertura automática de deuda.

## Cuenta corriente — 27/10/2026

Implementada tarea 008: libro inmutable de aperturas por cliente, origen único, importes exactos, conciliación explícita y actor auditado. Ruta Cuenta corriente desde cliente: pendiente, crédito disponible y saldo neto separados. Administración registra aperturas; recepción consulta. Se conserva la cuenta vacía para los clientes importados hasta revisión real; no se cargaron deudas desde trabajos/facturas de SQLite.

Migración local y grants aplicados. Correctos lint/typecheck/build, 11 unitarias, 32 casos de integración y 7 E2E. Cobros/aplicaciones, cheques, remitos/reportes y ARCA permanecen pendientes.

## Cobros y recibos — 27/10/2026
Tarea 009 implementada: cobros en efectivo/transferencia, anticipos, componentes, aplicaciones parciales a varias obligaciones y uso de crédito disponible sin nuevo cobro. UUID/hash y bloqueo de cliente para reintentos/concurrencia. Recibo interno R con snapshot inmutable e impresión; Comprobantes permite consultarlos. Ningún recibo emite una factura.

Migración/grants aplicados, sin cobros reales. Gate correcto: 11 unitarias, 37 casos de integración, 8 E2E, lint/typecheck/build. Cheques, remitos/reportes y ARCA siguen pendientes.

## Cheques de terceros — 27/10/2026
Tarea 010 implementada: recepción vinculada a componente de cobro, cartera, depósito, acreditación, rechazo e historial versionado. Rechazo revierte una sola vez el crédito y aplicaciones del instrumento; efectivo y otros componentes se conservan. Depósito/acreditación no agregan crédito. Banco/cuenta/número previenen duplicación; sin integración bancaria ni importación automática de cartera anterior.

Correctos 11 unitarias, 43 casos de integración y 9 E2E, lint/typecheck/build. Migración/grants locales aplicados y captura sintética revisada. No se recibieron ni operaron instrumentos reales. Remitos/reportes y ARCA siguen pendientes.
