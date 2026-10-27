# Decisiones — 21/10/2026

## Impresión e histórico — 27/10/2026

- Usuario autoriza usar la SQLite recuperada para cargar la nueva BD y confirma formato de ficha anterior. Se conserva la distribución de la foto; papel físico no identificado, tamaño automático en diálogo y ensayo físico pendiente.
- Importación de clientes/histórico primero; no importar saldos ni inferir deuda de esta copia. Los estados ambiguos permanecen originales; continuar requiere selección administrativa de estado/cliente. No convertir tiempos anteriores a minutos.
- Identidad por fuente/código anterior, nunca por nombre; SHA fija la copia. Reimportación diferente se rechaza y requiere contrato de actualización. Reintento idéntico no pisa ediciones nuevas.
- 42 clientes sin nombre reciben rótulo explícito de dato faltante. Se conserva JSON original completo. Órdenes huérfanas se consultan y requieren cliente real para continuar, sin fabricar clientes.
- Fichas: snapshot inmutable por revisión y tipo, sin nueva secuencia fiscal. Número anterior e interno se distinguen; reimpresión no entrega, cobra ni altera orden.
- Medidas confirmadas después: 15 cm ancho × 20 cm alto, número repetido arriba/al pie para cortar y pegar en el equipo. CSS fija ese papel, margen de 8 mm; calibración real pendiente. PDF sintético y render en test-results (no versionados).
- Impresión directa de históricos sin promoverlos; una reparación entregada no debe reabrirse sólo para reimprimir. Presupuesto/tiempo antiguos se muestran literalmente.
- Node SQLite entrega objetos sin prototipo; Drizzle los rechaza como valores JSON. Normalizar objetos al leer y en la frontera del importador. Intentos fallidos revertidos; regresión con objetos sin prototipo en integración.
- Modalidad ARCA, tipos y punto de venta no confirmados por el usuario. No activar emisión ni elegir impresora fiscal/servicios web por suposición.

## Clientes — 22/10/2026

- Pedido vigente: retirar guardado offline y avanzar por módulos online; etapa 3A deja de ser requisito. Los planes originales quedan como antecedentes.
- Primera entrega de clientes: nombre obligatorio; documento, teléfono, email, dirección y notas opcionales. Sin inferir datos fiscales ni fusionar personas por nombre/documento.
- Código interno autogenerado independiente del legado; UUID estable y versión para detectar edición concurrente. Sin borrado. Consulta según work:read; escritura restringida a customers:write.
- Formularios controlados conservan propuestas ante validación/conflicto. No se guarda información privada en almacenamiento del navegador.

- Alcance de esta entrega: completar etapa 1 y preparar etapa 3; etapa 2 depende de recuperar fuente actual. Resolución: desglose del plan, no bloqueo del desarrollo sintético.
- Repositorio: sólo NuevoSoft, rama main, sin fuentes privadas ni dependencias instaladas. Resolución: cumple pedido explícito del responsable.
- El plan dice «esta tarea entrega documentación» porque fue redactado antes del pedido de ejecución. Se conserva como antecedente versionado y el README registra la autorización posterior; no se interpreta como prohibición permanente de implementar.
- No se inventan numeración, papel ni unidad de tiempo; quedan como precondiciones de sus módulos, no del contrato inicial. Resolución: pendientes ya previstos en plan.
- Error de especificación encontrado por revisión independiente: el plan presupone regla de aprobación del presupuesto. Resolución incorporada al contrato: pendiente de etapa 7, sin bloqueo inventado.

## Base ejecutable — 21/10/2026

