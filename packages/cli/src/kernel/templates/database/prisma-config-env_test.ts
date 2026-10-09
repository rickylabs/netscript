/**
 * @module templates/database/prisma-config-env_test
 *
 * #1996: the documented `--no-aspire` database lifecycle sets `POSTGRES_URI`
 * *or* `DATABASE_URL`. Prisma's `env()` throws for an unset variable, so the
 * generated config must only consult it as the last fallback.
 */

import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';

import { DbEngineRegistry } from '../../application/registries/db-engine-registry.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';
import { generatePrismaConfig } from './generate-prisma-config.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

const PRISMA_CONFIG_IMPORT = "import { defineConfig, env } from 'prisma/config';";
// Same contract as prisma/config: defineConfig is identity, env() throws when unset.
const PRISMA_CONFIG_STUB = `const defineConfig = (config: unknown) => config;
const env = (name: string): string => {
  const value = Deno.env.get(name);
  if (value === undefined) throw new Error(\`Cannot resolve environment variable: \${name}.\`);
  return value;
};`;

async function evaluatePostgresConfig(): Promise<{ datasource: { url: string } }> {
  const source = generatePrismaConfig(new DbEngineRegistry().get('postgres'), {
    configKey: 'postgres',
  });
  assertEquals(source.includes(PRISMA_CONFIG_IMPORT), true);
  const module = source.replace(PRISMA_CONFIG_IMPORT, PRISMA_CONFIG_STUB);
  const url = `data:application/typescript,${encodeURIComponent(module)}#${crypto.randomUUID()}`;
  return (await import(url)).default;
}

function withEnv(values: Record<string, string | undefined>, run: () => Promise<void>) {
  return async () => {
    const previous = Object.fromEntries(Object.keys(values).map((key) => [key, Deno.env.get(key)]));
    const apply = (entries: Record<string, string | undefined>) => {
      for (const [key, value] of Object.entries(entries)) {
        if (value === undefined) Deno.env.delete(key);
        else Deno.env.set(key, value);
      }
    };
    apply(values);
    try {
      await run();
    } finally {
      apply(previous);
    }
  };
}

Deno.test(
  'generated Postgres prisma.config.ts resolves POSTGRES_URI without DATABASE_URL',
  withEnv({ POSTGRES_URI: 'postgres://app:secret@db.internal:5432/app', DATABASE_URL: undefined }, async () => {
    const config = await evaluatePostgresConfig();
    assertEquals(config.datasource.url, 'postgres://app:secret@db.internal:5432/app');
  }),
);

Deno.test(
  'generated Postgres prisma.config.ts falls back to DATABASE_URL',
  withEnv({ POSTGRES_URI: undefined, DATABASE_URL: 'postgres://app@fallback:5432/app' }, async () => {
    const config = await evaluatePostgresConfig();
    assertEquals(config.datasource.url, 'postgres://app@fallback:5432/app');
  }),
);

Deno.test(
  'generated Postgres prisma.config.ts still names DATABASE_URL when nothing is set',
  withEnv({ POSTGRES_URI: undefined, DATABASE_URL: undefined }, async () => {
    await assertRejects(
      () => evaluatePostgresConfig(),
      Error,
      'Cannot resolve environment variable: DATABASE_URL',
    );
  }),
);
