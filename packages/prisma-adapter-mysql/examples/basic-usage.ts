/**
 * Example usage of @netscript/prisma-adapter-mysql
 *
 * This example demonstrates the Prisma 7 flow for the mysql2-backed MySQL adapter.
 *
 * Prerequisites:
 * 1. A running MySQL server
 * 2. A Prisma schema configured for MySQL
 * 3. A Prisma client generator using `provider = "prisma-client"`, `runtime = "deno"`, and an
 *    `output` pointing to this package's `examples/.generated` directory, producing `client.ts`
 * 4. `@prisma/client` resolvable through your import map or an `npm:` specifier
 *
 * @example
 * ```bash
 * # Generate Prisma client first
 * deno run -A npm:prisma generate --schema path/to/schema.prisma
 *
 * # Run this example
 * deno run --allow-env --allow-net examples/basic-usage.ts
 * ```
 */

import { PrismaMySql } from '../mod.ts';
const { PrismaClient } = await import('./.generated/client.ts');

// Example configuration
const config = {
  hostname: Deno.env.get('MYSQL_HOST') ?? 'localhost',
  port: parseInt(Deno.env.get('MYSQL_PORT') ?? '3306'),
  username: Deno.env.get('MYSQL_USER') ?? 'root',
  password: Deno.env.get('MYSQL_PASSWORD') ?? '',
  db: Deno.env.get('MYSQL_DATABASE') ?? 'test',
  poolSize: 5,
  timeout: 10_000,
};

async function main(): Promise<void> {
  const adapter = new PrismaMySql(config, {
    database: config.db,
    // Observes fatal handshake/transport, capacity, and pool connection errors.
    onConnectionError: (err) => {
      console.error('Connection error:', err.message);
    },
  });

  // Prisma receives the factory and owns the connected pool lifecycle.
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await prisma.$queryRawUnsafe(
      'SELECT 1 + 1 AS result, NOW() AS current_time',
    );
    console.log('Query result:', result);
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error('Prisma MySQL example failed:', error);
    Deno.exitCode = 1;
  }
}
