# Verificación de dependencias — 21/10/2026

Las versiones exactas resueltas están en package.json y package-lock.json. Runtime probado: Node 24.21.0, npm 11.19.0, Next 16.4.2, React 19.3.1, Auth.js 5.0.0-beta.32, Drizzle ORM 0.45.4/Kit 0.31.11, Tailwind 4.3.3 y Zod 4.6.7.

Se consultaron registro npm (versiones/peerDependencies) y documentación oficial de [Next.js](https://nextjs.org/docs/app/getting-started/installation), [Auth.js](https://authjs.dev/getting-started/installation), [Credentials](https://authjs.dev/getting-started/providers/credentials), [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql) y [shadcn manual](https://ui.shadcn.com/docs/installation/manual).

Auth.js v5 aún se publica como beta. La documentación oficial indica esa distribución y beta.32 declara Next 14/15/16 y React 18/19. Se fija esa versión, sin un tag flotante, para conservar el contrato del plan. Credentials utiliza JWT explícito y usuarios propios, sin adapter. No equivale a aceptar despliegue productivo; revisar mantenimiento y actualizaciones antes de ese gate.

ESLint 10.13.0 fue descartado porque los plugins import/react/jsx-a11y incluidos por eslint-config-next no lo admiten. Se conserva 9.39.5 compatible aunque npm la marca sin soporte. No se introdujo legacy-peer-deps para ocultar incompatibilidades. Pendiente actualizar cuando los plugins lo permitan.

`npm audit --omit=dev`: cero vulnerabilidades conocidas al verificar. El audit completo informó nueve alertas transitivas (cinco high por braces/micromatch/fast-glob en lint y cuatro moderate por esbuild/esbuild-kit en Drizzle Kit). El registro aún publica braces 3.0.3 como estable; el arreglo sugerido por npm degrada herramientas a versiones incompatibles con este stack. No se ejecutó `audit fix --force` ni se inventó un override incompatible. No exponer Drizzle Studio ni servidores auxiliares de estas herramientas. Revalidar antes de producción.

Argon2id: 64 MiB, tres iteraciones, paralelismo uno, sal aleatoria. El formato PHC de la versión instalada ordena parámetros m,p,t; la prueba verifica sus valores independientemente del orden textual.
