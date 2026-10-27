# Impresión e histórico — 27/10/2026

## Objetivo
Primera entrega de la continuidad solicitada: ficha con distribución anterior, clientes recuperados reutilizables y órdenes históricas consultables/promovibles sin duplicar identidad. Autoridad: usuario confirmó formato anterior de **15 cm de ancho × 20 cm de alto**, número repetido arriba/al pie para cortar y pegar en el equipo, y cargar `../outputs/sqlite/galante_analisis.sqlite` en la nueva BD. Finanzas continúa por contratos separados de tarea 006.

## Paso 0
Verificado 27/10: rama feat/acceso-administrativo con cambios previos locales a conservar. SQLite read-only: 8.421 clientes, 31.233 órdenes, 32 sin cliente vinculable, 42 clientes sin nombre utilizable. Estados heterogéneos; última orden 31233. Fuente anterior a la operación actual, no representa saldos conciliados. `../sqlite/build_sqlite.py` es el escritor del modelo consultable, fechas sin zona como texto, importes en centavos, tiempos sin unidad inferible.

## Contexto
`src/server/db/schema/index.ts`, `src/server/orders/service.ts`, `src/app/ordenes/`, `scripts/runtime-grants.sql`; `../imagenes soft viejo/sistema-galante-comprobante_trabajo.jpeg` contiene el formato; `../docs/research/analisis-esquema-sqlite.md` documenta anomalías. Next local: server/client-components y authentication revisados.

## Congelado
Cuatro tarjetas. Acceso admin/reception. Estados existentes. Dinero exacto. Ninguna importación, promoción o impresión genera deuda/cobro/entrega. No reemplazar números internos nuevos ni convertir tiempo histórico a minutos. Conservar SQLite inmutable.

## Fuera de alcance
Conciliación y carga comercial, cobros, cheques, remitos fiscales, ARCA y producción. Papel 150 × 200 mm, margen de 8 mm y escala 100 %. Calibración física requiere ensayo con impresora. Modalidad fiscal, tipos y punto de venta todavía no verificados; emisión ARCA pendiente.

Findings during this task go to `docs/research/` (or wherever this repo keeps investigation writeups — create it if there is none); scope creep goes to a new task file, not into this diff.

Log every judgment call — anything this task didn't decide and you had to — to `NOTES.md` beside the diff, visibly, as you go (not reconstructed after).

## Entregables y pasos
1. Fuentes con SHA256 y namespace fijo; clientes con código anterior único y JSON original. Sin fusiones por nombre. Nombre faltante visible como `Cliente anterior #N (sin nombre)`; no inventar contacto. Histórico de órdenes en tabla propia con UUID estable, número viejo único, JSON original y cliente opcional.
2. CLI dry-run por defecto; aplicar explícitamente como administrador existente por conexión de migraciones local. Transacción única, bloqueo común, reintento del mismo hash sin escrituras, hash distinto exige tarea de actualización. No sobrescribir cambios de clientes ya importados. Logs sólo conteos/hash/etapa.
3. Histórico paginado dentro de Órdenes, búsqueda por número anterior/cliente/equipo. Promoción explícita con cliente y estado elegidos, mismos UUID y referencia vieja. Número interno independiente. No cuentas técnicas; tiempos/presupuestos ambiguos siguen en original. Concurrencia de promoción idempotente con detección de payload distinto.
4. Fichas ingreso/trabajo con snapshot inmutable por orden/versión/tipo. Identidad interna y anterior rotuladas por separado. Reimpresión desde snapshot sin tocar estados/eventos; nuevos cambios generan otra revisión, nunca reescriben ficha anterior. Vista HTML imprimible con campos según foto, tamaño 150 × 200 mm, número repetido en talón inferior con línea de corte y estilos de impresión sin navegación. Guardado protegido en servidor, GET sólo lectura. Las órdenes archivadas se imprimen desde originales sin continuar la reparación; presupuesto y tiempo originales se muestran como texto.

## Fallos conocidos
NOTES: formularios useActionState deben conservar valores; validar página y acción además del layout. Enum/usuarios históricos no se borran. Datos anteriores: clientes faltantes, nombres vacíos, fechas anómalas, estados ambiguos y tiempos sin unidad. No inferir aperturas de facturas/pagos originales. Búsqueda de historial del código: no existe importador previo a esta entrega.

## Gate
Lint/typecheck/unitarias/integración/build/E2E afectados. Integración: importación sintética idempotente, hash cambiado rechazado, rollback y conservación de cambios posteriores; promoción concurrente, payload distinto, perfil excluido, cliente requerido; fichas iguales tras editar cliente/orden, versión antigua rechazada y runtime sin UPDATE/DELETE de snapshots. Recuento real de carga 8421/31233, SHA antes/después igual; no datos privados en logs.

## Verificación adicional
Capturas de ficha y vista de impresión, escritorio/móvil. Impresión física pendiente; no usar geometría como gate determinista.

## Revisión de especificación
Aplicada spec-review al código leído: el equipo no tiene columna equivalente inequívoca en SQLite; usar marca/modelo como descripción visible al promover y conservar originales. No mapear automáticamente estados antiguos a estados operativos. `createdAt` nuevo es fecha de incorporación; fecha anterior se conserva como texto, sin reinterpretar fechas anómalas.

## Ejecución

- Migración `0003_curious_the_hunter.sql` aplicada a pruebas y base local; grants actualizados. CLI `scripts/import-legacy.ts`, servicios `src/server/legacy/` y `src/server/orders/sheets.ts`, rutas de histórico/fichas y componente `src/components/order-sheet.tsx` implementados.
- Fuente SHA256 `cee06ae750ea4aa966c513181daf9cf776b865eab395d51d51c9f1743a56a911`. Carga local completa: **8.421 clientes / 31.233 órdenes**. Reintento: `already_imported`. Verificación por conexión runtime compara originales y vínculos: **0 diferencias de clientes y 0 de órdenes**. La SQLite conserva el mismo hash.
- Intentos iniciales revertidos completos por incompatibilidad de objetos SQLite sin prototipo con Drizzle; normalizados a objetos planos y cubiertos en integración. Nombres de un carácter reciben rótulo de dato faltante sin perder original.
- 9 unitarias y 26 casos de integración correctos. Build/lint/typecheck correctos; E2E general 6/6, incluido histórico/continuidad/impresión. PDF de prueba: **1 página, 425,04 × 567,12 puntos**, equivalente a 15 × 20 cm con redondeo de Chromium; render inspeccionado con Poppler. Impresión física pendiente.
- Sin carga comercial ni apertura de deuda. Cuenta corriente, cobros/anticipos, cheques, remitos/reportes y ARCA siguen como entregas separadas. Sin despliegue.
