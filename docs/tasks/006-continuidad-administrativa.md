# Continuidad: acceso administrativo, Cheques y Comprobantes

Fecha: 26/10/2026. Autoridad: último pedido del responsable en este chat. Este archivo prevalece sobre propuestas anteriores de usuarios/técnicos, catálogo de mesas y offline. Es el punto de entrada para el siguiente agente.

## Objetivo

Continuar el producto para Ricardo y personal administrativo con exactamente cuatro accesos principales: **Clientes**, **Órdenes de trabajo**, **Cheques**, **Comprobantes**. Conservar los módulos funcionales y completar el acceso administrativo antes de implementar nuevas operaciones financieras por entregas separadas.

**Ya realizado en esta entrega:** cuatro tarjetas en Inicio, rutas protegidas `/cheques` y `/comprobantes`, bloques visuales explícitamente pendientes, actualización documental. No volver a construirlos desde cero.

**Pendiente para ejecutar primero:** adaptar los perfiles del código anterior al acceso exclusivo administrativo, como se precisa en la fase 1. Los módulos financieros de la fase 2 permanecen pendientes: este documento registra su alcance y dependencias, no afirma que estén implementados ni habilita una emisión real.

## Paso 0 — hechos a revalidar

1. Ejecutar `git status --short --branch`. Esta entrega está en `feat/modulo-ordenes` con cambios locales, incluidos archivos nuevos; no asumir que hay commit ni PR de órdenes. No resetear, limpiar ni reemplazar trabajo previo.
2. Confirmar rutas reales en `src/app/`: clientes y órdenes funcionan; cheques/comprobantes son sólo estructura visual. No existen libro comercial, pagos, cartera de cheques, documentos ni adaptador ARCA.
3. `src/shared/contracts/auth.ts` y el enum PostgreSQL todavía contienen admin/reception/technician/readonly. No asumir que modificar el plan desactiva cuentas. La sesión usa identidad + sessionVersion y reconsulta el usuario persistido.
4. `src/server/auth/service.ts` contiene `authenticate`, `authorizeIdentity`, bootstrap/recuperación y `changeAccess`. Las escrituras de órdenes además revalidan el actor en `src/server/orders/service.ts` mediante `actor`.
5. `src/components/pending-module.tsx` exige `finance:read` antes de mostrar las nuevas rutas. No bajar la protección para facilitar previews.
6. La unidad de tiempo nueva es minutos y la numeración de órdenes es interna. Offline, gestión de usuarios/técnicos y catálogo de mesas no forman parte del alcance.

Hechos verificados en el código local el 26/10/2026. Si cambian, actualizar el contrato antes de implementar.

## Archivos de contexto

- `docs/plans/sistema-galante-v2.md`: plan rector con nuevo alcance y reglas comerciales.
- `docs/contracts/reemplazo.md`: estados y contratos de deuda, cobros, cheques y documentos.
- `src/app/page.tsx`: cuatro tarjetas y destinos existentes.
- `src/app/cheques/page.tsx`, `src/app/comprobantes/page.tsx`: estructura pendiente que se debe evolucionar.
- `src/components/pending-module.tsx`: presentación común y protección actual.
- `src/auth.ts`, `src/server/auth/access.ts`, `src/server/auth/service.ts`: autenticación y entradas protegidas.
- `src/server/auth/permissions.ts`, `src/shared/contracts/auth.ts`: perfiles y permisos.
- `src/server/orders/service.ts`: validación transaccional propia, estados, historial y ámbito técnico antiguo.
- `src/server/db/schema/index.ts`, `scripts/runtime-grants.sql`: datos existentes y privilegios mínimos.
- `tests/auth.test.ts`, `tests/integration/access.test.ts`, `tests/integration/orders.cases.ts`, `tests/e2e/`: contratos actuales; varios prueban acceso técnico y deben adaptarse, no deshabilitarse.
- `NOTES.md`, `docs/progress.md`: decisiones e historial de ejecución.

## Congelado

