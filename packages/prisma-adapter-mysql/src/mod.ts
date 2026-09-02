/**
 * @netscript/prisma-adapter-mysql
 *
 * A Prisma 7 driver adapter for MySQL/MariaDB that dynamically imports
 * the npm `mysql2/promise` driver.
 *
 * This solves the `Symbol(Deno.internal.rid)` error that occurs when
 * using `@prisma/adapter-mariadb` with Deno while requiring deployments
 * to provide npm resolution, Node-compatible socket APIs, and network access.
 *
 * @example
 * ```typescript
 * import { PrismaMySql } from "@netscript/prisma-adapter-mysql";
 * import { PrismaClient } from "@database";
 *
 * const adapter = new PrismaMySql({
 *   hostname: "localhost",
 *   port: 3306,
 *   username: "root",
 *   password: "password",
 *   db: "mydb",
 *   poolSize: 5,
 * });
 *
 * const prisma = new PrismaClient({ adapter });
 *
 * try {
 *   const result = await prisma.$queryRawUnsafe("SELECT 1");
 *   console.log(result);
 * } finally {
 *   await prisma.$disconnect();
 * }
 * ```
 *
 * @module
 */

export { inferCapabilities, PrismaMySql, PrismaMySqlAdapterFactory } from './adapter.ts';

export type {
  PrismaMySqlConnectedAdapter,
  PrismaMySqlConnectionInfo,
  PrismaMySqlIsolationLevel,
  PrismaMySqlQuery,
  PrismaMySqlResultSet,
  PrismaMySqlTransactionAdapter,
  PrismaMySqlTransactionOptions,
} from './adapter.ts';

export type { MySqlCapabilities, MySqlConnectionConfig, PrismaMySqlOptions } from './types.ts';
