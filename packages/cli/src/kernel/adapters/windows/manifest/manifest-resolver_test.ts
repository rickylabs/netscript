import { join } from '@std/path';
import { buildManifestContext, getManifestEnvVars } from './manifest-resolver.ts';
import type { CompileTarget } from '../../../domain/deploy/compile-target.ts';
import type { InfrastructureConfig } from '../../../domain/infrastructure-config.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const TEST_INFRA: InfrastructureConfig = {
  database: {
    name: 'postgres',
    provider: 'postgres',
    mode: 'external',
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgresdb',
    databaseName: 'postgresdb',
  },
  cache: {
    name: 'garnet',
    provider: 'garnet',
    mode: 'external',
    host: 'localhost',
    port: 6379,
    connectionString: 'redis://localhost:6379',
  },
  additionalDatabases: {},
  otlpEndpoint: 'http://localhost:4318',
};

Deno.test('buildManifestContext resolves executable bindings via manifest resource aliases', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-manifest-' });

  try {
    await Deno.mkdir(join(projectRoot, '.llm'), { recursive: true });
    await Deno.writeTextFile(
      join(projectRoot, '.llm', 'aspire-manifest.json'),
      JSON.stringify({
        resources: {
          frontend: {
            type: 'executable.v0',
            env: {
              FRONTEND_ORIGIN: '{frontend.bindings.http.url}',
            },
            bindings: {
              http: {
                port: 8000,
                targetPort: 8000,
              },
            },
          },
        },
      }),
    );

    const targets: CompileTarget[] = [{
      name: 'frontend-app',
      type: 'app',
      entrypoint: 'apps/frontend/main.ts',
      workdir: 'apps/frontend',
      permissions: ['--allow-all'],
      port: 9100,
      manifestResourceName: 'frontend',
    }];

    const ctx = await buildManifestContext(projectRoot, TEST_INFRA, {}, targets);
    const env = getManifestEnvVars({ name: 'frontend-app', manifestResourceName: 'frontend' }, ctx);

    assert(
      env?.FRONTEND_ORIGIN === 'http://localhost:9100',
      'manifest env should resolve via manifest resource alias rather than target name',
    );
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});
