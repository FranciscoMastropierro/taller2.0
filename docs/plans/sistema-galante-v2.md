> Actualización de alcance — 22/10/2026: por pedido del responsable se deja sin efecto el guardado offline. La etapa 3A no es requisito para continuar. El desarrollo sigue con módulos online, comenzando por clientes (docs/tasks/004-clientes.md). Las referencias offline siguientes son antecedentes históricos, no requisitos vigentes.

# Sistema de gestión Galante — plan de continuidad y construcción

Versión: 1.1, 2026-10-21. **Stack actualizado por pedido del responsable: Next.js + TypeScript, Tailwind CSS + shadcn/ui, Auth.js + Zod, Drizzle ORM y Neon PostgreSQL. Listo para revisión técnica de otro agente y posterior ejecución por etapas. No es autorización de despliegue ni una especificación exhaustiva de cada módulo.**

## Objetivo

Reemplazar el sistema anterior conservando información y continuidad: encontrar clientes y trabajos anteriores, continuar reparaciones abiertas y cobrar deudas existentes sin duplicar movimientos. Cuenta corriente, cobros, cheques de terceros, remitos y facturación integrada con ARCA son indispensables para el reemplazo completo. Debe guardar operaciones durante cortes de Internet y sincronizarlas posteriormente. El éxito no consiste sólo en guardar la base vieja como archivo.

Este plan incorpora `../reviews/arquitectura-mvp-taller-review.md` y sustituye como plan de trabajo a `../arquitectura-mvp-taller.md` y `modernizacion-app-taller.md`, que quedan como antecedentes. Las reglas indicadas como confirmadas provienen del responsable; las soluciones técnicas y políticas de corrección son decisiones propuestas en esta versión para revisión.

### Respuestas confirmadas por el responsable

- Intentará recuperar la base actual. Está en una PC Windows 7 y el archivo muestra un candado; no se ha diagnosticado la causa ni se obtuvo todavía la copia.
- Son obligatorios cuenta corriente, cobros, cheques de terceros, remitos y facturación integrada con ARCA. Se construirán por partes antes del reemplazo completo.
- Únicamente tres estados operativos: **TURNO** (recién ingresado), **TERMINADO** (resuelto, aún en el taller) y **ENTREGADO** (retirado).
- **ESTANTERÍA es la ubicación en una mesa de trabajo**; hay varias mesas. No es un estado de reparación.
- Se requiere guardar sin Internet y resincronizar con el servidor.
- Habrá **una sola PC**, que el responsable está preparando con Windows 10. No se necesita compartir cambios entre puestos durante cortes. Cantidad de cuentas de usuario y permisos se define al configurar acceso; no implica múltiples equipos.
- La deuda comercial nace **al facturar**, no al terminar ni entregar. Se permiten anticipos y un pago para varios trabajos/facturas.
- Recibir un cheque de terceros reduce la deuda comercial, pero el instrumento permanece como **valor pendiente de cobro** hasta su acreditación.
- Galante es **responsable inscripto**. El usuario informa que dispone de impresora fiscal y cree que emite desde ARCA. La modalidad efectiva, modelo de impresora, tipos habilitados y punto de venta todavía no se verificaron; no inferirlos por esa descripción.

## Paso 0 — Hechos a revalidar

1. Ejecutar `python sqlite/verify_sqlite.py` sobre la copia congelada: el 21/10/2026 pasó con 33 tablas, 190.829 filas y 2.467 incidencias.
2. Contrastar fuente recuperada y copia vigente: las fotos muestran la orden 32991 de octubre de 2026; no existe en SQLite, cuyo último número es 31233.
3. Verificar esquema y claves de cada fuente antes de definir correspondencias. No extrapolar conteos de 2025 a otra copia.
4. Usar las respuestas anteriores como autoridad para módulos y estados. Las etiquetas adicionales de la base antigua requieren mapeo revisado; no justifican agregar estados nuevos.

## Archivos de contexto

- `../../imagenes soft viejo/`: 13 capturas examinadas, inventariadas en el review.
- `../../sqlite/schema.sql` y `../../sqlite/build_sqlite.py`: modelo recuperado y conversiones.
- `../../sqlite/verify_sqlite.py`: controles actuales de recuperación.
- `../research/analisis-esquema-sqlite.md`: anomalías y límites.
- `../research/modernizacion-app-taller.md`: antecedentes.
- `../reviews/arquitectura-mvp-taller-review.md`: hallazgos y correcciones propuestas.

## Invariantes

- Conservar originales inmutables, hashes, procedencia y reglas de transformación.
- Clientes importados reutilizables para altas nuevas, sin recarga obligatoria ni fusiones por nombre.
- Órdenes importadas identificables por su número anterior; las abiertas se continúan sin duplicarlas.
- Histórico, trabajo operativo, deuda, cobro y documento son conceptos distintos.
- No inferir saldo sumando indiscriminadamente facturas, trabajos, manuales, pagos y recibos.
- No sobrescribir cambios del sistema nuevo con una importación posterior ni permitir doble escritura durante el corte.
- Importes exactos, fechas ambiguas preservadas y anulaciones auditadas; sin borrado comercial destructivo.

## Fuera de alcance y decisiones pendientes

Esta tarea entrega documentación, no código. Inventario completo, compras, portal público, operación multi-PC y reproducción exacta de VB6 quedan fuera de esta versión. Cheques propios y operación en dólares quedan fuera de la primera versión por no haberse solicitado; sus registros históricos se preservan. Notas de crédito/débito se incluyen en el análisis fiscal para correcciones de comprobantes autorizados, según tipos habilitados para el contribuyente.

Verificaciones pendientes por etapa, sin necesidad de otra ronda de preguntas para cerrar este plan:

1. Etapa 3A: probar navegador, persistencia y arranque offline en la PC real; comprobar edición y cobertura de actualizaciones del sistema operativo.
2. Etapas 8A–8C: convertir las reglas comerciales confirmadas y los casos de aceptación de este documento en migraciones y comandos transaccionales.
3. Etapas 9A–9C: relevar modelo/conexión de impresora, un comprobante actual con datos sensibles ocultos y puntos de venta/modalidad habilitados con el responsable y su asesor contable. Determinar tipos de comprobante efectivamente autorizados. Credenciales por canal seguro al implementar. No comenzar emisión real hasta resolverlo.

La copia actual sigue pendiente y bloquea el corte definitivo, no el desarrollo con la copia recuperada. No volver a consultar estados o módulos ya confirmados.

