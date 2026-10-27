# Cuenta corriente y aperturas — 27/10/2026

## Objetivo
Entrega financiera independiente de fichas/histórico: cuenta por cliente con deuda pendiente, crédito disponible y saldo neto diferenciados. Registrar aperturas revisadas explícitamente, sin calcular deuda desde la SQLite.

## Paso 0
Revalidar commit 9764b20, cuatro tarjetas, admin/reception, schema con clientes reutilizables y sin libro comercial. Fuente recuperada cargada pero no conciliada. Dinero existente se representa como cadena decimal; no usar number para operar.

## Contexto
`src/server/db/schema/index.ts`, `src/server/auth/permissions.ts`, `src/server/orders/service.ts` (actor bloqueado), `src/app/clientes/[id]/page.tsx`, `docs/contracts/reemplazo.md`, `scripts/runtime-grants.sql`, `NOTES.md`.

## Congelado
Sin deuda por estados/presupuestos/remitos. Sólo ARS en esta entrega. Acceso administrativo, sin tarjeta nueva. Aperturas son movimientos comerciales revisados, no documentos fiscales. Fuente privada inmutable.

## Fuera de alcance
Importar saldos automáticamente, pagos/aplicaciones, cheques, remitos y ARCA. Cada uno continúa en contrato/commit propio.

Findings during this task go to `docs/research/` (or wherever this repo keeps investigation writeups — create it if there is none); scope creep goes to a new task file, not into this diff.

Log every judgment call — anything this task didn't decide and you had to — to `NOTES.md` beside the diff, visibly, as you go (not reconstructed after).

## Entregables
1. Libro inmutable `account_entries`: UUID estable, cliente, tipo opening_debt/opening_credit, referencia origen única global normalizada, importe positivo numeric(18,2), fecha comercial ISO válida, evidencia de conciliación, hash de payload, actor y fecha. No UPDATE/DELETE runtime. Tipos de factura/cobro se agregan en entregas siguientes.
2. Apertura sólo admin con evidencia mínima de 10 caracteres y confirmación explícita de conciliación. Recepción consulta. Bloquear actor y cliente durante comando. Repetir UUID/origen con mismo payload retorna identidad original; distinto payload no sobrescribe. Origen único evita recontar apertura y detalle conciliado; futuros importadores deberán reutilizar la identidad de obligación, no agregar otro cargo.
3. Importes validados en cadenas, normalización decimal y cálculos BigInt en centavos. Saldo neto = obligaciones − créditos; hasta implementar aplicaciones, deuda pendiente y crédito disponible permanecen separados sin compensación implícita. Ninguna apertura falsa de cero al importar.
4. Ruta `/clientes/[id]/cuenta` con saldos, movimientos paginados y formulario controlado de aperturas para admin. Lectura de todos sus componentes en un mismo snapshot repeatable read de sólo lectura, con consultas secuenciales sobre la conexión. Mostrar claramente que no existen saldos conciliados si la cuenta está vacía. Enlaces desde cliente.

## Fallos conocidos
Fuente antigua contiene pagos/facturas/manuales que no se deben sumar indiscriminadamente. Formularios controlados ante fallo. Validación por página/acción además del layout. Bloquear usuario persistido impide que payload o cambio concurrente de rol eluda autorización. Consultado historial del área: no hay libro previo; no extrapolar presupuestos como deuda.

## Gate
Unitarias de precisión, límites/fechas. Integración: idempotencia concurrente, origen repetido distinto, cliente inexistente y rollback, acceso recepcionista/excluido denegado para apertura, saldo 100 deuda/30 crédito = neto70/pendiente100/crédito30, grants sin UPDATE/DELETE. E2E cuenta vacía/apertura/consulta y permisos. Lint/typecheck/build y suites anteriores.

## Verificación adicional
Capturas informativas. No cargar aperturas reales sin documento revisado por administración. Sin emisión fiscal ni despliegue.

## Revisión de especificación
spec-review contra código: no existe permiso financiero de escritura; no ampliar reception ni users:manage. Apertura queda acotada a admin en el servicio. Se reutiliza validación transaccional del actor y se deja la cuenta vacía tras la importación.

## Ejecución
Libro y UI implementados. Actor transaccional compartido extraído a `src/server/auth/service.ts` como `authorizeActor`, conservando el bloqueo y política existente; órdenes/fichas/histórico lo reutilizan. Migración `0004_shiny_sandman.sql` aplicada en pruebas y local, con grants. No se registraron aperturas reales.

Gate correcto: lint/typecheck/build, 11 unitarias, 32 casos de integración y 7 E2E. Captura de cuenta sintética inspeccionada. Saldos exactos y separados; recepción consulta y no registra aperturas. Cobros/aplicaciones siguen en entrega posterior.
