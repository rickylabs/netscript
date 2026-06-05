/**
 * @netscript/prisma-adapter-mysql
 *
 * A Prisma driver adapter for MySQL/MariaDB that uses Deno's native
 * mysql driver instead of the npm mariadb package.
 *
 * This solves the `Symbol(Deno.internal.rid)` error that occurs when
 * using @prisma/adapter-mariadb with Deno, which is caused by the
 * npm mariadb package accessing internal Node.js socket properties
 * that don't exist in Deno's Node compatibility layer.
 *
 * @example
 * ```typescript
 * import { PrismaClient } from "@prisma/client";
 * import { PrismaMySql } from "@netscript/prisma-adapter-mysql";
 *
 * // Create adapter with connection config
 * const adapter = new PrismaMySql({
 *   hostname: "localhost",
 *   port: 3306,
 *   username: "root",
 *   password: "password",
 *   db: "mydb",
 *   poolSize: 5,
 * });
 *
 * // Create Prisma client with adapter
 * const prisma = new PrismaClient({ adapter });
 *
 * // Use Prisma normally
 * const users = await prisma.user.findMany();
 *
 * // Cleanup
 * await prisma.$disconnect();
 * ```
 *
 * @module
 */

export {
  inferCapabilities,
  PrismaMySql,
  PrismaMySqlAdapter,
  PrismaMySqlAdapterFactory,
} from "./adapter.ts";

export type {
  DenoMySqlClient,
  DenoMySqlConnection,
  ExecuteResult,
  MySqlCapabilities,
  MySqlConnectionConfig,
  PrismaMySqlOptions,
} from "./types.ts";

export { mapArg, mapColumnType, mapRow } from "./conversion.ts";

export { convertDriverError, mapDriverError } from "./errors.ts";