Antes de cerrar los contratos de impresión se precisarán numeración de fichas, unidad de tiempo, impresora y papel. Antes de emitir remitos definitivos, validar contenido, numeración y requisitos aplicables con el responsable y su asesor contable; un comprobante interno de traslado no debe presentarse automáticamente como remito reglamentario.

Findings during this task go to `docs/research/` (or wherever this repo keeps investigation writeups — create it if there is none); scope creep goes to a new task file, not into this diff.

Log every judgment call — anything this task didn't decide and you had to — to `NOTES.md` beside the diff, visibly, as you go (not reconstructed after).

## Entregables y pasos

### 1. Cerrar requisitos y contrato de reemplazo

Usar esta versión como alcance único. Describir recepción → terminación → entrega y, en un flujo relacionado pero independiente, facturación → cobro/aplicación; un anticipo puede preceder a la factura. Clasificar cada pantalla antigua como reemplazada, integrada en otra pantalla, sólo histórica o no utilizada. Definir roles y comprobantes indispensables. Salida: contratos por módulo y casos verificables; no volver a preguntar reglas ya confirmadas.

### 2. Obtener y perfilar una copia actual

Obtener backup consistente con el sistema anterior cerrado o mediante un procedimiento de copia consistente comprobado. Conservar original, hash, fecha y manifiesto. Comparar esquema, claves, conteos, estados, fechas y duplicados con la recuperación existente. No asumir que sólo se agregaron números nuevos: pueden haber cambiado clientes, entregas y pagos anteriores.

Salida: informe de diferencias y fuente candidata para ensayo. Si sólo existe la copia vieja, registrar el faltante y acordar una reconstrucción validada; bloquear el corte hasta resolverlo.

### 3. Cerrar arquitectura y crear base técnica

Arquitectura elegida para el plan: **PWA para un único puesto con Next.js App Router + TypeScript, Tailwind CSS + shadcn/ui, Auth.js, Zod, Drizzle ORM y Neon PostgreSQL**. IndexedDB y service worker mantienen el modo offline. Next.js contiene frontend y backend; no se agrega una API en otro framework. Server Actions para mutaciones online y Route Handlers para Auth.js, sincronización versionada y disparo protegido del procesador fiscal. Sin servidor local de taller ni sincronización entre PC en esta versión. Las pantallas offline no dependen de renderizado/acciones remotas: se preparan shell, rutas y datos necesarios durante el aprovisionamiento online y se prueba navegación tras reinicio sin red.

El stack sustituye Supabase, su Auth, SDK, RPC y supuestos de permisos/RLS de los documentos anteriores. Neon es la base central, no el proveedor de autenticación de este plan. Mantener restricciones e integridad PostgreSQL; no trasladar políticas que dependan de `auth.uid()` o roles de Supabase.

Instalar la PWA en un navegador compatible y mantenido. No fijar soporte de Windows 7. Para Windows 10, comprobar edición y cobertura de actualizaciones: el soporte general terminó el 14/10/2025, y la cobertura extendida depende del programa aplicable. Si el equipo carece de soporte, resolverlo antes de almacenar datos productivos; no confundir que la aplicación abra con que el puesto esté correctamente mantenido. La topología no cambia por ello.

Crear repositorio sin datos personales, ambientes separados, migraciones, identidad, permisos y CI. Agregar un procesador durable de tareas fiscales del mismo proyecto, con registro de intentos en PostgreSQL; la autorización fiscal no depende de mantener abierta una pestaña. Su alojamiento se decide junto con la topología. Salida: instalación reproducible, base vacía migrable, autenticación y pruebas de autorización.

El contrato de base debe fijar versiones compatibles de Node.js, Next.js, Auth.js, Drizzle ORM/Kit, Tailwind, Zod y demás dependencias, junto con lockfile. No copiar etiquetas `latest`, `beta` o `rc` de tutoriales sin comprobar compatibilidad y registrarlo. El proveedor de hosting de Next.js no está fijado por elegir Neon; en etapa 3 verificar runtime Node.js, conexión PostgreSQL, HTTPS, límites de ejecución y disponibilidad de scheduler protegido para ARCA.

### 3A. Probar operación offline antes de construir todos los módulos

Construir una prueba vertical con cliente + orden + cambio de estado. Persistir cambios localmente, cerrar/reabrir sin Internet y sincronizar con el servidor al reconectar. Probar dos pestañas del mismo puesto, respuesta perdida, sesión vencida, conflicto con una actualización del servidor, poco espacio y actualización de aplicación. Esta es una etapa obligatoria previa a extender el mecanismo a dinero.

Usar IndexedDB con transacción atómica entre cambio local y outbox, y un único coordinador de envío por dispositivo para evitar carreras entre pestañas; idempotencia en servidor sigue siendo obligatoria. Si la prueba no conserva operaciones tras cierre/reinicio, actualización y recuperación, detener la extensión a módulos financieros y corregir la persistencia. No cambiar a un servidor LAN por conveniencia sin una nueva decisión de arquitectura.

Salida: ADR de topología, protocolo de sincronización versionado, política de sesión offline y prueba automatizada de persistencia/reintento/conflicto. Sólo después continuar etapas operativas.

### 4. Diseñar el modelo y la correspondencia con Access

Definir clientes, órdenes, técnicos, asignaciones, historial de estados, mesas, tiempo trabajado, documentos y auditoría. Incluir cuentas, cargos, cobros, aplicaciones, cheques de terceros, remitos, comprobantes fiscales, tareas fiscales y operaciones de sincronización. Especificar contrato por campo: origen, destino, unidad, nulos, transformación y validación.

Estados: `queued` = TURNO, `completed` = TERMINADO y `delivered` = ENTREGADO. Flujo ordinario TURNO → TERMINADO → ENTREGADO; no exigir un estado intermedio EN PROCESO. Motivos como falta de repuesto o de acuerdo serán notas/atributos, no estados nuevos. Una corrección de estado exige permisos, motivo y trazabilidad; el contrato por etapa definirá excepciones como devolución sin reparación. Cancelación/archivo son marcas administrativas separadas. `workbenches` representa mesas activas/inactivas y cada orden tiene mesa actual nullable con historial de movimientos.

Separar identidad del snapshot (hash/tabla/fila) de identidad persistente (fuente lógica/tabla/clave de negocio validada). Las tablas sin clave confiable requieren resolución explícita. Registrar la correspondencia de órdenes promovidas a operación para que consulta e indicadores no las dupliquen.

Salida: migraciones y diccionario de mapeo revisados, incluyendo estados desconocidos y cuarentena.

### 5. Construir y ensayar la importación