- Las cuatro tarjetas y sus rutas: `/clientes`, `/ordenes`, `/cheques`, `/comprobantes`. Sin quinta tarjeta de usuarios, técnicos o mesas. Cuenta corriente y cobros siguen siendo necesarios, aunque no tengan tarjeta propia en Inicio.
- TURNO → TERMINADO → ENTREGADO; mesa/ubicación es texto libre, no un estado ni catálogo.
- Identidad de clientes/órdenes, historial, control de versiones e idempotencia. No borrar usuarios antiguos referenciados por órdenes o eventos.
- Guardado online. Ningún estado de orden, presupuesto o remito crea deuda.
- Importes decimales exactos. No convertir dinero a `number` para calcular.
- Auth.js, PostgreSQL/Drizzle y separación runtime/migraciones. No reemplazar el stack.

## Fuera de alcance

No construir administración visual de usuarios, autoservicio de cuentas, portal técnico, catálogo de técnicos, catálogo de mesas ni offline. No fusionar todas las etapas financieras en un cambio. No desplegar ni emitir comprobantes reales como prueba.

Conservar registros técnicos/asignaciones ya almacenados como antecedentes; no interpretarlos como autorización para dar acceso al técnico. Tampoco crear cuentas de usuario para poder asignar reparaciones. Si se requiere evolucionar la referencia de responsable técnico, abrir una tarea independiente de datos operativos sin login; no convertirla en un módulo de usuarios.

Findings during this task go to `docs/research/` (or wherever this repo keeps investigation writeups — create it if there is none); scope creep goes to a new task file, not into this diff.

Log every judgment call — anything this task didn't decide and you had to — to `NOTES.md` beside the diff, visibly, as you go (not reconstructed after).

## Entregables y pasos

### Fase 1 — acceso exclusivo administrativo (siguiente cambio ejecutable)

1. En `src/shared/contracts/auth.ts`, declarar explícitamente los perfiles habilitados para usar la app: admin/reception. Mantener los valores históricos del enum para no romper datos ni migraciones.
2. En `authenticate` rechazar cuentas technician/readonly aunque tengan contraseña válida y estén activas. En `authorizeIdentity` rechazar también identidades de esos perfiles con JWT previo. Mantener comprobaciones de activo y sessionVersion. El actor, rol o permiso enviado en payload nunca es autoridad.
3. Revisar el validador `actor` en órdenes: aplicar el mismo límite a las escrituras. Hacer que `can` deniegue todos los permisos de perfiles excluidos. Mantener admin con correcciones y reception sin correcciones administrativas. No ampliar reception a users:manage.
4. No eliminar hashes ni usuarios ni reactivar cuentas. Mantener bootstrap único y recuperación por terminal para las cuentas administrativas existentes; sin contraseñas predeterminadas.
5. Confirmar que todas las páginas y acciones pasan por validación de servidor. Una cuenta excluida no debe poder usar `/api/me`, `/api/admin/users`, páginas ni acciones de órdenes/clientes. Conservar respuesta/redirect coherente con la convención de cada entrada.
6. Adaptar las pruebas antiguas: usar perfiles administrativos para los recorridos válidos, y transformar las pruebas técnicas en comprobaciones de denegación tanto con login nuevo como con sesión previa. No eliminar el test de inyección de rol, concurrencia, rollback, idempotencia ni protección de historial.
7. Mantener las dos pantallas nuevas con estado pendiente hasta que se implemente cada etapa de fase 2. Registrar los archivos modificados y el resultado de cada comprobación.

### Fase 2 — módulos funcionales todavía pendientes

Preparar un contrato propio por entrega antes de implementar. Reutilizar los contratos comerciales existentes; no inventar saldos de deuda desde órdenes o facturas históricas sin conciliación.

