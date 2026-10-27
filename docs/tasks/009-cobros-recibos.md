# Cobros, anticipos y recibos — 27/10/2026

## Objetivo
Entrega separada sobre cuenta corriente: cobros con componentes efectivo/transferencia, aplicación parcial explícita a varias obligaciones y uso posterior de crédito. Recibo interno inmutable, independiente de factura/remito.

## Paso 0
Revalidar afdfd09, libro account_entries y dinero BigInt, aperturas conciliadas admin, actor transaccional authorizeActor. No hay facturas autorizadas ni pagos anteriores importados como saldo.

## Contexto
`src/server/accounts/service.ts`, `src/shared/contracts/money.ts`, `src/server/db/schema/index.ts`, `src/app/clientes/[id]/cuenta/`, `src/app/comprobantes/page.tsx`, `docs/contracts/reemplazo.md`, NOTES.

## Congelado
ARS exacto. UUID/idempotencia, clientes fijos, misma cuenta para componentes y obligaciones. Recibo no factura. Cuatro tarjetas. Recepción opera cobros pero no aperturas ni users:manage. Impresión no mueve cuenta.

## Fuera de alcance
Cheques (entrega siguiente), reversión de cobros y ajustes (contrato propio), facturación fiscal, carga automática del legado y despliegue.

Findings during this task go to `docs/research/` (or wherever this repo keeps investigation writeups — create it if there is none); scope creep goes to a new task file, not into this diff.

Log every judgment call — anything this task didn't decide and you had to — to `NOTES.md` beside the diff, visibly, as you go (not reconstructed after).

## Entregables
1. Permiso finance:write para admin/reception. Libro añade payment_credit por componente. payment_receipts con secuencia interna R, snapshot, total, hash/actor; payment_components enlazan crédito; application_batches/idempotencia y credit_applications inmutables con vínculos a débito/crédito e importe.
2. Comando bloquea actor, identidad del comando y cliente; valida componentes positivos y sumatoria exacta. Aplicaciones con obligación/importe elegidos explícitamente, sin sobrepago ni cruce de cliente. Distribuir importes entre componentes en el orden declarado, guardar distribución para futura reversión por componente. Reintento idéntico devuelve recibo; distinto rechaza.
3. Aplicar crédito existente crea aplicaciones auditadas, nunca otro cobro. Revalidar disponibles bajo bloqueo de cliente; concurrencia no sobreaplica. Diferenciar saldo neto, deuda pendiente y disponible. Sin aplicación automática a deudas nuevas.
4. Formularios controlados desde cuenta: componentes dinámicos y cantidades por obligación. UUID del comando fijo en estado del componente ante errores/rerenders; sólo un resultado confirmado reinicia el ciclo del formulario. Registrar anticipo sin aplicaciones. Uso de crédito por selección. Comprobantes consulta recibos y abre snapshot imprimible, sin emitir factura.

## Fallos conocidos
No convertir dinero a number; no volver a sumar un anticipo al aplicarlo. No mezclar saldo neto con deuda pendiente. User/rol de payload no son autoridad. Protecciones servidor por página/acción; campos se mantienen ante error. Finanzas no tiene importador previo que determine deuda conciliada.

## Gate
F2 anticipo30 aplicado a deuda100 deja pendiente70 y cobro único30. F3 pago150 aplicado70+60 deja20. Concurrencia/sobreaplicación, cross-client, rollback total, idempotencia y snapshots inmutables. Runtime sin UPDATE/DELETE de recibos/aplicaciones/libro. E2E cobro y reimpresión. Lint/typecheck/unitarias/integración/build y suites anteriores.

## Verificación adicional
Capturas informativas. Recibos internos; no homologación ni comprobante fiscal. Sin cobros reales de prueba.

## Revisión
spec-review: las obligaciones disponibles hoy son aperturas; la UI no las llama facturas autorizadas. finance:write se agrega sin ampliar correcciones/gestión de usuarios. Tipos fiscales y cheques siguen separados.

## Ejecución
Cobros efectivo/transferencia, anticipos, aplicaciones a varias obligaciones, uso posterior de créditos y recibos implementados. Comprobantes consulta recibos; ARCA sigue explícitamente pendiente. Migración `0005_green_blindfold.sql` aplicada en pruebas/local con grants. No se registraron cobros reales.

Correctos lint/typecheck/build, 11 unitarias, 37 casos de integración y 8 E2E. F2/F3, rollback, idempotencia, distribución por componentes y concurrencia verificados. Captura de recibo sintético inspeccionada. La primera prueba detectó correlación SQL incorrecta de `id` en subconsulta; referencia externa calificada y regresión cubierta por los mismos casos financieros.
