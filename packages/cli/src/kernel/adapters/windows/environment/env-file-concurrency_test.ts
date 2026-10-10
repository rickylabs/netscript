import { assertStringIncludes } from '@std/assert';
import type { CompileTarget } from '../../../domain/deploy/compile-target.ts';
import type { InfrastructureConfig } from '../../../domain/infrastructure-config.ts';
import { generateEnvFileContent } from './env-file-content.ts';

const WORKERS_SCAFFOLD_METADATA = new URL(
  '../../../../../../../plugins/workers/scaffold.plugin.json',
  import.meta.url,
);

const INFRASTRUCTURE: InfrastructureConfig = {
  database: {
    name: 'postgres',
    provider: 'postgres',
    mode: 'external',
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres',
  },
  cache: {
    name: 'redis',
    provider: 'redis',
    mode: 'external',
    host: 'localhost',
    port: 6379,
    connectionString: 'redis://localhost:6379',
  },
  additionalDatabases: {},
  otlpEndpoint: 'http://localhost:4318',
};

Deno.test('generated .env writes the workers runtime pool size under WORKERS_CONCURRENCY', async () => {
  const { provider } = JSON.parse(await Deno.readTextFile(WORKERS_SCAFFOLD_METADATA)) as {
    provider: { concurrencyEnvVar: string; defaultConcurrency: number };
  };
  const target: CompileTarget = {
    name: 'workers-combined',
    type: 'worker',
    entrypoint: 'plugins/workers/bin/combined.ts',
    workdir: '.',
    permissions: [],
    concurrencyEnvVar: provider.concurrencyEnvVar,
    defaultConcurrency: provider.defaultConcurrency,
  };

  const content = generateEnvFileContent([target], INFRASTRUCTURE, {}, {});

  assertStringIncludes(content, `\nWORKERS_CONCURRENCY=${provider.defaultConcurrency}\n`);
});