Cargar origen inmutable, transformar y conciliar. Importar clientes para reutilización, conservar trabajos cerrados consultables y habilitar los abiertos validados. No obligar a revisar manualmente todo el histórico: aplicar reglas aprobadas y revisar las excepciones.

Ensayar: repetir la misma carga; cargar una segunda copia con cambios en registros antiguos; abortar a mitad y reintentar; detectar colisiones. La importación no crea cobros nuevos por la sola existencia de un recibo viejo.

Salida: informe por entidad de filas fuente, aceptadas, rechazadas/cuarentena y destinos. En staging final vacío la carga completa debe ser reproducible. La copia ensayada no se convierte silenciosamente en producción.

### 6. Implementar clientes y consulta unificada

Alta y edición, búsqueda por código/nombre/contacto, ficha con trabajos y documentos. Búsqueda de trabajo por número anterior/nuevo, cliente, marca/modelo, estado y ubicación. Datos paginados y permisos en servidor/base.

Salida: encontrar un cliente importado, ver su historial y crearle una orden nueva sin duplicarlo; encontrar una orden promovida una sola vez.

### 7. Implementar el ciclo de taller

Recepción y ficha impresa; estados acordados; asignaciones; diagnóstico/tarea realizada; tiempo; presupuesto y aprobación según regla confirmada; terminación; entrega. Conservar referencias anteriores y registrar todas las correcciones. Confirmar numeración nueva antes de imprimir comprobantes definitivos.

Salida: continuar y entregar una orden importada, además de completar un trabajo nuevo. Pruebas de concurrencia, reintentos y fallas transaccionales. Impresión real como aceptación operativa separada de CI.

### 8. Implementar la continuidad financiera requerida

Cuenta corriente es obligatoria. Propuesta de arranque: partidas de apertura conciliadas por cliente y obligación, con el detalle viejo consultable. Si la investigación demuestra reconstrucción completa y verificable, el responsable puede aprobarla como alternativa antes de congelar el importador. Nunca activar ambos métodos para las mismas obligaciones.

Las partidas pendientes conservan cliente, referencia anterior, importe original, pendiente y procedencia. El detalle histórico que ya integra la apertura se muestra como consulta y no vuelve a sumar al saldo. Si sólo puede certificarse un saldo agregado, explicitar que no permite conocer la aplicación por documento previo.

Cobros de cliente y aplicaciones a cargos, recibos internos, reversión y ajustes autorizados. Para ventas nuevas, **confirmar factura autorizada genera el cargo una sola vez**. Terminación, entrega, remito y borrador fiscal no generan deuda comercial. Las facturas históricas verificadas ingresan mediante apertura, sin reemitirse. Cheques de terceros pendientes se concilian individualmente por instrumento y situación. La integración directa con ARCA es obligatoria y se implementa en la etapa 9B; guardar una referencia de factura externa no cumple ese requisito.

Dividir esta etapa en tres entregas revisables: 8A cuenta y apertura; 8B cobros, anticipos, aplicaciones agrupadas y recibos; 8C cheques de terceros. Al recibir un cheque se acredita la cuenta comercial y se registra cartera pendiente; depositarlo o acreditarlo cambia el instrumento y no vuelve a reducir la deuda. Un rechazo confirmado revierte una sola vez el crédito comercial de ese instrumento, con trazabilidad; esa excepción restaura deuda previa y no es una venta nueva. No integrar bancos ni eCheq automáticamente sin un requisito específico.

Salida: cobrar deuda anterior y nueva con saldo esperado, sin duplicación. Pruebas de parcial, anulación, trabajo entregado sin facturar (sin deuda nueva), factura impaga, apertura/ajuste justificado, anticipos, pago agrupado y cheque recibido/acreditado/rechazado. Los movimientos manuales históricos se conservan y concilian; no habilitar un botón de venta manual que evite facturar. Los cobros offline muestran su efecto local pendiente de confirmación central; un conflicto nunca elimina evidencia del dinero recibido.

### 9. Implementar listados y documentos acordados

Clientes, trabajos por los tres estados y por mesa, pendientes de entrega, deudores y comprobantes. Ventas mensuales con definición aprobada de qué se suma y por qué fecha; ventas no equivale a cobros. Ficha con campos observados, reimpresión sin crear movimientos y documentos financieros según alcance.

Salida: cada listado concilia con sus registros y respeta los mismos filtros en pantalla e impresión.

### 9A. Remitos y relación con entregas

Implementar cabecera, destinatario, detalle de equipos/trabajos, cantidades, fecha, receptor, numeración y referencias. Registrar vínculo entre remito, orden y entrega; reimprimir no vuelve a entregar ni cobrar. Mantener una copia del contenido emitido para que una edición posterior del cliente no cambie el documento anterior. Validar remitos parciales/agrupados antes de permitirlos.

Sin conexión se guarda la operación y un comprobante local identificado como pendiente. El esquema de numeración definitiva y emisión offline de remitos se cierra con los requisitos aplicables; no reutilizar números fiscales ni inventar autorizaciones.

Salida: remito vinculado a una entrega y a una orden importada, reimpresión estable, anulación trazable y reintento sin duplicación.

### 9B. Integración ARCA en homologación

El emisor es responsable inscripto. Relevar CUIT, comprobantes habilitados, conceptos, impuestos, punto de venta y credenciales autorizadas. No deducir habilitación de factura A/B u otros tipos únicamente por su condición tributaria. Evaluar WSFEv1 contra ese caso y usar WSAA para autenticación cuando corresponda. Certificados y claves privadas sólo del lado servidor y separados entre homologación y producción. No transportar claves fiscales al cliente offline.

No equiparar impresora fiscal, controlador fiscal y una impresora que imprime PDFs. Comprobar modelo y modalidad actual. El objetivo nuevo es emisión electrónica por webservice y representación imprimible; no integra un controlador fiscal como segundo emisor de la misma venta. Verificar punto de venta específico del canal electrónico y distinto del controlador fiscal/otros sistemas según ARCA. Si se requiere manejar el hardware fiscal, abrir un contrato específico antes de prometer compatibilidad. En el corte, cada venta tiene una única vía de emisión; no facturarla otra vez desde el portal.

Implementar adaptador, solicitud persistida, validación, autorización, consulta y representación imprimible. Mantener contenido fiscal inmutable una vez autorizado; corregir por documentos asociados admitidos, no editando una factura emitida. Guardar respuesta, autorización y referencias sin registrar secretos. No volver a enviar documentos históricos importados para autorizarlos nuevamente.

