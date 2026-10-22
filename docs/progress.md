# Ejecución por partes

## Entrega 1 — 21/10/2026

- Git inicializado dentro de NuevoSoft, rama main.
- Plan rector preservado en el repositorio sin datos personales.
- Etapa 1 ejecutada como contrato funcional: módulos, destino de pantallas, roles, invariantes y casos de aceptación definidos. Aceptación operativa pendiente de implementación/prueba con responsable.
- Etapa 3 desglosada en tarea ejecutable. No se instaló todavía el stack ni se implementó autenticación.
- Verificador existente ejecutado en lectura: 33 tablas, 190.829 filas, siete tablas modeladas y 2.467 incidencias. Última orden recuperada 31233, 19/02/2025. Esto no certifica actualidad ni corrección comercial.

## Orden de continuación

1. Etapa 2 cuando se obtenga copia actual: manifiesto, hash y comparación completa.
2. Etapa 3 con datos sintéticos, sin esperar esa copia: stack fijado, migraciones, acceso y CI.
3. Etapa 3A obligatoria: vertical offline cliente/orden/estado con persistencia, reintentos y conflictos.
4. Modelo/importador y módulos operativos; después finanzas y ARCA en entregas separadas según plan.

La fuente vigente, datos de impresión y relevamiento fiscal siguen pendientes antes de los gates correspondientes. No hay autorización ni preparación para corte productivo en esta entrega.

## Entrega 2 — base ejecutable, 21/10/2026

Carpeta actual: `Taller2.0` (renombrada desde NuevoSoft). Conserva el mismo Git en main, sin commits ni remoto creados en esta entrega.

Implementado: Next.js/TypeScript/Tailwind, componentes UI incorporados, ingreso Auth.js Credentials/JWT, hashes Argon2id, usuarios y roles propios, activo/session_version revalidados en cada entrada protegida, limitación persistente de login, bootstrap y recuperación administrativa auditados. Portada protegida y consultas `/api/me` y `/api/admin/users` con permisos y no-store.

Migración Drizzle generada y revisada para usuarios, intentos y auditoría. Base local vacía migrada; runtime separado del propietario con grants limitados. PostgreSQL local aislado, sin importar datos del taller. No se conectó Neon ni se desplegó. Workflow CI agregado, todavía sin ejecución remota.

Verificación ejecutada:

- `npm ci --no-audit`: instalación limpia correcta desde lockfile; versiones raíz coinciden con package.json.
- `npm run lint` y `npm run typecheck`: correctos.
- `npm test`: 4/4 correctas.
- `npm run test:integration`: 8/8 correctas en PostgreSQL 17. Incluyen migración repetida, bootstrap único, rol sin DDL/DELETE, autorización, revocación, recuperación y límite concurrente.
- `npm run build`: correcto con Next.js 16.4.2. Advertencia informativa por lockfile externo en perfil de usuario, ignorado por estar fuera del repositorio.
- `npm run test:e2e`: 1/1 correcto en Chromium. Ingreso fallido/correcto, endpoints directos 401/403, rol técnico, revocación y cierre de sesión. Capturas ingreso/portada inspeccionadas en `test-results/` (no versionadas).
- Chequeo de 14 bundles JS del cliente: sin valores de AUTH_SECRET ni URLs privadas de DB.
- `npm audit --omit=dev`: cero vulnerabilidades conocidas; nueve alertas en tooling documentadas en `docs/research/dependencias-etapa-3.md`.

App dejada ejecutándose localmente en puerto 3000. Base de desarrollo sin cuenta por defecto: el responsable crea su usuario con `npm run admin -- bootstrap`, por terminal y con contraseña oculta. La cuenta sintética de pruebas vive sólo en base de pruebas.

Próximo entregable: `docs/tasks/003a-offline.md`. Offline, clientes, órdenes, importador, finanzas y ARCA no se consideran implementados. El equipo real, privilegios en Neon, hosting y producción conservan sus gates por etapa.
