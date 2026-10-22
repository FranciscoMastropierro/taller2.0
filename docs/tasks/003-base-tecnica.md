# Etapa 3 — base técnica reproducible

## Objetivo

Crear el esqueleto ejecutable Next.js y una base vacía migrable con autenticación y autorización verificables. Entrega separada de los módulos comerciales y de la prueba offline 3A.

## Paso 0

Confirmar que NuevoSoft conserva su repositorio propio, leer plan rector y contrato de reemplazo. Comprobar Node/npm disponibles y verificar compatibilidad en documentación oficial antes de fijar versiones exactas y lockfile. No hay código ni package.json en esta entrega. La fuente vieja verificada es para análisis; no representa la operación actual.

## Contexto

- `docs/plans/sistema-galante-v2.md`: arquitectura y seguridad.
- `docs/contracts/reemplazo.md`: roles y casos.
- `docs/reviews/sistema-galante-v2-stack-review.md`: revisión y límites.

## Congelado y fuera de alcance

Mantener stack, tres estados, una PC y separación operación/finanzas. No importar información personal, emitir ARCA, implementar dinero ni afirmar soporte offline completo. No desplegar ni crear servicios externos como efecto lateral del scaffold.

Findings during this task go to `docs/research/` (or wherever this repo keeps investigation writeups — create it if there is none); scope creep goes to a new task file, not into this diff.

Log every judgment call — anything this task didn't decide and you had to — to `NOTES.md` beside the diff, visibly, as you go (not reconstructed after).

## Pasos

1. Fijar runtime y versiones comprobadas; crear App Router, TypeScript, Tailwind y componentes shadcn utilizados, lockfile, lint/typecheck/build y CI.
2. Configurar variables validadas del servidor y `.env.example` sin credenciales. Diferenciar URL runtime pooled y migración directa; documentar PostgreSQL de pruebas aislado.
3. Crear esquema `app_users`, migración revisada, conexión singleton acotada `pg`, Auth.js Credentials/JWT y Argon2id. Bootstrap por comando sin contraseña predeterminada ni contraseña en argumentos/logs.
4. Implementar verificación central de activo/rol/session_version, revocación y rate limiting persistente; negar acceso por defecto. Comprobar entradas directas, no sólo layout.
5. Documentar ejecución local, migración y recuperación administrativa. Preparar tarea 3A con protocolo exacto antes de extender módulos.

## Modos de falla

El repositorio nace sin historial de aplicación; antecedentes en plan y análisis SQLite externo. No traducir RLS/Supabase del plan obsoleto. No usar Credentials como persistencia automática, confiar en rol de JWT, usar Neon HTTP para transacciones interactivas ni instalar versiones beta/latest sin verificación registrada. Si Auth.js compatible exige prerelease, registrar evidencia y decisión explícita antes de fijarla.

## Gate

Instalación limpia desde lockfile, lint, typecheck y build correctos. Migración de base vacía y pruebas PostgreSQL de acceso permitido/denegado, usuario inactivo, rol modificado, token revocado y limitación de intentos. Registrar fixture, paso, esperado/obtenido y error categorizado sin datos privados. Ninguna migración automática por request ni secreto en bundle.

## Verificación adicional

Verificar hosting/scheduler antes de despliegue; navegador y recuperación offline en equipo real durante 3A. No declarar cumplidas estas condiciones con el build.