El diseño propuesto usa CAE: offline se guarda intención/borrador, nunca una factura presentada como autorizada. Al reconectar, validar nuevamente permisos, datos y fechas admisibles. No implementar CAEA como supuesto atajo para offline; requeriría análisis específico de habilitación y obligaciones.

Identidad fiscal única por emisor/punto de venta/tipo/número. Serializar emisión por esa serie con trabajo durable y exclusión entre procesadores. Persistir el número y la solicitud antes de enviarla. Si hay timeout, marcar resultado desconocido y consultar el comprobante exacto antes de reintentar; consultar el último autorizado es apoyo, no prueba suficiente del contenido del comprobante dudoso. No continuar la serie con un intento ambiguo sin resolver. No compartir el punto de venta con otro emisor no coordinado.

Salida: pruebas de contrato con respuestas simuladas y pruebas separadas de homologación: aprobación, rechazo, sesión vencida, respuesta perdida después de autorización, dos solicitudes concurrentes y reimpresión. Los tests determinísticos de CI no dependen de la disponibilidad de ARCA. Homologación es evidencia adicional obligatoria previa a producción.

### 9C. Validación fiscal y habilitación productiva

Validar tipos y contenido de comprobantes, impuestos, redondeo, QR/datos exigibles y correcciones con documentación vigente y asesor contable. Revalidar versiones y catálogos del servicio; no tomar como permanente una regla extraída de un manual antiguo. Habilitar el punto de venta y credenciales de producción mediante procedimiento documentado, y comprobar monitoreo y recuperación de operaciones pendientes.

Toda emisión productiva debe corresponder a una operación real autorizada: no emitir facturas ficticias como smoke test. El primer comprobante real se supervisa en el corte. La etapa queda incompleta si sólo funciona un simulador o si sólo se generó un PDF.

### 10. Ensayar la migración completa y el uso

Con la copia de ensayo, verificar clientes, trabajos abiertos, documentos y pendientes financieros contra el sistema anterior. Incluir cheques en cartera, partidas de apertura y remitos pendientes. Medir importación para planificar la ventana, sin convertir tiempos de una PC en tests de CI. Ensayar restauración en ambiente vacío, operaciones offline y recuperación fiscal; entrenar al personal.

Salida: reporte de diferencias resueltas, evidencia de restauración y aprobación de los recorridos reales. El piloto usa datos aislados y no obliga a mantener dos sistemas productivos escribiendo.

### 11. Corte definitivo

Fijar hora y responsable; detener escrituras anteriores; drenar o aislar cualquier cola del piloto; obtener y verificar copia final; ejecutar el importador ensayado en destino controlado; conciliar; fijar secuencias; habilitar usuarios y probar recorridos antes de aceptar operaciones. Todos los módulos obligatorios, incluido ARCA, deben estar listos. No importar datos finales sobre equipos con cachés/colas de otra generación: registrar generación de migración y reprovisionar los clientes de forma controlada sin descartar pendientes reales.

Antes de nuevas escrituras, una falla devuelve al sistema anterior sin perder operación. Después, cualquier retorno exige preservar y conciliar todas las operaciones nuevas; queda prohibido restaurar ciegamente la base anterior. Mantener el sistema viejo sólo en consulta.

### 12. Estabilización

Revisar errores, diferencias reportadas, permisos y restauración de datos posteriores al corte. Resolver defectos de continuidad antes de agregar funciones. Cerrar el reemplazo cuando el responsable pueda operar todos los flujos comprometidos sin escribir en el programa viejo.

## Modos de falla

Además de los riesgos históricos: cola local perdida al actualizar; sesión vencida mientras hay operaciones sin enviar; dos puestos cobrando la misma deuda; factura autorizada cuya respuesta no llegó; número fiscal reutilizado; fecha de un borrador fuera de las reglas admitidas al reconectar. La prueba offline y la integración fiscal deben cubrirlos antes del piloto.

Fuente vieja presentada como actual; estados inferidos por presencia de fila; duplicación de entidades al cambiar el hash; monto en centavos convertido dos veces; deuda contada por trabajo y factura; saldo de apertura sumado otra vez al histórico; pago repetido al reimprimir recibo; orden duplicada al promoverla; pérdida de nuevos movimientos al volver atrás. Cada riesgo debe tener un caso de prueba en su etapa. Las incidencias históricas provienen de las investigaciones y el review; no hay historial Git disponible.

## Gate de aceptación del reemplazo

- Verificación por entidad y excepción; ninguna fila descartada silenciosamente.
- Un mismo cliente y trabajo conservan identidad a través de ensayo, carga final y continuación.
- Alta de trabajo nuevo para cliente importado y entrega de trabajo anterior comprobadas.
- Pendientes por cliente, obligaciones y cheques conciliados, y cobro posterior aplicado una sola vez.
- Reejecución sin duplicados; concurrencia sin sobrescritura silenciosa; fallo parcial sin cambios incompletos.
- Denegación por rol/usuario inactivo comprobada directamente en consultas y comandos.
- Migraciones, reglas, integración y recorridos de extremo a extremo pasan en CI. Registrar paso, fixture, resultado esperado/obtenido, conteos y códigos de error sin datos personales en logs.
- Backup restaurado, corte ensayado y un único sistema escritor.
- Operación offline guardada, recuperada tras reinicio y sincronizada sin duplicados; conflictos conservan ambas versiones y la evidencia del cobro.
- Remitos vinculados y facturación ARCA verificada en homologación, con gestión de resultado desconocido y preparación productiva aprobada.

## Verificación adicional

Aprobación humana de casos, prueba de impresora y papel, revisión del puesto y conectividad y acompañamiento del primer cierre operativo. Esta versión cierra alcance, topología y reglas comerciales. Los datos de habilitación fiscal, impresora y fuente actual son entregables previos al lanzamiento, no motivos para mantener indefinidamente abierto el plan general.

## Contrato preliminar de sincronización

Este contrato es una decisión técnica del plan para una PWA en un único puesto con persistencia local y servidor central. La etapa 3A verifica su implementación. Una futura segunda PC exige revisar alcance y concurrencia, no habilitarla informalmente.

