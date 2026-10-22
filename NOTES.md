# Decisiones — 21/10/2026

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
