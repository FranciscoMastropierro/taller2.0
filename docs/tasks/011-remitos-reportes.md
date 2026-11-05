# Constancias internas y reportes — 27/10/2026

## Objetivo
Entrega separada de 7ad139b: constancia interna de entrega vinculada a orden/evento y reportes imprimibles de pendientes, deudores y cobros comerciales. Remito definitivo y ventas fiscales esperan sus verificaciones fiscales.

## Paso 0
Revalidar secuencia de órdenes/eventos, recibos, aplicaciones activas/reversiones y permisos. No ARCA ni facturas autorizadas. Usuario no confirmó modalidad fiscal, tipos ni punto de venta. No asumir que un recibo constituye venta ni una apertura facturación del período.

## Contexto
`src/server/orders/service.ts`, schema, `src/server/accounts/positions.ts`, `src/server/payments/service.ts`, `src/app/comprobantes/`, `src/components/internal-document.module.css`, contrato reemplazo y NOTES.

## Congelado
Cuatro tarjetas; ARS exacto, snapshots, idempotencia y actor bloqueado. Documento de entrega no vuelve a entregar ni cobrar. Datos del legado no se suman como saldos/ventas actuales.

## Fuera de alcance
Remitos reglamentarios definitivos sin validación acordada, ARCA, reporte de ventas fiscales sin facturas autorizadas, transporte/inventario y despliegue. UI nombra documento como remito interno/constancia de entrega, no factura.

Findings during this task go to `docs/research/` (or wherever this repo keeps investigation writeups — create it if there is none); scope creep goes to a new task file, not into this diff.

Log every judgment call — anything this task didn't decide and you had to — to `NOTES.md` beside the diff, visibly, as you go (not reconstructed after).

## Entregables
1. delivery_notes inmutable: UUID, número RI interno, orden, evento de entrega único, snapshot cliente/equipo/trabajo/receptor/fecha/nota, hash y actor. Sólo orden actualmente entregada y versión esperada. Evento es el último status/correction que pasó a delivered. Reintento por UUID/evento idéntico retorna documento; otro payload rechaza. Corrección y posterior nueva entrega pueden tener otro evento/documento; anteriores se conservan.
2. Formulario desde orden entregada; listado en Comprobantes y página imprimible desde snapshot. No modificar orden/eventos/libro. Firma/receptor como texto registrado, no firma digital ficticia.
3. Reportes online imprimen el mismo DOM/resultados/filtros, sin otra consulta al imprimir. Filtros tipo, cliente(nombre/código interno), desde/hasta. Pendientes: órdenes actuales no entregadas; fecha de incorporación al sistema nuevo, no fecha antigua inferida. Deudores: posición actual neta positiva, con pendiente y crédito separados; sin fecha histórica ficticia. Cobros: recibos brutos menos reversiones de cheques por fecha comercial, distinguido de ventas/fondos bancarios.
4. Máximo 2.000 filas, solicitar acotar filtro al superar; nunca imprimir recorte silencioso ni total parcial. Sin reporte de ventas falso: opción fiscal explícitamente pendiente hasta facturas autorizadas.

## Fallos conocidos
Subconsultas correlacionadas deben usar alias externos calificados. La fecha de continuidad no sustituye la original. Historial debe conservar snapshots; leer cliente actual para reimprimir cambia el documento. Un remito no debe disparar entrega/cobro. No calcular ventas desde recibos o aperturas.

## Gate
Documento sólo al entregar; reintento concurrente una sola identidad; payload distinto/versionado rechazado, snapshot tras editar cliente inmutable, órdenes/eventos/libro sin efectos. Reportes filtran fechas/clientes de forma coherente, deudores netos exactos, cobros100/rechazo60=neto40 sin ventas. Roles excluidos/versión vieja denegados y grants sin UPDATE/DELETE. E2E constancia/reimpresión/reportes y suites anteriores. Lint/typecheck/build.

## Verificación adicional
Capturas escritorio/móvil y PDF de ficha para verificar aislamiento de páginas CSS nombradas. Impresión física y remito definitivo pendientes de validación operativa.

## Revisión
spec-review: `createdAt` de órdenes continuadas es incorporación, no fecha vieja; así se rotula el reporte. No hay facturas autorizadas para ventas: no inventar agregados. Los reportes de deudores se consultan a posición actual y no aceptan reconstrucción de saldo a una fecha no implementada.

## Ejecución
Constancias internas RI por evento de entrega, snapshot y reimpresión implementados. Reportes de pendientes, deudores actuales y cobros/reversiones con filtros compartidos con impresión. Ventas fiscales y remito definitivo permanecen pendientes. Migración `0007_solid_romulus.sql` y grants aplicados en pruebas/local.

Se reforzaron lecturas de cuenta/historial de cheque con repeatable read de sólo lectura y consultas secuenciales en la misma conexión. UUID de formulario permanece estable ante errores; la confirmación inicia un nuevo ciclo. La continuidad de histórico explícitamente ENTREGADO se rechaza, conservando consulta/impresión.

Gate final correcto: lint/typecheck/build, **11 unitarias, 49 casos de integración y 9 E2E**. Reintento tras sobreaplicación conserva valores y UUID. Constancia concurrente no duplica ni mueve orden/libro; reportes100−60=40 verificados. Capturas de constancia/reporte y PDF de ficha inspeccionados: una página 425,04 × 567,12 pt (15 × 20 cm, redondeo de Chromium).

Verificación final de fuente por runtime: 8.421 clientes/31.233 órdenes, cero diferencias de originales y vínculos, SHA sin cambios. Base local sin movimientos comerciales de prueba: cero entradas de cuenta, recibos, cheques o constancias. Sin despliegue ni emisión fiscal. Precondiciones siguientes en tarea 012.
