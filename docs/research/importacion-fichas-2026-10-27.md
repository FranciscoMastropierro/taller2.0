# Hallazgos de implementación — 27/10/2026

## Fuente y alcance

SQLite autorizada por el usuario: `../outputs/sqlite/galante_analisis.sqlite`. Conteos 8.421 clientes y 31.233 trabajos; 32 trabajos sin cliente vinculable. SHA256 `cee06ae750ea4aa966c513181daf9cf776b865eab395d51d51c9f1743a56a911` antes y después de cargar. Revalidar con `npm run import:legacy -- --source=../outputs/sqlite/galante_analisis.sqlite --verify` (conexión runtime, sólo lectura).

La copia no tiene un estado homogéneo de tres valores ni unidad de tiempo fiable. Se conserva el original sin transformación destructiva; administración confirma estado/cliente al continuar. Los importes de facturas, recibos, pagos y trabajos no se usaron como deuda.

## Incompatibilidad real SQLite/Drizzle

La lectura con `node:sqlite` devuelve filas con prototipo nulo. Esas filas usadas directamente como valores JSON de Drizzle provocaron TypeError, aunque las pruebas con objetos normales pasaban. Carga real inicialmente fallida y revertida en la transacción. Convertir con `{ ...row }` al leer y en la frontera de persistencia resolvió el problema. Integración ahora prueba importación con objetos de prototipo nulo (`tests/integration/legacy.cases.ts`).

## Nombres incompletos

Hay clientes sin nombre válido para el contrato operativo de dos caracteres. Se conserva JSON completo y se muestra `Cliente anterior #N (sin nombre)` sin fusionar ni inventar identificación. Cubierto en `tests/legacy.test.ts`, incluidos nombres de un carácter.

## Ficha y continuidad

La fotografía no permitía deducir medidas. El usuario confirmó 15 × 20 cm y número repetido al pie para recortar/pegar en el equipo. `src/components/order-sheet.module.css` usa página 150 × 200 mm. PDF sintético generado por Chromium con preferCSSPageSize y revisado con Poppler: una página, 425,04 × 567,12 puntos (redondeo del motor). Revalidar ejecutando el E2E de histórico y `pdfinfo test-results/ficha-15x20.pdf`.

Una ficha histórica entregada debe poder imprimirse sin promover/reabrir la reparación: ruta GET propia basada en originales, sin escrituras. Una orden actual conserva ficha por revisión/tipo, con snapshot de cliente y trabajo. Pruebas comprueban que imprimir no crea orden/evento y que editar cliente/orden después no altera la revisión guardada.

No se encontró modalidad fiscal, tipo de comprobante ni punto de venta confirmado. El usuario confirmó ese faltante en esta sesión; ARCA permanece pendiente, sin emisor ficticio.