1. **Persistir antes de confirmar.** Guardar cambio local y comando pendiente en una sola transacción. La interfaz distingue guardado en equipo, pendiente, sincronizado, conflicto y rechazado. Un fallo de disco/cuota no se presenta como guardado exitoso. UUID estable para entidades y operaciones; números locales claramente distintos de numeración definitiva.
2. **Comandos, no sobrescritura de tablas.** Cada comando lleva operation_id, device_id, actor, entidad UUID, versión base, payload versionado, dependencias y fecha local. El servidor obtiene la identidad autenticada de Auth.js y comprueba que coincide con el actor original; nunca acepta el actor del payload como prueba de identidad. Registra también recepción y secuencia propia; el reloj del cliente no decide prioridad ni orden fiscal.
3. **Efecto único con entrega repetida.** El servidor valida identidad y permisos vigentes, aplica restricciones y guarda resultado/idempotencia en la misma transacción. Reenvío de la misma clave y contenido devuelve el mismo resultado; misma clave con otro contenido se rechaza. Si se pierde el acuse, el cliente reenvía sin recrear IDs.
4. **Dependencias.** Sincronizar primero cliente nuevo, luego trabajo y después eventos/remitos/cobros dependientes. Una dependencia rechazada bloquea sus dependientes sin borrarlos. Reintentos temporales con espera creciente; errores de negocio requieren intervención, no bucle infinito.
5. **Conflictos.** Usar versión base. No aplicar «gana el último» a estado, mesa, importes, deuda o aplicaciones. Guardar ambas propuestas para resolución por rol autorizado; resolución crea un evento nuevo. Una nota append-only puede agregarse sin sobrescribir otra, siempre validando permisos.
6. **Descarga incremental.** Cursor de cambios emitido por servidor y paginación estable. Actualizar datos locales y cursor en una misma transacción, incluir bajas lógicas. No usar timestamps del dispositivo como cursor. La réplica local incluye sólo información autorizada; histórico no descargado queda explícitamente no disponible offline.
7. **Cobros durante cortes.** Registrar dinero/instrumento recibido como hecho local pendiente de confirmación. Aunque haya un solo puesto, dos pestañas y procesos fiscales del servidor pueden modificar una misma cuenta; no confiar sólo en la pantalla. Al reconectar, una aplicación que excede el pendiente va a conciliación; no perder el cobro ni asignarlo dos veces. El sobrante permanece crédito no aplicado del cliente. Aplicar a otro cliente requiere operación administrativa explícita; no moverlo automáticamente.
8. **Autorización offline.** Aprovisionamiento inicial online en dispositivo autorizado; no habilitar primer ingreso ni administración de roles sin conexión. Definir vigencia máxima de sesión local y acciones permitidas en 3A. Revocación remota no puede aplicarse instantáneamente al equipo desconectado; al reconectar se revalida y cualquier comando no admitido se conserva para revisión. No descartar colas al expirar sesión.
9. **Privacidad y recuperación.** Separar almacenamiento por usuario/dispositivo; no compartir caché de respuestas privadas entre sesiones. Bloquear acceso local al cerrar sesión, conservar pendientes protegidos con procedimiento de recuperación y no transferirlos al usuario siguiente. Definir gestión de claves si se cifra almacenamiento. Certificados ARCA nunca locales. No usar modo incógnito para operación persistente.
10. **Ciclo de vida.** Reintentar al abrir aplicación, recuperar conexión y por botón manual; sincronización en segundo plano sólo como mejora. No prometer envío con app cerrada. Las actualizaciones deben migrar la base local sin borrar outbox y soportar versiones de comandos en tránsito. Controlar capacidad y solicitar persistencia cuando corresponda; no equiparar caché con backup. Probar recuperación de operaciones no enviadas ante falla del equipo y definir respaldo local según topología.

El service worker conserva recursos necesarios para iniciar la aplicación y el almacenamiento local conserva datos/comandos. Aprovisionar padrón de clientes, mesas, trabajos abiertos, pendientes de facturación, cuentas/partidas pendientes, anticipos y cheques en cartera autorizados para el operador. El histórico cerrado se consulta online y puede descargarse por selección explícita; mostrar qué información no está disponible offline. No habilitar sesión inicial sin conexión ni prometer todo el histórico en caché.

## Contrato técnico del stack 1.1

### Interfaz y límites frontend/backend

Tailwind CSS para diseño responsive y shadcn/ui para formularios, tablas, diálogos y navegación, incorporando sólo los componentes usados. Prioridad PC de taller y navegación por teclado, sin impedir consulta desde pantallas menores. Los indicadores de operación local, sincronización, conflictos y factura pendiente deben ser visibles; no usar confirmaciones optimistas que aparenten autorización fiscal.

Server Components para lecturas online y envolturas de páginas; Client Components para la interfaz operativa que debe arrancar offline. Server Actions son adaptadores online pequeños: autenticar, validar con Zod y llamar al servicio del dominio. Zod valida también las entradas de sincronización y la interfaz, pero el servidor es autoridad; no sustituye FK, UNIQUE, CHECK ni transacciones.

Protocolo offline estable en `POST /api/sync/v1/push` y `GET /api/sync/v1/pull`, con esquemas explícitos de comando, respuesta y errores. La cola guarda comandos JSON de negocio, nunca identificadores de Server Actions, cookies o solicitudes internas de Next.js serializadas. Ambos puntos de entrada invocan los mismos servicios que las Server Actions; no duplicar reglas. Cada comando se confirma individualmente de forma atómica y retorna su resultado; no prometer atomicidad de todo un lote.

Route Handlers con sesión por cookie requieren control de origen/CSRF y validación de método, tamaño y contenido; no heredan automáticamente las protecciones de Server Actions. No cachear respuestas privadas en CDN ni caché compartida; service worker cachea shell/recursos estáticos, y datos autorizados van a IndexedDB segregada por usuario.

### Auth.js, usuarios y roles

Decisión propuesta para el MVP: Auth.js con proveedor Credentials, usuario/contraseña y estrategia JWT explícita; cuentas internas creadas por administrador, sin registro público. Drizzle administra una tabla propia `app_users` con UUID, identificador único normalizado, hash de contraseña, rol, activo y `session_version`. No asumir que Credentials persiste usuarios ni que necesita tablas de sesión de un adapter. OAuth, magic links y un adapter de persistencia de sesiones se excluyen de esta primera configuración.

Hash con Argon2id en runtime Node.js y parámetros registrados en el contrato de base. Rate limiting persistente en intentos de acceso, errores genéricos, bootstrap de administrador mediante comando controlado y recuperación administrativa documentada, sin contraseñas por defecto ni secretos en Git. No guardar contraseña ni su hash en el navegador.

JWT en cookie segura/HttpOnly en producción. Cada lectura o comando protegido obtiene sesión y consulta usuario activo, rol actual y `session_version` en la base; el rol cacheado en el token no es autoridad. Cambio de contraseña/revocación aumenta versión y rechaza tokens anteriores. Middleware/layout ayudan a navegación, pero no son la única barrera. No instalar Neon Auth ni Supabase Auth junto a Auth.js.

