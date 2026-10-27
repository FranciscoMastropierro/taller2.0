> Actualización de alcance — 22/10/2026: por pedido del responsable se deja sin efecto el guardado offline. La etapa 3A no es requisito para continuar. El desarrollo sigue con módulos online, comenzando por clientes (docs/tasks/004-clientes.md). Las referencias offline siguientes son antecedentes históricos, no requisitos vigentes.

# Ejecutar Taller 2.0

## Equipo local

Node 24 (ver `.nvmrc`), npm y PostgreSQL 17. Desde esta carpeta:

```powershell
npm ci
Copy-Item .env.example .env.local
```

Si `.env.local` ya existe, conservarlo: contiene el secreto local generado durante esta entrega. Completar las variables según `.env.example`. No compartir ese archivo. Generar AUTH_SECRET con 32 bytes aleatorios; AUTH_URL debe coincidir con origen y puerto. No habilitar confianza en headers de proxy sin configurar previamente el hosting.

En este equipo existe el contenedor `galante-v2-dev-db`, publicado sólo en `127.0.0.1:55448`, con bases `galante_dev` y `galante_test`. Para iniciarlo: `docker start galante-v2-dev-db`. Desde el 27/10/2026, por pedido del usuario, `galante_dev` contiene los clientes y trabajos recuperados de SQLite; `galante_test` continúa separada y usa fixtures sintéticas. El contenedor conserva datos mientras exista; no es un respaldo.

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

### Importación recuperada e impresión

Fuente autorizada: `../outputs/sqlite/galante_analisis.sqlite`, abierta sólo para lectura. Migrar y ejecutar grants antes de importar. Usar un administrador activo existente para la auditoría; no se crean cuentas ni se solicitan contraseñas en argumentos.

```powershell
npm run import:legacy -- --source=../outputs/sqlite/galante_analisis.sqlite
npm run import:legacy -- --source=../outputs/sqlite/galante_analisis.sqlite --apply --actor=USUARIO_ADMIN_EXISTENTE
npm run import:legacy -- --source=../outputs/sqlite/galante_analisis.sqlite --verify
```

Sin `--apply`/`--verify` sólo valida fuente y cuenta registros. `--apply` usa MIGRATION_DATABASE_URL con transacción; un mismo hash retorna `already_imported`. Otra copia bajo el mismo origen se rechaza para no sobrescribir cambios. `--verify` usa DATABASE_URL runtime y compara cada original y vínculo; esperado 8.421 clientes, 31.233 órdenes y cero diferencias. Logs sin datos de clientes ni conexiones.

En Clientes se busca también por código anterior. En Órdenes → Histórico se buscan fichas viejas, se imprimen directamente o se continúa una reparación abierta eligiendo cliente y estado. La continuidad usa el mismo UUID y conserva el número viejo; desde la bandeja actual se busca también por ese número. Presupuesto, tiempo y estados ambiguos no se infieren.

Las fichas nuevas se preparan desde la orden y se reimprimen desde revisiones guardadas. Seleccionar papel personalizado **150 × 200 mm**, escala **100 %**, sin encabezados/pies del navegador. Talón al pie con número repetido. Probar márgenes reales con la impresora antes del uso operativo. Textos largos pueden continuar en páginas adicionales sin recortarse. PDF sintético de referencia en `test-results/ficha-15x20.pdf` después del E2E de histórico.

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
