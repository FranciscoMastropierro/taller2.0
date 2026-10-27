# ARCA — precondiciones antes del adaptador

Fecha: 27/10/2026. Estado: **pendiente de información externa**, sin adaptador ni emisión fiscal habilitados.

## Objetivo
Cerrar modalidad fiscal y configuración autorizada para preparar el contrato de homologación, autorización, recuperación de resultados y comprobante imprimible solicitado. El usuario informó que cree que existe impresora fiscal, pero no confirmó modalidad, tipos ni punto de venta. No elegir un emisor por suposición.

## Paso 0
Revalidar con responsable: modalidad real (servicios web o equipo fiscal), modelo/conexión si corresponde, CUIT/condición fiscal del emisor, tipos habilitados, punto de venta y un comprobante actual con datos sensibles ocultos. Credenciales/certificados se incorporan por canal seguro/configuración local, nunca en chat/Git. Verificar documentación oficial vigente de la modalidad elegida antes de escribir el adaptador o especificar llamadas.

## Contexto
`docs/contracts/reemplazo.md`, plan rector, tareas 008–011; `src/server/db/schema/index.ts`, servicios de cuentas/pagos/documentos, `src/app/comprobantes/`. Hoy hay aperturas, cobros/recibos y constancias internas; **no hay facturas autorizadas ni ventas fiscales calculadas**.

## Congelado
Factura autorizada genera obligación una sola vez. Borrador, presupuesto, recibo, remito y entrega no generan cargos fiscales. Identidad fiscal única, snapshot inmutable y consulta de resultado desconocido antes de reintentar. No duplicar obligaciones conciliadas del legado.

## Fuera de alcance hasta confirmar precondiciones
Emisión real, credenciales productivas, emisor ficticio que simule autorización, elección automática de tipo/punto de venta y reporte de ventas basado en recibos. Producción requiere etapa independiente autorizada.

Findings during this task go to `docs/research/` (or wherever this repo keeps investigation writeups — create it if there is none); scope creep goes to a new task file, not into this diff.

Log every judgment call — anything this task didn't decide and you had to — to `NOTES.md` beside the diff, visibly, as you go (not reconstructed after).

## Entregables siguientes, al disponer de información
1. Investigación con fuentes oficiales vigentes y contrato revisado de la modalidad confirmada; escenarios de homologación y estados persistidos antes del adaptador.
2. Configuración segura y separación homologación/producción. Validar datos fiscales reales del emisor/cliente, tipos y numeración habilitada sin inventar valores predeterminados.
3. Documentos fiscales persistidos, identidad única, resultados autorizados/rechazados/desconocidos y recuperación por consulta. Vincular una autorización a una obligación con idempotencia transaccional; asociar obligaciones previas conciliadas cuando corresponda.
4. Extender el libro para obligaciones fiscales y actualizar juntos los selectores de deudas de pagos, cálculo de cuenta, reporte de deudores y pruebas. Hoy esos selectores reconocen `opening_debt`; no agregar otro tipo sin actualizar todos esos puntos.
5. Ventas basadas en comprobantes fiscales y sus correcciones, separadas de cobros, con mismos filtros al imprimir. Comprobante autorizado conserva representación/snapshot para reimpresión.

## Fallos a prevenir
Respuesta perdida no significa rechazo ni permite nueva numeración a ciegas. No repetir cargo al recuperar una autorización. No cancelar documentos autorizados borrando filas. No hacer pruebas productivas como sustituto de homologación. No confundir recibos internos ya disponibles con facturas.

## Gate futuro
Homologación con modalidad/configuración verificadas; casos de autorización, rechazo, timeout/resultado desconocido y recuperación; doble solicitud crea una sola identidad/obligación. Snapshot imprimible y ventas conciliadas con documentos, sin sumar cobros como ventas. Producción queda fuera del gate de desarrollo.

## Verificación adicional
Validación de remito definitivo, comprobantes y hardware con responsable/asesor en su etapa. La impresión de ficha de 15 × 20 cm permanece independiente.