Roles iniciales: `admin` administra usuarios/configuración y correcciones; `reception` opera clientes, trabajos y finanzas; `technician` accede a tareas asignadas y campos técnicos sin cuenta/facturación; `readonly` consulta operación sin finanzas. Desglosar permisos por comando/campo en el contrato de cada módulo; un usuario no puede elevar su rol editando un perfil o enviándolo en un payload.

La sesión offline es una habilitación local distinta de una sesión Auth.js vigente en servidor. Propuesta inicial: aprovisionar el puesto tras login online, permitir hasta siete días de trabajo local desde la última validación, con identidad/rol y vencimiento firmados por servidor. El límite se verifica en la prueba 3A y se documenta; después se conserva todo y se exige reconexión para nuevos cambios. No es una defensa frente al dueño del equipo que manipule reloj/almacenamiento. No crear usuarios ni modificar permisos offline. Revocación se impone al reconectar, conservando pendientes rechazados para recuperación administrativa. Reautenticar no reasigna comandos al usuario siguiente.

### Drizzle, Neon y atomicidad

Usar runtime Node.js para módulos con acceso a DB, autenticación y ARCA. Driver elegido: `drizzle-orm/node-postgres` con `pg` y conexión TLS al endpoint pooled de Neon para la aplicación. Pool acotado por instancia y timeout configurable; no crear un pool por consulta. No usar `neon-http` para comandos que necesitan leer/bloquear/validar/escribir dentro de una transacción interactiva.

`db.transaction` agrupa operación comercial, historial, auditoría, change feed y resultado idempotente. Bloqueos de fila o actualizaciones condicionadas por versión protegen aplicaciones de cobros, cheques y cambios de estado. Ante error, rollback completo; ante reintento, mismo operation_id y hash canónico de payload. Usar `numeric(14,2)` como decimal exacto/cadena y no convertir dinero a `number` para calcular.

Conexión runtime con rol mínimo sin DDL; conexión de migración separada con permisos de esquema. Secretos sólo servidor. Nada de conexiones Neon directas desde el navegador. Autorización de usuario en servicios del backend; constraints y permisos SQL protegen integridad. No se requiere RLS por usuario para este MVP de una organización, y no se debe afirmar que el token Auth.js configura automáticamente identidad PostgreSQL. Cualquier futura RLS exige diseño explícito, contexto transaccional y pruebas propias.

Esquema Drizzle en `src/server/db/schema/`; SQL de migraciones generado/revisado y versionado en `drizzle/`, configuración en `drizzle.config.ts`. Usar Drizzle Kit generate/migrate con versiones fijadas; prohibir `push` contra producción. Revisar SQL generado y añadir SQL explícito para constraints/triggers necesarios. Ejecutar migraciones una sola vez por despliegue, no desde cada request ni instancia. Para migración/importación/backup usar conexión directa y rol adecuado separados del runtime pooled.

Schemas `legacy` e `history` conservan la recuperación; no son endpoints públicos. Desarrollo y pruebas con datos sintéticos en bases separadas. No crear ramas Neon de datos personales productivos como previews automáticamente. Definir retención/recuperación según plan contratado y ensayar restauración; branching no sustituye por sí solo un respaldo exportado. La copia local pendiente no queda incluida en el backup central y necesita el procedimiento de recuperación de 3A.

### Cursor de sincronización y tareas ARCA

No usar simplemente el mayor ID de una secuencia PostgreSQL como cursor visible: dos transacciones pueden confirmar fuera de orden y hacer que un cliente omita un cambio. Para este volumen, serializar la publicación de cambios mediante una fila contadora bloqueada dentro de la misma transacción, manteniendo el bloqueo hasta commit. Todas las escrituras sincronizables, incluidas las fiscales, pasan por esa publicación; paginar por secuencia ya confirmada y soportar tombstones. Probar explícitamente dos commits reordenados y reanudación desde cursor.

El procesador ARCA es un módulo del mismo backend. Tabla durable `fiscal_jobs` en Neon y endpoint interno invocado por scheduler autenticado del hosting; no confiar en timers de una función serverless ni en que la pestaña siga abierta. Reclamar jobs con lease persistido y exclusión por serie; transacción breve para reclamar, llamada ARCA fuera de transacción, otra transacción para resultado/contabilización. No sostener una conexión bloqueada durante la llamada externa.

Un lease vencido durante envío se trata como resultado desconocido: el siguiente procesador consulta el comprobante asignado antes de reenviar o avanzar la serie. Fencing/versiones impiden que un procesador viejo confirme sobre otro; identidad fiscal única protege duplicados internos. No usar locks de sesión como garantía entre requests sobre un pool de transacciones. Probar timeout, reinicio y ejecuciones superpuestas. El scheduler y sus límites se verifican antes de producción; Neon aloja la base, no se presupone que ejecute el worker.

### Estructura objetivo y comprobaciones para el revisor

```text
src/app/                         App Router, páginas y Server Actions delgadas
src/app/api/auth/[...nextauth]/   Route Handler Auth.js
src/app/api/sync/v1/              push/pull versionados
src/app/api/internal/fiscal/      disparo protegido del procesador
src/auth.ts                      configuración Auth.js
src/server/auth/                 acceso, roles, revocación y limitación de intentos
src/server/db/schema/            tablas Drizzle
src/server/modules/              servicios transaccionales por dominio
src/server/fiscal/               adaptador ARCA y jobs
src/shared/contracts/            Zod, comandos y respuestas sin secretos
src/client/offline/              IndexedDB, outbox, sincronización y migraciones locales
src/components/ui/               componentes shadcn/ui
drizzle/                         migraciones SQL revisadas
scripts/migration/               importador y conciliación
tests/                           unitarias, integración PostgreSQL y E2E offline
```

El revisor debe comprobar: compatibilidad de versiones y estrategia Credentials/JWT; permisos de todos los puntos de entrada; falta de secretos en bundle; transacciones reales con driver `pg`; migraciones desde cero; idempotencia; cursor sin omisiones; sesión expirada con outbox; compatibilidad de cola entre despliegues; autorización ARCA con respuesta perdida; y restauración central/local. Registrar resultado en el review del stack, no sólo en el chat. Los paths son estructura futura, no código ya existente.

## Contrato comercial y casos de aceptación

