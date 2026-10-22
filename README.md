> Actualización de alcance — 22/10/2026: por pedido del responsable se deja sin efecto el guardado offline. La etapa 3A no es requisito para continuar. El desarrollo sigue con módulos online, comenzando por clientes (docs/tasks/004-clientes.md). Las referencias offline siguientes son antecedentes históricos, no requisitos vigentes.

# Taller 2.0 — Galante

Reemplazo gradual del sistema de gestión del taller. Repositorio inicializado en la rama `main` el 21/10/2026.

## Estado

Base ejecutable creada: ingreso con Auth.js, portada protegida, roles, revocación, migraciones PostgreSQL y pruebas. Incluye el primer módulo online de clientes: listado, búsqueda, ficha, alta y edición. Órdenes y finanzas siguen pendientes. No usar para operar el taller.

Next.js App Router + TypeScript, Tailwind CSS + componentes shadcn/ui, Auth.js Credentials/JWT, Zod y Drizzle ORM con `pg`. Versiones exactas y lockfile incluidos. PostgreSQL local de desarrollo preparado; la conexión a Neon se configurará por ambiente. El sistema requiere conexión para consultar y guardar datos.

## Abrir la app

Ver [ejecución local](docs/runbooks/desarrollo.md). En el equipo actual ya está generado `.env.local` y preparada la base de desarrollo. Crear la cuenta propia con `npm run admin -- bootstrap` (contraseña oculta) y ejecutar `npm run dev`. Abrir `http://localhost:3000`. No hay una contraseña predeterminada.

## Documentación

- [Plan rector](docs/plans/sistema-galante-v2.md): copia versionada del plan 1.1, cuya autorización documental original se amplía con el pedido de ejecución del 21/10/2026.
- [Contrato de reemplazo](docs/contracts/reemplazo.md): entrega de la etapa 1.
- [Etapa técnica](docs/tasks/003-base-tecnica.md): contrato de la entrega implementada.
- [Próxima etapa 3A](docs/tasks/003a-offline.md): prueba vertical de persistencia y sincronización.
- [Dependencias](docs/research/dependencias-etapa-3.md): compatibilidad, beta de Auth.js y alertas de herramientas.
- [Registro de ejecución](docs/progress.md): avances y condiciones pendientes.
- [Decisiones](NOTES.md): decisiones de esta entrega y su resolución.

Las fuentes Access, SQLite, Excel y capturas permanecen fuera de este repositorio. Desarrollo y pruebas utilizarán datos sintéticos. La copia actualizada es necesaria antes del corte definitivo.
