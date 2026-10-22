> Actualización de alcance — 22/10/2026: por pedido del responsable se deja sin efecto el guardado offline. La etapa 3A no es requisito para continuar. El desarrollo sigue con módulos online, comenzando por clientes (docs/tasks/004-clientes.md). Las referencias offline siguientes son antecedentes históricos, no requisitos vigentes.

# Contrato de reemplazo — etapa 1

Fecha: 21/10/2026. Base: plan rector v1.1 y reglas confirmadas por el responsable. Este contrato fija alcance; no acredita aceptación operativa ni implementación.

## Recepción y continuidad

Buscar cliente por código, nombre o contacto; seleccionar el importado sin duplicarlo. Dar de alta uno nuevo cuando corresponda. Buscar órdenes por número anterior o nuevo y abrir una única identidad, aunque exista histórico y operación sobre el mismo trabajo.

Cada orden conserva cliente, equipo/marca/modelo, descripción de ingreso, presupuesto, observaciones, mesa actual y referencias de origen. TURNO (`queued`) es el ingreso; TERMINADO (`completed`) registra resolución y permanencia en taller; ENTREGADO (`delivered`) registra retiro. La transición ordinaria es TURNO → TERMINADO → ENTREGADO. Mesa/estantería es ubicación, nunca un cuarto estado.

Asignaciones, diagnóstico, tarea realizada y tiempo trabajado se registran con historial. Correcciones de estado requieren administrador, motivo y evento auditable. La unidad del tiempo, numeración e impresión definitiva se cierran antes de implementar esos documentos; no se interpreta el texto antiguo automáticamente. Registrar presupuesto y evidencia de aprobación cuando exista; la obligatoriedad de aprobación se define en etapa 7. No bloquear terminación ni entrega por una regla todavía no acordada.

Casos de aceptación:

- C1: seleccionar cliente importado y crear una orden conserva su identidad y no crea otro cliente.
- C2: una orden anterior promovida aparece una sola vez en búsqueda; terminarla y entregarla conserva número y procedencia.
- C3: dos ediciones de la misma versión producen un éxito y un conflicto visible, sin sobrescritura silenciosa.
- C4: terminar/entregar o modificar presupuesto no crea deuda comercial.

## Cuenta, cobros y documentos

Una factura autorizada genera deuda exactamente una vez. Borradores, presupuestos, remitos y entregas no generan cargos. Aperturas conciliadas conservan obligaciones previas sin recontar su detalle histórico. No se suman indiscriminadamente trabajos, facturas, manuales, pagos y recibos del sistema anterior.

Un cobro pertenece al cliente; permite anticipos y aplicaciones parciales a varias obligaciones seleccionadas del mismo cliente. Excedentes quedan como crédito disponible. Mostrar saldo neto, deuda pendiente, crédito disponible y cheques en cartera por separado.

Recibir un cheque de terceros acredita comercialmente el importe y lo registra pendiente de cobro. Depositar/acreditar no genera otro crédito. Rechazar revierte una sola vez el crédito de ese instrumento y sus aplicaciones; un componente en efectivo de un cobro mixto permanece intacto.

Remitos vinculados a entrega y trabajos conservan snapshot de contenido. Reimprimir no genera otra entrega ni movimiento. La emisión fiscal requiere integración ARCA, homologación y recuperación de respuestas desconocidas; una referencia externa no reemplaza esa integración.

Casos de aceptación:

- F1: reintentar confirmación de una factura genera un solo cargo.
- F2: factura de 100, anticipo de 30 y aplicación de 30 dejan pendiente 70; aplicar el anticipo no registra otro cobro.
- F3: cobro de 150 aplicado explícitamente a obligaciones de 70 y 60 deja crédito disponible 20.
- F4: cheque de 100 recibido y luego acreditado reduce la deuda sólo 100; rechazarlo restaura exactamente su efecto una vez.
- F5: apertura y detalle histórico de una misma obligación no duplican saldo.
- F6: reimpresión de ficha, recibo o remito conserva contenido/identidad y no mueve cuenta ni estado.

## Acceso y operación sin conexión

`admin` administra acceso/configuración y correcciones; `reception` opera clientes, taller y finanzas; `technician` sólo tareas asignadas y campos técnicos; `readonly` consulta operación sin finanzas. Los permisos concretos por campo/comando se implementan por módulo, con denegación por defecto. Toda entrada de servidor valida usuario activo, rol vigente y versión de sesión.

El primer acceso es online. El puesto aprovisionado guarda operaciones en IndexedDB junto con su outbox de forma atómica. Distinguir guardado local, pendiente, sincronizado, conflicto y rechazado. Conservar pendientes al vencer sesión; nunca transferirlos a otro usuario. La habilitación local propuesta de siete días se verifica en 3A.

Casos de aceptación:

- A1: técnico y consulta no acceden a comandos ni datos financieros por endpoints directos.
- A2: cerrar/reabrir sin red conserva orden y comando; reenvío con respuesta perdida no duplica el efecto central.
- A3: cuota agotada no muestra guardado exitoso; sesión vencida conserva cola y solicita revalidación.
- A4: dos pestañas no duplican envíos efectivos y una actualización de aplicación conserva outbox.

## Destino de las pantallas anteriores

Menú y búsqueda pasan a navegación/bandejas del nuevo sistema. Clientes y búsqueda de clientes se integran en clientes. Ingreso, búsqueda, terminación y entrega se integran en órdenes con acciones por estado. La ficha impresa se reemplaza por documento imprimible con contenido validado.

Cuenta corriente se reemplaza por cuenta/aperturas/cobros. Comprobantes se integra en documentos con identidades separadas. Cheques de terceros se reemplaza por cartera; cheques propios y dólares quedan sólo como histórico. Listados se integran en consultas por cliente, estado, mesa, pendientes de entrega/facturación, deudores, comprobantes y ventas, con definición de sumas y fechas por contrato.

Ninguna pantalla observada se declara «no utilizada» sin confirmación. Copia de seguridad se reemplaza por respaldo central restaurable y recuperación local a validar; no basta ocultar el botón anterior. Inventario, compras, portal y multi-PC quedan fuera de la primera versión.

## Condiciones del reemplazo definitivo

Obtener fuente actual o reconstrucción validada, conciliar obligaciones y cheques, probar hardware/papel, modalidad y punto de venta fiscal, restaurar respaldos central/local y aprobar flujos con responsable. El software anterior pasa a consulta con un único sistema escritor. Estos pendientes no bloquean desarrollo sintético.