Las siguientes reglas concretan las respuestas del responsable. La reversión por rechazo, asignación explícita y atomicidad son decisiones de diseño de este plan, revisables sin cambiar las reglas confirmadas.

### Deuda, facturación y anticipos

- Cada factura autorizada genera un débito único por el total final. La recepción de autorización y el asiento comercial se persisten en una transacción local del servidor; una consulta recuperada de ARCA usa la misma identidad fiscal y no genera otro cargo. No existe transacción distribuida con ARCA: un resultado externo desconocido se resuelve mediante consulta, nunca presumiendo rechazo.
- Mantener separados `work_orders`, líneas comerciales/fiscales, `invoices`, `ledger_entries`, `payments` y `payment_allocations`. Una factura puede referenciar varios trabajos del mismo cliente y un cobro puede aplicarse a varias facturas. Impedir que el mismo concepto/importe de un trabajo se facture dos veces accidentalmente mediante vínculos de líneas y saldo facturable; una refacturación tras corrección requiere proceso explícito.
- Trabajos entregados aún no facturados integran una bandeja **pendiente de facturar**, no el saldo deudor. El importe de reparación es una valoración operativa, no un cargo. Un presupuesto tampoco genera deuda.
- Un anticipo registra crédito comercial no aplicado con referencia opcional a trabajos. Al autorizar una factura se puede aplicar el anticipo disponible a ella. La aplicación relaciona crédito y deuda: no genera otro ingreso ni otro crédito.
- La pantalla de cobro permite seleccionar una o varias facturas del mismo cliente y montos parciales; el excedente queda como crédito disponible identificado. No habilitar aplicación automática a deudas no seleccionadas. Validar suma de aplicaciones contra cobro disponible y pendiente de cada factura en transacción.
- Mostrar por separado saldo neto de cuenta, pendientes de facturas, crédito no aplicado y cartera de cheques. Un saldo neto cero no significa que los cheques estén acreditados ni que todas las aplicaciones estén completas.
- Notas fiscales autorizadas ajustan la cuenta una sola vez y con relación al comprobante corregido. Anular un recibo interno no anula una factura. No editar o borrar el libro; reversiones y ajustes tienen causa, actor y referencia. Los ajustes de apertura resuelven migración, no sustituyen facturas para nuevas ventas.
- No mezclar términos: recibo interno de cobro, factura fiscal y remito tienen identidades y secuencias diferentes. El eventual tratamiento fiscal de anticipos y documentos asociados se valida en 9B/9C; la regla comercial no lo decide por sí sola.

### Cheques de terceros

- Al recibir: registrar instrumento, cliente/entregante, banco, número, moneda/importe, fechas, referencia del cobro y estado en cartera. Reducir deuda comercial mediante ese cobro; si excede deuda o no la hay, crear crédito disponible. No contar el cheque como efectivo disponible en caja.
- Al depositar: cambiar situación a depositado, manteniendo trazabilidad. Al acreditar: pasar a acreditado y reclasificar disponibilidad del medio; no emitir otro cobro comercial.
- Al rechazar: registrar motivo y evento único, revertir sólo el crédito del cheque rechazado y deshacer sus aplicaciones de forma consistente. El efectivo de un cobro mixto no se revierte. Conservar las relaciones originales auditables y restaurar pendientes por el importe efectivamente afectado; cualquier crédito no aplicado correspondiente también se cancela.
- Un cobro puede tener varios medios: modelar componentes separados para efectivo, transferencia y uno o varios cheques. La suma de componentes debe igualar el total. Devoluciones o reclasificaciones exigen comando específico, no edición libre del estado.
- Importar cartera vigente y efecto comercial con conciliación: si el saldo de apertura ya descuenta un cheque recibido, importar el instrumento sin volver a acreditar la cuenta. Su eventual rechazo posterior debe reponer la deuda mediante un movimiento identificado incluso si no se pudo reconstruir la aplicación histórica exacta.
- Gestión de endoso, eCheq e integración bancaria no se infiere de «cheques de terceros»: por defecto se registra cartera, depósito, acreditación, rechazo y devolución. Relevar cualquier cheque ya endosado en la apertura como excepción antes del corte.

### Casos obligatorios, importes en ARS

1. Trabajo de 100.000: pasa TURNO → TERMINADO → ENTREGADO; antes de facturarse, deuda nueva = 0 y pendiente de facturar = 100.000. Factura autorizada por 100.000 crea deuda de 100.000. Descargarla dos veces mantiene 100.000.
2. Anticipo de 30.000 sin factura: crédito disponible = 30.000, deuda facturada = 0. Posterior factura por 100.000 y aplicación del anticipo: pendiente = 70.000 y crédito no aplicado = 0, sin un segundo cobro.
3. Facturas pendientes de 60.000 y 40.000; cobro de 80.000 aplicado 60.000 + 20.000: pendientes 0 y 20.000. El recibo representa un cobro, no dos. Reimprimir no cambia saldos.
4. Factura de 100.000; cheque recibido por 100.000: saldo comercial neto = 0, cartera pendiente = 100.000, efectivo ingresado = 0. Acreditarlo deja saldo comercial = 0 y cartera pendiente = 0. Rechazo antes de acreditación restaura deuda de 100.000 una vez; repetir el evento no suma otros 100.000.
5. Misma factura; cobro mixto de 20.000 en efectivo y cheque por 80.000: deuda = 0. Rechazar el cheque restaura sólo 80.000; el efectivo conserva su efecto.
6. Deuda de 50.000; cobro de 70.000 aplicado por 50.000: factura pendiente = 0, crédito disponible = 20.000. El sistema no pierde ni rechaza silenciosamente el excedente.
7. Apertura con deuda comercial = 0 y cheque pendiente de 40.000 ya descontado por el sistema viejo: importar no crea crédito adicional. Rechazo posterior restaura 40.000 con referencia al instrumento y a la apertura.
8. Borrador offline por 100.000: no crea deuda fiscal/comercial por factura ni número autorizado. Tras reconexión, ARCA autoriza y se pierde la respuesta: consulta recupera el mismo comprobante y genera exactamente un cargo. Rechazo real deja el borrador corregible sin crear deuda; un anticipo recibido entretanto se conserva como crédito.
9. Cobro guardado offline, aplicación cerrada y reabierta: el cobro y sus componentes siguen presentes. Dos reintentos de sincronización producen un solo cobro/recibo central. La pantalla distingue su estado local del confirmado.

Para cerrar etapa 8 se permiten respuestas fiscales simuladas identificadas como fixtures en ambiente de prueba. Antes del corte deben pasar los mismos contratos con el adaptador de homologación de etapa 9B. Los valores anteriores son ejemplos sintéticos, no saldos reales ni cálculos tributarios.

