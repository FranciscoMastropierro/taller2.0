# Cheques de terceros — 27/10/2026

## Objetivo
Entrega separada sobre db15ec9: recibir cheques como componentes de cobro, consultar cartera y registrar depósito/acreditación/rechazo con historial y reversión exacta.

## Paso 0
Revalidar recibos/componentes, libro inmutable, aplicaciones por componente y bloqueo de cliente. No cartera ni integración bancaria previa. Deuda se acredita al recibir el instrumento, no al depositar/acreditar.

## Contexto
`src/shared/contracts/payments.ts`, `src/server/payments/service.ts`, `src/server/accounts/positions.ts`, `src/app/cheques/page.tsx`, `src/app/clientes/[id]/cuenta/payment-form.tsx`, contrato reemplazo, NOTES.

## Congelado
ARS exacto, trazabilidad de componente/aplicaciones, snapshot de recibo inmutable, cuatro tarjetas y finance:write. No importación automática de cheques de la copia antigua.

## Fuera de alcance
eCheq, bancos conectados, cheques propios, dólares, endoso, comisiones bancarias y emisión fiscal. Revertir no borra aplicaciones ni altera el efectivo del cobro mixto.

Findings during this task go to `docs/research/` (or wherever this repo keeps investigation writeups — create it if there is none); scope creep goes to a new task file, not into this diff.

Log every judgment call — anything this task didn't decide and you had to — to `NOTES.md` beside the diff, visibly, as you go (not reconstructed after).

## Entregables
1. Cheque físico por componente: banco, cuenta libradora (para distinguir numeraciones de cuentas distintas), número, entregante, fecha emisión/pago. Importe se obtiene del crédito asociado; moneda ARS. Identidad única normalizada banco/cuenta/número, con bloqueo ordenado para recepción concurrente.
2. Estados received → deposited → credited; rechazo desde cualquiera de esos estados con motivo, terminal. Cada comando UUID/hash/versión, actor y fecha; reintento idéntico no duplica. Transición recibida inicial en historial. No simular respuesta bancaria: movimientos son confirmaciones manuales del personal.
3. Rechazo inserta reversión única ligada al crédito y movimiento. El libro agrega movimiento de reversión, no borra crédito/aplicaciones. Las aplicaciones de ese crédito dejan de descontar obligaciones; disponible de ese crédito queda cero. Efectivo/otros componentes permanecen activos. Depositar/acreditar no agrega crédito.
4. Cartera/listado y detalle protegido con historial; formulario de cobro añade cheque y datos requeridos. Cuenta muestra cheques pendientes de cobro separados (received/deposited). Recibo conserva la descripción inicial y enlaza al cheque para estado vigente.

## Fallos conocidos
Subconsultas de aplicaciones deben calificar la columna externa. No recalcular deuda desde estado de orden ni registrar otro crédito en acreditación. No permitir usar crédito rechazado ni reactivar aplicaciones al reintentar. Fuente vieja no demuestra cartera actual.

## Gate
F4 cheque100 reduce deuda una sola vez; depósito/acreditación no alteran saldo; rechazo restaura100 exactamente una vez. Mixto efectivo40+cheque60 sólo revierte60 y sus aplicaciones. Concurrencia/idempotencia/versión, identidad duplicada, rollback de recibo completo, actor excluido y sesión vieja. Runtime sin UPDATE/DELETE de historial/reversiones. E2E recepción y movimientos. Suites previas, lint/typecheck/build.

## Verificación adicional
Capturas informativas. Sin depósitos bancarios reales ni cheques reales de prueba.

## Revisión
spec-review: la distribución de aplicaciones ya se conserva por componente. Se añade cuenta libradora para evitar confundir cheques de igual banco/número en cuentas distintas; no crear catálogo de bancos ni cuentas de login.

## Ejecución
Recibir mediante cobro, cartera, depósito/acreditación/rechazo, historial y reversión por componente implementados. Snapshot de recibo preservado; cuenta muestra cartera pendiente separada. Migración `0006_graceful_diamondback.sql` y grants aplicados local/pruebas, sin instrumentos reales ni depósitos de prueba.

Correctos 11 unitarias, 43 casos de integración, 9 E2E, lint/typecheck/build. F4 y mixto40/60 verificados, incluido rechazo después de acreditación, reintentos/concurrencia y bloqueo de crédito rechazado. Captura del historial sintético inspeccionada. Se aislaron estilos con páginas CSS nombradas para que el papel de recibos no cambie el tamaño 15 × 20 de las fichas al navegar entre documentos.
