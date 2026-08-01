import { assertEquals } from 'jsr:@std/assert@^1';
import { PrismaPg } from 'npm:@prisma/adapter-pg@^7.8.0';

import type {
  SagaCorrelationKey,
  SagaId,
  SagaInstanceId,
  SagaStateEnvelope,
  SagaTransitionRecord,
} from '../runtime/mod.ts';
import { PrismaSagaStore } from './prisma-saga-store.ts';

const TEST_DATABASE_URL = Deno.env.get('SAGA_PRISMA_TEST_DATABASE_URL');

Deno.test({
  name: 'PrismaSagaStore round-trips through the shipped fragment on Postgres',
  ignore: !TEST_DATABASE_URL,
  fn: async () => {
    if (!TEST_DATABASE_URL) throw new Error('SAGA_PRISMA_TEST_DATABASE_URL is required.');

    const workspace = await Deno.makeTempDir({ prefix: 'netscript-saga-prisma-' });
    try {
      await writeSchemaWrapper(workspace);
      const configPath = await writePrismaConfig(workspace);
      await runPrisma(['db', 'push', '--config', configPath], TEST_DATABASE_URL);
      await runPrisma(['generate', '--config', configPath], TEST_DATABASE_URL);
      await normalizeGeneratedRuntimeImport(workspace);

      const generatedClientPath = new URL(`file://${workspace}/generated/client.ts`).href;
      const { PrismaClient } = await import(generatedClientPath);
      const prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString: TEST_DATABASE_URL }),
      });
      const store = new PrismaSagaStore({ prisma });

      const sagaId = 'billing-saga' as SagaId;
      const correlationKey = 'order-live-1' as SagaCorrelationKey;
      const instanceId = 'billing-saga:order-live-1' as SagaInstanceId;
      const occurredAt = new Date('2026-08-01T12:00:00.000Z');
      const envelope: SagaStateEnvelope<{ status: string }> = Object.freeze({
        metadata: Object.freeze({
          instanceId,
          version: 1,
          status: 'running',
          durability: 't1',
          createdAt: occurredAt,
          updatedAt: occurredAt,
        }),
        state: Object.freeze({ status: 'started' }),
      });
      const transition: SagaTransitionRecord<{ status: string }> = Object.freeze({
        version: 1,
        transition: Object.freeze({
          from: Object.freeze({ status: 'pending' }),
          to: Object.freeze({ status: 'started' }),
          status: 'running',
          message: Object.freeze({ type: 'billing.started', payload: {}, occurredAt }),
          occurredAt,
        }),
      });

      try {
        await store.save(envelope);
        assertEquals(await store.load(instanceId), envelope);

        await store.saveCorrelation({ sagaId, correlationKey, instanceId });
        assertEquals(await store.findByCorrelation(sagaId, correlationKey), instanceId);

        await store.appendTransition(instanceId, transition);
        assertEquals(await store.transitions(instanceId), [transition]);

        await store.delete(instanceId);
        assertEquals(await store.load(instanceId), undefined);
        assertEquals(await store.findByCorrelation(sagaId, correlationKey), undefined);
        assertEquals(await store.transitions(instanceId), []);
      } finally {
        await prisma.$disconnect();
      }
    } finally {
      await Deno.remove(workspace, { recursive: true });
    }
  },
});

async function writeSchemaWrapper(workspace: string): Promise<string> {
  const shippedPath = new URL('../../../../plugins/sagas/database/sagas.prisma', import.meta.url);
  const shippedFragment = await Deno.readTextFile(shippedPath);
  const schemaPath = `${workspace}/schema.prisma`;
  const header = `generator client {
  provider = "prisma-client"
  output   = "./generated"
  runtime  = "deno"
}

datasource db {
  provider = "postgresql"
}

`;
  await Deno.writeTextFile(schemaPath, `${header}${shippedFragment}`);
  return schemaPath;
}

async function writePrismaConfig(workspace: string): Promise<string> {
  const configPath = `${workspace}/prisma.config.ts`;
  await Deno.writeTextFile(
    configPath,
    `import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: ${JSON.stringify(`${workspace}/schema.prisma`)},
  datasource: { url: env("DATABASE_URL") },
});
`,
  );
  return configPath;
}

async function runPrisma(args: readonly string[], databaseUrl: string): Promise<void> {
  const command = new Deno.Command(Deno.execPath(), {
    args: ['run', '--no-lock', '--allow-all', 'npm:prisma@7.8.0', ...args],
    env: { ...Deno.env.toObject(), DATABASE_URL: databaseUrl },
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const status = await command.spawn().status;
  if (!status.success) throw new Error(`Prisma command failed with exit code ${status.code}.`);
}

async function normalizeGeneratedRuntimeImport(workspace: string): Promise<void> {
  const barePrefix = '"@prisma/client/runtime/';
  let replacements = 0;
  for await (const entry of Deno.readDir(`${workspace}/generated/internal`)) {
    if (!entry.isFile || !entry.name.endsWith('.ts')) continue;
    const path = `${workspace}/generated/internal/${entry.name}`;
    const generated = await Deno.readTextFile(path);
    if (!generated.includes(barePrefix)) continue;
    replacements++;
    await Deno.writeTextFile(
      path,
      generated.replaceAll(barePrefix, '"npm:@prisma/client@^7.8.0/runtime/'),
    );
  }
  if (replacements === 0) {
    throw new Error('Prisma generated runtime import changed; update the Deno test wrapper.');
  }
}