## Entregables de planificación por etapa

El agente implementador debe crear primero un contrato acotado para la etapa que va a ejecutar, enlazar este documento y registrar pruebas/archivos esperados. No crear todos los módulos en un único cambio.

La revisión del stack 1.1 se debe registrar primero en `docs/reviews/sistema-galante-v2-stack-review.md`. Verificar los contratos técnicos siguientes y resolver hallazgos bloqueantes de la etapa antes de implementarla. No confundir el review histórico del spec de septiembre con la revisión de esta versión.

- `docs/adr/0001-pwa-offline-puesto-unico.md`: ratificar topología y resultados de prueba 3A, navegador/OS, sesión y respaldo local.
- `docs/specs/01-base-y-sincronizacion.md`: identidad, migraciones, comandos, persistencia, conflictos, política de sesión offline y recuperación. Incluir edición offline de clientes/órdenes y resultado fiscal recibido del servidor.
- `docs/specs/02-importacion-y-continuidad.md`: mapeos, copia final, apertura financiera, cartera y conciliación.
- `docs/specs/03-clientes-taller-mesas.md`: tres estados, impresión, correcciones y permisos.
- `docs/specs/04-cuenta-cobros-cheques.md`: casos 1–9 y contratos separados de 8A, 8B y 8C.
- `docs/specs/05-remitos-listados.md`: contenido, numeración, reimpresión y relación con entregas.
- `docs/specs/06-arca.md`: modalidad verificada, comprobantes, certificados, punto de venta, homologación, recuperación y paso a producción.
- `docs/runbooks/corte-y-recuperacion.md`: backups, restauración local/central, conciliación y vuelta atrás sin perder nuevas operaciones.

Estos archivos son entregables futuros definidos por el plan; no se afirma que existan hoy. Un gate bloquea sólo su etapa y las dependientes. La recuperación de la base actual y el relevamiento fiscal pueden avanzar mientras se ejecuta la prueba offline y se desarrollan los módulos con fixtures.

## Recuperación de la base actual en Windows 7

El candado informado no permite diagnosticar si hay permisos, cifrado, un archivo en uso u otra situación. No se inspeccionó esa PC en esta sesión y no se propone cambiar permisos o quitar protección sin conocer la causa.

Procedimiento de relevamiento: identificar ruta y nombre exactos de la base que abre el programa; registrar mensaje literal al intentar una copia, tamaño y modificación; comprobar si el menú Copia de seguridad genera una copia legible. Coordinar cierre del programa en todos los puestos antes de obtener una copia consistente. Si copiar falla, diagnosticar desde la cuenta autorizada y conservar el original; no borrar archivos de bloqueo ni reparar/compactar la única base como primer paso.

Validar la copia en otra ubicación, calcular hash, comprobar esquema y presencia de trabajos recientes. La existencia de un archivo copiado no demuestra que sea la base activa ni que esté completa. El desarrollo continúa con la copia recuperada; el corte espera esta recuperación o una reconstrucción explícitamente conciliada.

## Tamaño de entregas y orden de trabajo

Cada etapa produce un contrato de tarea y un cambio revisable con tests propios. La secuencia recomendada es 1 → 3/3A → 4 → 5 → 6 → 7 → 8A → 8B → 8C → 9/9A → 9B → 9C → 10 → 11 → 12. Recuperación de fuente actual (2) y preparación administrativa de ARCA pueden avanzar mientras se desarrolla; ambas deben terminar antes del ensayo final. El importador inicial usa la fuente de ensayo, y se adapta mediante comparación documentada al recibir la nueva.

No confundir una entrega de desarrollo con habilitar producción parcial. Se puede mostrar el taller operativo antes de terminar ARCA, pero no declararlo reemplazo completo. La base offline se prueba temprano para evitar rehacer todos los formularios al final. No se asignan fechas cerradas hasta medir esa prueba y completar los contratos por etapa. No hay otra ronda general de preguntas necesaria para usar este plan como base del trabajo.

## Fuentes oficiales verificadas el 21/10/2026

- [Next.js: autenticación y autorización](https://nextjs.org/docs/app/guides/authentication): comprobar permisos en los puntos de entrada, además de la interfaz.
- [Auth.js: Credentials](https://authjs.dev/getting-started/providers/credentials) y [roles](https://authjs.dev/guides/role-based-access-control): autenticación y modelo de sesión; el proveedor Credentials no reemplaza la gestión propia de credenciales y permisos.
- [Drizzle con Neon](https://orm.drizzle.team/docs/connect-neon): elegir driver con soporte de transacciones interactivas para las operaciones de negocio.
- [Neon: pooling](https://neon.com/docs/connect/connection-pooling): verificar conexión y límites al usar pool de transacciones.

- [ARCA: solicitud de autorización](https://www.arca.gob.ar/fe/emision-autorizacion/solicitud-autorizacion.asp): el punto de venta de emisión electrónica debe distinguirse del utilizado por controlador fiscal u otros sistemas. Verificar la configuración real antes del alta.
- [Microsoft: información de versiones Windows 10](https://learn.microsoft.com/es-es/windows/release-health/release-information): fin del soporte general el 14/10/2025; comprobar cobertura aplicable a la edición del puesto antes de producción.

- [Certificados de ARCA](https://www.arca.gob.ar/ws/documentacion/certificados.asp): ambientes de homologación y producción con mecanismos de gestión diferenciados.
- [Documentación de facturación electrónica](https://www.arca.gob.ar/ws/documentacion/ws-factura-electronica.asp) y [manual WSFEv1 v4.0 accesible](https://www.arca.gob.ar/fe/documentos/manual-desarrollador-ARCA-COMPG-v4-0.pdf): referencia para solicitud de CAE y consultas `FECompConsultar` / `FECompUltimoAutorizado`. El enlace v4.1 encontrado en búsqueda devolvió 404 al abrirlo; no se declara v4.0 como última versión vigente. Revalidar manual, esquemas y reglas en la etapa fiscal.
- [MDN: operación offline y en segundo plano](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation): capacidades y límites del service worker.
- [MDN: cuotas y eliminación de almacenamiento](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria): persistencia y cuota requieren tratamiento explícito; guardar localmente no elimina el riesgo de pérdida del dispositivo o borrado por el usuario.

La arquitectura de comandos, conciliación y procesador fiscal es una propuesta de ingeniería de este plan, no una garantía ofrecida por los proveedores ni una interpretación fiscal definitiva.
