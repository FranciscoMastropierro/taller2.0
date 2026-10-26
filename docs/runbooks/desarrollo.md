> Actualización de alcance — 22/10/2026: por pedido del responsable se deja sin efecto el guardado offline. La etapa 3A no es requisito para continuar. El desarrollo sigue con módulos online, comenzando por clientes (docs/tasks/004-clientes.md). Las referencias offline siguientes son antecedentes históricos, no requisitos vigentes.

# Ejecutar Taller 2.0

## Equipo local

Node 24 (ver `.nvmrc`), npm y PostgreSQL 17. Desde esta carpeta:

```powershell
npm ci
Copy-Item .env.example .env.local
```

Si `.env.local` ya existe, conservarlo: contiene el secreto local generado durante esta entrega. Completar las variables según `.env.example`. No compartir ese archivo. Generar AUTH_SECRET con 32 bytes aleatorios; AUTH_URL debe coincidir con origen y puerto. No habilitar confianza en headers de proxy sin configurar previamente el hosting.

En este equipo ya existe el contenedor `galante-v2-dev-db`, publicado sólo en `127.0.0.1:55448`, con bases `galante_dev` y `galante_test`. Para volver a iniciarlo: `docker start galante-v2-dev-db`. Son datos sintéticos; no conectar fuentes del taller. El contenedor conserva sus datos mientras exista; no es un respaldo.

Para reproducir en otro equipo, crear PostgreSQL vacío con usuario propietario y dos bases separadas. TEST_DATABASE_URL debe terminar en `_test`; integración crea registros sintéticos y un rol sin login para comprobar privilegios. El usuario de pruebas requiere capacidad de crear ese rol. No ejecutar pruebas contra producción.

```powershell
npm run db:migrate
npm run admin -- bootstrap
npm run dev
```

Bootstrap pide usuario, nombre y contraseña oculta de al menos 12 caracteres. Se ejecuta una sola vez por base; no hay cuenta/contraseña predeterminada. Abrir `http://localhost:3000`. Para cambiar una contraseña: `npm run admin -- recover`; aumenta session_version y deja auditoría. Requiere acceso administrativo al servidor/configuración: no es una ruta pública. No reactiva ni eleva roles silenciosamente.

## Neon y privilegios

En cada ambiente, crear rol runtime `galante_runtime` sin permisos de propietario/DDL, con contraseña por canal seguro. Migrar usando MIGRATION_DATABASE_URL del propietario (endpoint directo). Ejecutar `scripts/runtime-grants.sql` como propietario tras migraciones. Configurar DATABASE_URL del rol runtime en endpoint pooled con `sslmode=require` o `verify-full`; no desactivar validación de certificados. La base y su contraseña de pruebas son independientes. El comando de migración nunca utiliza la URL runtime por defecto.

En este equipo DATABASE_URL ya utiliza `galante_runtime` con grants limitados; MIGRATION_DATABASE_URL conserva el propietario para preparar la base. Antes de conectar Neon, recrear esa separación por ambiente. No se creó proyecto Neon, hosting ni credenciales externas en esta entrega.

## Verificar

```powershell
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npx playwright install chromium
npm run test:e2e
```

E2E inicia servidor temporal en 3100 usando exclusivamente la DB de prueba. No dejar otro servidor de desarrollo usando el mismo directorio `.next/dev` durante esa prueba. La CI declara PostgreSQL, instalación limpia y estos controles; su ejecución remota queda pendiente de conectar un repositorio remoto.

La limitación de login admite ocho intentos por usuario normalizado cada quince minutos, compartidos entre instancias. Incluye intentos exitosos; evita reiniciar el contador ante solicitudes concurrentes. Un bloqueo no borra datos ni inhabilita permanentemente la cuenta. Logs omiten usuario, contraseña, hash y URL de conexión.

## Estado de funciones

Ingreso, sesión, roles, clientes y órdenes funcionan online. Migrar y aplicar scripts/runtime-grants.sql antes de iniciar una versión con tablas nuevas. Desde Clientes se pueden abrir órdenes del cliente o ingresar una reparación; desde Inicio se accede al listado general. Admin/recepción ingresan, editan y avanzan estados; técnicos consultan sólo sus órdenes y registran diagnóstico/trabajo/minutos; consulta no recibe presupuesto. Las correcciones de estado requieren admin y motivo. Ubicación es texto libre por orden, no un catálogo de mesas. Offline quedó fuera del alcance. Importación, impresión definitiva, finanzas y ARCA siguen pendientes; no utilizar esta entrega para migrar datos reales ni sustituir el sistema productivo.
