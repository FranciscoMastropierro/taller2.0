> Actualización de alcance — 22/10/2026: por pedido del responsable se deja sin efecto el guardado offline. La etapa 3A no es requisito para continuar. El desarrollo sigue con módulos online, comenzando por clientes (docs/tasks/004-clientes.md). Las referencias offline siguientes son antecedentes históricos, no requisitos vigentes.

# Taller 2.0 — Galante

Reemplazo gradual del sistema de gestión del taller. Repositorio inicializado en la rama `main` el 21/10/2026.

## Estado

Actualizado 27/10/2026. Acceso efectivo sólo admin/reception; perfiles históricos no ingresan ni reutilizan sesiones anteriores. Inicio conserva cuatro tarjetas: Clientes, Órdenes de trabajo, Cheques y Comprobantes, sin módulos de usuarios/técnicos ni catálogo de mesas.

Clientes y órdenes online, historial y estados TURNO → TERMINADO → ENTREGADO. Importados **8.421 clientes y 31.233 órdenes** de la SQLite autorizada, con originales/números anteriores y continuidad explícita de reparaciones abiertas. Fichas de ingreso/trabajo **15 × 20 cm**, número repetido en talón recortable y reimpresión preservada.

Cuenta corriente con aperturas conciliadas, deuda/crédito/saldo separados; cobros y anticipos con aplicaciones parciales a varias obligaciones; recibos internos; cheques de terceros con cartera y depósito/acreditación/rechazo por componente. Constancias internas de entrega y reportes imprimibles de pendientes, deudores y cobros. No se cargaron saldos históricos automáticamente.

**Pendiente:** conciliación real de aperturas/cartera, prueba con impresora física, validación del remito definitivo y facturación/ventas fiscales ARCA (modalidad, tipos y punto de venta no confirmados). Sin emisión fiscal ni despliegue. El corte productivo conserva sus verificaciones.

Next.js App Router + TypeScript, Tailwind CSS + componentes shadcn/ui, Auth.js Credentials/JWT, Zod y Drizzle ORM con `pg`. Versiones exactas y lockfile incluidos. PostgreSQL local de desarrollo preparado; la conexión a Neon se configurará por ambiente. El sistema requiere conexión para consultar y guardar datos.

## Abrir la app

Ver [ejecución local](docs/runbooks/desarrollo.md). En este equipo ya existe `.env.local`, la base local migrada y una cuenta administrativa; conservar configuración/cuentas existentes. Ejecutar `docker start galante-v2-dev-db` y `npm run dev`, abrir `http://localhost:3000`. Sólo si no se hizo bootstrap: `npm run admin -- bootstrap` por terminal. No hay contraseña predeterminada.

## Documentación

- [Plan rector](docs/plans/sistema-galante-v2.md): copia versionada del plan 1.1, cuya autorización documental original se amplía con el pedido de ejecución del 21/10/2026.
- [Contrato de reemplazo](docs/contracts/reemplazo.md): entrega de la etapa 1.
- [Etapa técnica](docs/tasks/003-base-tecnica.md): contrato de la entrega implementada.
- [Clientes](docs/tasks/004-clientes.md): módulo integrado.
- [Órdenes](docs/tasks/005-ordenes.md): contrato del módulo de reparaciones.
- [Continuidad](docs/tasks/006-continuidad-administrativa.md): alcance y estado por entrega.
- [Impresión e histórico](docs/tasks/007-impresion-historico.md): formato confirmado, carga y continuidad.
- [Cuenta corriente](docs/tasks/008-cuenta-corriente.md): aperturas conciliadas y saldos.
- [Cobros y recibos](docs/tasks/009-cobros-recibos.md): anticipos y aplicaciones.
- [Cheques](docs/tasks/010-cheques.md): cartera y reversión por componente.
- [Constancias y reportes](docs/tasks/011-remitos-reportes.md): documentos internos y consultas imprimibles.
- [Precondiciones ARCA](docs/tasks/012-precondiciones-arca.md): información necesaria antes del adaptador.
- [Antecedente 3A](docs/tasks/003a-offline.md): offline retirado del alcance vigente.
- [Dependencias](docs/research/dependencias-etapa-3.md): compatibilidad, beta de Auth.js y alertas de herramientas.
- [Registro de ejecución](docs/progress.md): avances y condiciones pendientes.
- [Decisiones](NOTES.md): decisiones de esta entrega y su resolución.

Las fuentes Access, SQLite, Excel y capturas permanecen fuera de Git. Por autorización del usuario, la base local contiene clientes/trabajos recuperados; las pruebas usan una base sintética separada. La copia actualizada y conciliación siguen siendo necesarias para el corte definitivo.