1. **Impresión de fichas:** definir numeración/papel y representación de la orden; reimprimir no cambia estado ni crea movimientos. Continúa pendiente.
2. **Importación y consulta histórica:** obtener copia actual, mapeos e identidad de origen; conservar clientes reutilizables y órdenes abiertas sin duplicación; conciliar obligaciones. Continúa pendiente.
3. **Cuenta corriente y apertura:** libro por cliente y obligaciones conciliadas, saldo/pendientes/crédito separados. Depende del modelo de obligaciones, no del estado de la reparación. Continúa pendiente.
4. **Cobros, anticipos y recibos:** componentes de pago, aplicación parcial explícita a obligaciones del mismo cliente y excedentes como crédito. Los recibos pertenecen al ámbito de Comprobantes; no son facturas. Depende de cuenta corriente. Continúa pendiente.
5. **Cheques — `/cheques`:** cartera de terceros, cliente/entregante, banco, número, importe/moneda, fechas y vínculo al componente de cobro; movimientos de depósito/acreditación/rechazo con historial. Recibir acredita comercialmente una vez; acreditar no duplica; rechazar revierte sólo el componente del cheque y sus aplicaciones una vez. Depende de cobros y cuenta corriente. Sin eCheq/integración bancaria por defecto. Continúa pendiente.
6. **Comprobantes — `/comprobantes`:** integrar remitos, recibos, consulta de documentos, listados e información fiscal. Mantener identidades distintas de factura/recibo/remito. Documentos emitidos conservan snapshot para reimpresión. Remito se vincula a orden y entrega sin volver a entregar/cobrar. Listados deben conciliar con registros, usar los mismos filtros al imprimir y distinguir ventas de cobros. Continúa pendiente.
7. **ARCA dentro de Comprobantes:** homologación, validación y autorización persistidas, resultado desconocido recuperado por consulta e identidad fiscal única. Factura autorizada crea deuda exactamente una vez; borrador/remito no. Antes de programar el adaptador, verificar modalidad, punto de venta, comprobantes y documentación vigente. Producción es una etapa independiente con credenciales y operación real autorizada; no activar emisor ficticio desde el esqueleto. Continúa pendiente.
8. **Despliegue y reemplazo:** respaldo, restauración probada, ensayo de migración, validación de impresión y corte con un solo sistema escritor. Continúa pendiente.

La correspondencia con la lista del review es: punto 7 → Cheques; puntos 8 y 9 → Comprobantes. Impresión, histórico, cuenta y cobros siguen pendientes aunque no agreguen tarjetas nuevas.

## Fallos conocidos

- `NOTES.md` y git de clientes documentan pérdida de valores tras errores de useActionState: conservar formularios controlados.
- Las páginas se renderizan en paralelo con layouts: validar cada página/acción, no sólo el layout.
- Existen dos validadores de identidad (auth y actor transaccional de órdenes): cambiar uno solo deja una entrada con política anterior.
- El enum y los eventos contienen referencias a perfiles anteriores. Borrar filas o recrear enum/tablas rompe trazabilidad y claves foráneas.
- Los tests de navegador e integración actuales usan técnicos como fixtures válidos: deben cambiar de expectativa al retirar ese acceso. Un fallo esperado no justifica desactivar la prueba.
- El repo aún no tiene historia de implementación financiera; los riesgos comerciales están documentados en el plan/contrato, no en un módulo ya probado. No asumir que existe una API de cobros o un adaptador fiscal.

## Gate de aceptación

Para fase 1:

- Unitarias: admin/reception conservan permisos previstos; technician/readonly no tienen permisos de app.
- Integración PostgreSQL: contraseña válida de perfil excluido no autentica; identidad previa de perfil excluido no autoriza lectura ni escritura; cuenta administrativa desactivada o sessionVersion vieja tampoco; datos anteriores permanecen intactos.
- E2E: Ricardo/administración ingresan, ven exactamente las cuatro tarjetas y pueden navegar a Cheques/Comprobantes con aviso pendiente. Sin sesión, las rutas redirigen a ingreso. No aparecen tarjetas de usuarios, técnicos ni mesas.
- Mantener pruebas de alta/edición de clientes y órdenes, secuencia de estados, conflicto, rollback e idempotencia. Cada fallo debe identificar caso y esperado/obtenido en logs, sin contraseñas ni URLs privadas.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:integration`, `npm run build` y los E2E afectados. No eliminar guards, bajar umbrales ni omitir suites para obtener verde.

Fase 2 tendrá gates por contrato, además de mantener los anteriores. No marcar Cheques/Comprobantes completos por mostrar una pantalla o almacenar una referencia externa.

## Verificación adicional

Inspección visual en escritorio/móvil. Capturas informativas, sin gate por geometría o velocidad. Confirmar impresión real y homologación en sus etapas correspondientes.

## Revisión de especificación

Revisado con spec-review el 26/10/2026 contra auth, permisos, actor de órdenes y rutas nuevas. Corregida la ambigüedad entre plan actualizado y acceso ya restringido: **fase 1 sigue pendiente**. Separada la estructura ya entregada de los módulos financieros pendientes. Sin cambios destructivos de datos ni módulo de usuarios/mesas encubierto.
