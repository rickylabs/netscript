import { assertEquals, assertThrows } from 'jsr:@std/assert@^1';
import { PrismaPg } from 'npm:@prisma/adapter-pg@7.8.0';

import type {
  SagaCorrelationKey,
  SagaId,
  SagaInstanceId,
  SagaStateEnvelope,
  SagaTransitionRecord,
} from '../runtime/mod.ts';
import { PrismaSagaStore } from './prisma-saga-store.ts';

const TEST_DATABASE_URL = Deno.env.get('SAGA_PRISMA_TEST_DATABASE_URL');
const PRISMA_VERSION = '7.8.0';
const PRISMA_CLI_SPECIFIER = `npm:prisma@${PRISMA_VERSION}`;
const PRISMA_CLIENT_RUNTIME_PREFIX = `"npm:@prisma/client@${PRISMA_VERSION}/runtime/`;

Deno.test('Prisma saga integration accepts a loopback throwaway database URL', () => {
  assertThrowawayDatabaseUrl(
    'postgresql://postgres:secret@127.0.0.1:42110/netscript_saga_review_1032',
  );
  assertThrowawayDatabaseUrl('postgres://postgres:secret@localhost/netscript_saga_local');
  assertThrowawayDatabaseUrl('postgresql://postgres:secret@[::1]/netscript_saga_ipv6');
});

Deno.test('Prisma saga integration rejects a remote database URL without leaking credentials', () => {
  const password = 'review-secret-password';
  const error = assertThrows(
    () =>
      assertThrowawayDatabaseUrl(
        `postgresql://postgres:${password}@db.example.com/netscript_saga_review`,
      ),
    Error,
    'loopback host',
  );
  assertEquals(error.message.includes(password), false);
});

Deno.test('Prisma saga integration rejects a non-throwaway database name', () => {
  assertThrows(
    () => assertThrowawayDatabaseUrl('postgresql://postgres:secret@127.0.0.1/staging'),
    Error,
    'database name "staging"',
  );
});

Deno.test('Prisma saga integration rejects a non-Postgres protocol', () => {
  assertThrows(
    () => assertThrowawayDatabaseUrl('mysql://root:secret@127.0.0.1/netscript_saga_review'),
    Error,
    'protocol "mysql:"',
  );
});

Deno.test('Prisma saga integration rejects a malformed database URL', () => {
  const password = 'malformed-secret';
  const error = assertThrows(
    () => assertThrowawayDatabaseUrl(`not a url ${password}`),
    Error,
    'valid PostgreSQL URL',
  );
  assertEquals(error.message.includes(password), false);
});

Deno.test('Prisma saga integration keeps every npm Prisma specifier at one version', async () => {
  const source = await Deno.readTextFile(new URL(import.meta.url));
  const versions = [...source.matchAll(/npm:(?:prisma|@prisma\/[a-z-]+)@([^/'"`]+)/g)]
    .map((match) => match[1]);

  assertEquals(versions.length, 3);
  assertEquals(versions, [PRISMA_VERSION, '${PRISMA_VERSION}', '${PRISMA_VERSION}']);
});

Deno.test({
  name: 'PrismaSagaStore round-trips through the shipped fragment on Postgres',
  ignore: !TEST_DATABASE_URL,
  fn: async () => {
    if (!TEST_DATABASE_URL) throw new Error('SAGA_PRISMA_TEST_DATABASE_URL is required.');
    assertThrowawayDatabaseUrl(TEST_DATABASE_URL);

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

      const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 12);
      const sagaId = `billing-saga-${suffix}` as SagaId;
      const correlationKey = `order-live-${suffix}` as SagaCorrelationKey;
      const instanceId = `${sagaId}:${correlationKey}` as SagaInstanceId;
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
        try {
          await store.delete(instanceId);
        } catch {
          // Best-effort cleanup must not mask the test's assertion failure.
        }
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
    args: ['run', '--no-lock', '--allow-all', PRISMA_CLI_SPECIFIER, ...args],
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
      generated.replaceAll(barePrefix, PRISMA_CLIENT_RUNTIME_PREFIX),
    );
  }
  if (replacements === 0) {
    throw new Error('Prisma generated runtime import changed; update the Deno test wrapper.');
  }
}

function assertThrowawayDatabaseUrl(rawUrl: string): void {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(
      'Rejected saga integration database URL: expected a valid PostgreSQL URL on loopback with a database named netscript_saga_<lowercase_suffix>.',
    );
  }

  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error(
      `Rejected saga integration database protocol "${url.protocol}": expected "postgres:" or "postgresql:".`,
    );
  }

  const loopbackHosts = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
  if (!loopbackHosts.has(url.hostname)) {
    throw new Error(
      `Rejected saga integration database host "${url.hostname}": expected a loopback host (127.0.0.1, localhost, or ::1).`,
    );
  }

  const databaseName = url.pathname.slice(1);
  if (!/^netscript_saga_[a-z0-9_]+$/.test(databaseName)) {
    throw new Error(
      `Rejected saga integration database name "${databaseName}": expected netscript_saga_<lowercase_suffix>.`,
    );
  }
}