- La carpeta fue renombrada por el usuario a Taller2.0 entre entregas. Se continúa allí, conservando Git y documentos; NuevoSoft permanece en entradas anteriores como nombre histórico.
- Decisión prevista por el spec, ahora resuelta con evidencia: Auth.js v5 se distribuye como beta. Se fija beta.32 tras comprobar peers y documentación oficial. Compatibilidad comprobada en build y recorrido real; revisión antes de producción pendiente.
- Ajuste de especificación de tooling: ESLint 10 no tiene peers compatibles en todos los plugins de Next. Se vuelve a 9.39.5 y se documenta la necesidad de actualizarla. No se fuerzan peers ni upgrades destructivos de auditoría.
- PostgreSQL 17 local para desarrollo y base separada de pruebas; Neon externo pendiente. Decisión de ejecución: no hace falta crear cuenta cloud para verificar transacciones/autorización con el driver elegido.
- Sesión online de ocho horas; habilitación offline de siete días aún no implementada. Son contratos distintos. Decisión local documentada, no modifica el contrato 3A.
- Limitación por usuario normalizado: ocho intentos cada quince minutos en UPSERT persistente, contando también éxitos. Es una decisión del detalle no fijado por el spec; se prueba concurrencia. No confiar en IP enviada arbitrariamente por headers.
- Error de ejecución corregido: useActionState reiniciaba el usuario tras contraseña incorrecta. Campo controlado y regresión en E2E; contraseña continúa sin persistirse.
- Error de test corregido: el orden textual PHC de parámetros Argon2 no es semántico. Se comprueban los valores sin imponer orden.
- SQL de rol mínimo agregado; sin tablas de negocio aún. Las restricciones de asignación de tareas al técnico se implementarán con el módulo de órdenes, no se declaran resueltas con un rol global.

## Órdenes — 26/10/2026

- Rama desde main con clientes integrado. Estados y permisos según contrato; se añaden work:write y work:correct sin ampliar permisos técnicos.
- Número interno nuevo, independiente del legado; tiempo acumulado en minutos enteros sólo para nuevos registros. Impresión y unidades antiguas pendientes. Mesa es ubicación de texto, sin crear un cuarto estado.
- Cliente fijo después del ingreso. Correcciones de estado sólo admin con motivo, sin borrar historial; órdenes entregadas se consultan y requieren corrección administrativa antes de editar.
- Presupuesto decimal exacto ARS opcional y evidencia textual de aprobación. Roles técnicos/consulta no reciben importes ni aprobación, incluso en historial. Sin efectos comerciales.
- Cada versión conserva snapshot antes/después en la misma transacción. UUID de alta estable y hash canónico del contrato normalizado evitan duplicación por reintento; colisiones de payload se rechazan.
- Un reintento ya confirmado resuelve la identidad existente antes de volver a validar el técnico original: su desactivación posterior no convierte el ingreso confirmado en una operación nueva ni lo pierde. Prueba de regresión con técnico inactivo.

## Inicio y alcance administrativo — 26/10/2026

- Pedido del responsable: descartar administración de usuarios/técnicos y catálogo de mesas. Acceso sólo Ricardo/administración. No agregar cuentas técnicas.
- Cuatro tarjetas fijas: Clientes, Órdenes de trabajo, Cheques y Comprobantes; estas últimas agrupan cartera, remitos/listados y ARCA, con funciones pendientes.
- Esta entrega crea estructura visual y actualiza el plan. No modifica roles persistidos ni borra referencias a usuarios/asignaciones existentes; la restricción efectiva de perfiles anteriores queda especificada en tarea 006 para el siguiente agente.
- Las pantallas pendientes usan el permiso existente finance:read para no abrir nuevas superficies financieras a perfiles antiguos. No hay importes de ejemplo, cobros simulados ni botones de emisión activos.

## Acceso administrativo — fase 1 — 26/10/2026

- Rama feat/acceso-administrativo desde main limpio (el estado real difiere del antecedente de la tarea).
- Perfiles excluidos con identidad vigente reciben FORBIDDEN (403); identidad inválida/inactiva/versionada sigue UNAUTHORIZED (401), conservando convenciones de cada entrada.
- Asignaciones técnicas históricas y su validación permanecen como datos operativos. No se crean cuentas ni se cambian enum, hashes o filas existentes para restringir el acceso.
- El seguimiento técnico interno conserva su contrato para administración; las pruebas válidas pasan a admin y las identidades técnicas se prueban como denegadas.
