/**
 * Example usage of @netscript/prisma-adapter-mysql
 *
 * This example demonstrates how to use the Deno MySQL adapter with Prisma.
 *
 * Prerequisites:
 * 1. A running MySQL server
 * 2. A Prisma schema configured for MySQL
 * 3. Generated Prisma client
 *
 * @example
 * ```bash
 * # Generate Prisma client first
 * deno run -A npm:prisma generate
 *
 * # Run this example
 * deno run -A examples/basic-usage.ts
 * ```
 */

import { PrismaMySql } from '../src/mod.ts';

// Example configuration
const config = {
  hostname: Deno.env.get('MYSQL_HOST') ?? 'localhost',
  port: parseInt(Deno.env.get('MYSQL_PORT') ?? '3306'),
  username: Deno.env.get('MYSQL_USER') ?? 'root',
  password: Deno.env.get('MYSQL_PASSWORD') ?? '',
  db: Deno.env.get('MYSQL_DATABASE') ?? 'test',
  poolSize: 5,
};

async function main() {
  console.log('Creating MySQL adapter...');

  // Create the adapter factory
  const adapter = new PrismaMySql(config, {
    database: config.db,
    onConnectionError: (err) => {
      console.error('Connection error:', err.message);
    },
  });

  console.log('Connecting to database...');

  // Connect and create the adapter instance
  const connectedAdapter = await adapter.connect();

  console.log('Connected successfully!');
  console.log('Connection info:', connectedAdapter.getConnectionInfo());

  // At this point, you would create a PrismaClient with the adapter:
  //
  // import { PrismaClient } from "@prisma/client";
  //
  // const prisma = new PrismaClient({ adapter: connectedAdapter });
  //
  // const users = await prisma.user.findMany();
  // console.log("Users:", users);
  //
  // await prisma.$disconnect();

  // For this example, we'll just test the raw query capability
  console.log('\nTesting raw query...');

  try {
    const result = await connectedAdapter.queryRaw({
      sql: 'SELECT 1 + 1 AS result, NOW() AS current_time',
      args: [],
      argTypes: [],
    });

    console.log('Query result:');
    console.log('  Columns:', result.columnNames);
    console.log('  Column Types:', result.columnTypes);
    console.log('  Rows:', result.rows);
  } catch (error) {
    console.error('Query failed:', error);
  }

  // Cleanup
  console.log('\nDisposing adapter...');
  await connectedAdapter.dispose();
  console.log('Done!');
}

// Run if executed directly
if (import.meta.main) {
  main().catch(console.error);
}
