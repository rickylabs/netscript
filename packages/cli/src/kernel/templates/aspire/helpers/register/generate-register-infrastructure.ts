/**
 * @module
 *
 * Generator for `.helpers/register-infrastructure.mts` — registers databases
 * and caches with the Aspire SDK builder. Handles engine dispatch, container
 * vs external mode, persistent lifetime, data bind mounts, `.withRepl()`, and
 * primary resource resolution.
 */

import type { CacheEntry } from '@netscript/aspire/types';
import type { RegisterInfrastructureOptions } from '../types.ts';
import { fileHeader } from '../_utils.ts';
import { SCAFFOLD_ASPIRE_MODULES } from '../../../../constants/scaffold/scaffold-aspire.ts';
import { TEMPLATE_KEYS } from '../../../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../../../adapters/templates/template-asset.ts';
import {
  denokvContainerSetup,
  garnetExecutableSetup,
  redisGarnetContainerSetup,
} from './register-infrastructure-cache.ts';

/** Maps database engine names to SDK builder method names. */
const DB_ENGINE_METHODS: Record<string, string> = {
  Postgres: 'addPostgres',
  Mysql: 'addMySql',
  Mssql: 'addSqlServer',
};

const MSSQL_CONTAINER_IMAGE = 'mssql/server';
const MSSQL_CONTAINER_TAG = '2022-latest';

/**
 * Generates the register-infrastructure.mts file content.
 *
 * @param options - Database and cache entries from parsed config
 * @returns Generated TypeScript source as a string
 */
export function generateRegisterInfrastructure(
  options: RegisterInfrastructureOptions,
): string {
  const { databases, caches, primaryDatabase, primaryCache } = options;
  const dbEntries = Object.entries(databases);
  const cacheEntries = Object.entries(caches);
  const usesDenoKvContainer = cacheEntries.some(([, entry]) =>
    entry.Engine === 'DenoKv' &&
    !['External', 'Local'].includes(entry.Mode ?? 'Container')
  );
  const hasPersistentContainerDatabase = dbEntries.some(([, entry]) =>
    entry.Engine !== 'Sqlite' &&
    (entry.Mode ?? 'Container') === 'Container' &&
    entry.Persistent === true
  );
  const usesDatabaseListenerReadiness = dbEntries.some(([, entry]) =>
    ['Postgres', 'Mysql', 'Mssql'].includes(entry.Engine) &&
    (entry.Mode ?? 'Container') === 'Container'
  );
  const usesPostgresCredentialReadiness = dbEntries.some(([, entry]) =>
    needsPostgresCredentialReadiness(entry)
  );
  const usesRespReadiness = cacheEntries.some(([, entry]) =>
    ['Redis', 'Garnet'].includes(entry.Engine) &&
    !['External', 'Local'].includes(entry.Mode ?? 'Container')
  );
  const usesGarnetContainerDataPath = cacheEntries.some(([, entry]) =>
    entry.Engine === 'Garnet' &&
    Boolean(entry.DataPath) &&
    !['External', 'Local', 'Executable'].includes(entry.Mode ?? 'Container')
  );
  const sdkValueImports = [
    ...(hasPersistentContainerDatabase ? ['ContainerLifetime'] : []),
    ...(cacheEntries.some(([, entry]) => !['External', 'Local'].includes(entry.Mode ?? 'Container'))
      ? ['EndpointProperty']
      : []),
  ];
  const compatImports = [
    'type CacheWiring',
    ...(usesDatabaseListenerReadiness ? ['createEndpointListenerReadinessCheck'] : []),
    ...(usesPostgresCredentialReadiness ? ['createPostgresCredentialReadinessCheck'] : []),
    ...(usesRespReadiness ? ['createRespPingCheck'] : []),
    ...(usesGarnetContainerDataPath ? ['ensureContainerDataPath'] : []),
    ...(dbEntries.some(([, entry]) =>
        ['Postgres', 'Mysql', 'Mssql'].includes(entry.Engine) &&
        (entry.Mode ?? 'Container') === 'Container'
      )
      ? ['ensureDatabasePassword']
      : []),
    ...(cacheEntries.some(([, entry]) =>
        entry.Mode === 'Auto' ||
        (entry.Engine === 'Garnet' && entry.Mode === 'Executable')
      )
      ? ['ensureGarnetToolManifest']
      : []),
    ...(usesDenoKvContainer ? ['generateAccessToken as _generateAccessToken'] : []),
    ...(usesGarnetContainerDataPath ? ['resolveContainerBindMountRuntimeArgs'] : []),
    ...(usesResolvedDataPath(dbEntries, cacheEntries) ? ['resolveDataPath'] : []),
    ...(cacheEntries.some(([, entry]) => entry.Mode === 'Auto') ? ['shouldUseContainerCache'] : []),
  ];

  // Build database registration blocks
  const dbBlocks: string[] = [];
  for (const [databaseIndex, [name, entry]] of dbEntries.entries()) {
    const id = `db_${databaseIndex}`;
    const mode = entry.Mode ?? 'Container';

    if (entry.Engine === 'Sqlite') {
      const sqlitePath = entry.DataPath ?? entry.DatabaseName ?? `${name}.sqlite`;
      dbBlocks.push(`  // database ${databaseIndex} (Sqlite, resolved file-backed resource)
  const ${id} = await builder.addParameter(${JSON.stringify(name)}, {
    value: resolveDataPath(appHostDir, ${JSON.stringify(sqlitePath)}, ${JSON.stringify(name)}),
    secret: false,
  });
  databases.set(${JSON.stringify(name)}, ${id});`);
      continue;
    }

    if (mode === 'External') {
      dbBlocks.push(`  // database ${databaseIndex} (External)
  const ${id} = await builder.addConnectionString(${JSON.stringify(name)});
  databases.set(${JSON.stringify(name)}, ${id});
  databaseConnectionStrings.set(
    ${JSON.stringify(name)},
    async () => {
      const value = await builder.getConfiguration().getConnectionString(${JSON.stringify(name)});
      if (!value) {
        throw new Error(${
        JSON.stringify(`Connection string for database '${name}' is not configured.`)
      });
      }
      return value;
    },
  );`);
      continue;
    }

    const method = DB_ENGINE_METHODS[entry.Engine] ?? 'addConnectionString';
    const lines: string[] = [];

    lines.push(`  // database ${databaseIndex} (Container)`);
    // TypeScript Aspire SDK: every `builder.addXxx(...)` and `.addDatabase(...)`
    // returns a ResourcePromise. The chained configuration methods
    // (`withLifetime`, `withDataBindMount`, …) are defined on the promise,
    // but the stored value passed to `.withReference(...)` later MUST be the
    // resolved resource — otherwise the runtime rejects with
    // "Argument 'source' is a Promise-like value". So we `await` the entire
    // chain here.
    if (entry.Engine === 'Postgres' || entry.Engine === 'Mysql' || entry.Engine === 'Mssql') {
      // Read once: the secret parameter and readiness/env consumers must see the same value.
      const passwordCall = entry.Engine === 'Mssql'
        ? `ensureDatabasePassword(appHostDir, ${JSON.stringify(name)}, { requireComplexity: true })`
        : `ensureDatabasePassword(appHostDir, ${JSON.stringify(name)})`;
      lines.push(`  const ${id}_password_value = ${passwordCall};`);
      lines.push(
        `  const ${id}_password = await builder.addParameter(${
          JSON.stringify(`${name}-password`)
        }, {`,
      );
      lines.push(`    value: ${id}_password_value,`);
      lines.push(`    secret: true,`);
      lines.push(`  });`);
      lines.push(`  const ${id}_server = await builder.${method}(${JSON.stringify(name)}, {`);
      if (entry.Port !== undefined) {
        lines.push(`    port: ${entry.Port},`);
      }
      lines.push(`    password: ${id}_password,`);
      lines.push(`  })`);
    } else {
      lines.push(`  const ${id}_server = await builder.${method}(${JSON.stringify(name)})`);
    }

    if (entry.Persistent) {
      lines.push(
        `    // Isolated starts randomize ports, so a configured-persistent container must remain session-scoped.`,
      );
      lines.push(
        `    .withLifetime(isolatedStart ? ContainerLifetime.Session : ContainerLifetime.Persistent)`,
      );
    }
    if (entry.DataPath) {
      lines.push(
        `    .withDataBindMount(resolveDataPath(appHostDir, ${JSON.stringify(entry.DataPath)}, ${
          JSON.stringify(name)
        }))`,
      );
    }
    if (entry.Engine === 'Mssql') {
      lines.push(`    .withImage('${MSSQL_CONTAINER_IMAGE}')`);
      lines.push(
        `    .withImageTag(${JSON.stringify(entry.ImageTag ?? MSSQL_CONTAINER_TAG)})`,
      );
      lines.push(`    .withEnvironment('ACCEPT_EULA', 'Y')`);
      lines.push(`    .withEnvironment('SA_PASSWORD', ${id}_password_value)`);
      lines.push(`    .withEnvironment('MSSQL_SA_PASSWORD', ${id}_password_value)`);
    }
    if (['Postgres', 'Mysql', 'Mssql'].includes(entry.Engine)) {
      lines.push(`    .withRepl()`);
    }

    // Close the server chain with semicolon
    const lastIdx = lines.length - 1;
    lines[lastIdx] = lines[lastIdx] + ';';

    if (['Postgres', 'Mysql', 'Mssql'].includes(entry.Engine)) {
      const healthCheckKey = `${name}_listener`;
      lines.push(`  builder.addHealthCheck(${JSON.stringify(healthCheckKey)}, async () => {`);
      lines.push(`    return await createEndpointListenerReadinessCheck({`);
      lines.push(`      kind: ${JSON.stringify(entry.Engine.toLowerCase())},`);
      lines.push(`      endpoint: () => ${id}_server.getEndpoint('tcp'),`);
      lines.push(`      containerBacked: true,`);
      lines.push(`    })();`);
      lines.push(`  });`);
      lines.push(`  await ${id}_server.withHealthCheck(${JSON.stringify(healthCheckKey)});`);
    }
    if (needsPostgresCredentialReadiness(entry)) {
      appendPostgresCredentialReadinessLines(lines, id, name);
    }

    // Add database child resource if DatabaseName is specified
    if (entry.DatabaseName) {
      lines.push(
        `  const ${id} = await ${id}_server.addDatabase(${JSON.stringify(entry.DatabaseName)});`,
      );
    } else {
      lines.push(`  const ${id} = ${id}_server;`);
    }

    lines.push(`  databases.set(${JSON.stringify(name)}, ${id});`);
    dbBlocks.push(lines.join('\n'));
  }

  // Build cache registration blocks
  const cacheBlocks: string[] = [];
  for (const [cacheIndex, [name, entry]] of cacheEntries.entries()) {
    const id = `cache_${cacheIndex}`;
    const mode = entry.Mode ?? 'Container';

    // DenoKv Local — in-process Deno.openKv(), no Aspire resource.
    if (entry.Engine === 'DenoKv' && mode === 'Local') {
      cacheBlocks.push(
        `  // cache ${cacheIndex} (DenoKv, Local — in-process Deno.openKv(), no Aspire resource)\n` +
          `  cacheWiring.set(${
            JSON.stringify(name)
          }, { resource: null, reference: null, env: {}, local: true });`,
      );
      continue;
    }

    // External — connection-string resource; consumer wires by reference only.
    if (mode === 'External') {
      cacheBlocks.push(`  // cache ${cacheIndex} (External)
  const ${id} = await builder.addConnectionString(${JSON.stringify(name)});
  caches.set(${JSON.stringify(name)}, ${id});
  cacheWiring.set(${
        JSON.stringify(name)
      }, { resource: ${id}, reference: ${id}, env: {}, local: false });`);
      continue;
    }

    // Auto — environment-aware at apphost runtime (D5/D6).
    if (mode === 'Auto') {
      const container = entry.Engine === 'DenoKv'
        ? denokvContainerSetup(id, name, entry)
        : redisGarnetContainerSetup(id, name, entry);
      const executable = garnetExecutableSetup(id, name, entry);
      const lines: string[] = [];

      lines.push(
        `  // cache ${cacheIndex} (Auto — Docker container; Docker-less Garnet executable)`,
      );
      lines.push(`  let ${id}_wiring: CacheWiring;`);
      lines.push(`  if (shouldUseContainerCache()) {`);
      for (const line of container.lines) lines.push(`  ${line}`);
      lines.push(`    ${id}_wiring = ${container.wiring};`);
      lines.push(`  } else {`);
      for (const line of executable.lines) lines.push(`  ${line}`);
      lines.push(`    ${id}_wiring = ${executable.wiring};`);
      lines.push(`  }`);
      lines.push(`  cacheWiring.set(${JSON.stringify(name)}, ${id}_wiring);`);
      cacheBlocks.push(lines.join('\n'));
      continue;
    }

    // DenoKv Container — Deno KV Connect over HTTP with an access token.
    if (entry.Engine === 'DenoKv') {
      const setup = denokvContainerSetup(id, name, entry);
      cacheBlocks.push([
        `  // cache ${cacheIndex} (DenoKv, Container — Deno KV Connect)`,
        ...setup.lines,
        `  cacheWiring.set(${JSON.stringify(name)}, ${setup.wiring});`,
      ].join('\n'));
      continue;
    }

    // Garnet Executable — Docker-less self-provisioned dotnet tool (#372).
    if (entry.Engine === 'Garnet' && mode === 'Executable') {
      const setup = garnetExecutableSetup(id, name, entry);
      cacheBlocks.push([
        `  // cache ${cacheIndex} (Garnet, Executable — Docker-less dotnet tool)`,
        ...setup.lines,
        `  cacheWiring.set(${JSON.stringify(name)}, ${setup.wiring});`,
      ].join('\n'));
      continue;
    }

    // Redis / Garnet Container — Redis-compatible TCP endpoint.
    const setup = redisGarnetContainerSetup(id, name, entry);
    cacheBlocks.push([
      `  // cache ${cacheIndex} (Container)`,
      ...setup.lines,
      `  cacheWiring.set(${JSON.stringify(name)}, ${setup.wiring});`,
    ].join('\n'));
  }

  const allBlocks = [...dbBlocks, ...cacheBlocks];
  const usesBuilder = hasPersistentContainerDatabase ||
    allBlocks.some((block) => block.includes('builder.'));
  const usesAppHostDir = allBlocks.some((block) => block.includes('appHostDir'));
  const usesAwait = hasPersistentContainerDatabase ||
    allBlocks.some((block) => block.includes('await '));

  // Primary resolution
  const primaryDbLine = primaryDatabase
    ? `  const primaryDatabase = databases.get(${JSON.stringify(primaryDatabase)}) ?? null;`
    : `  const primaryDatabase = null;`;
  const primaryCacheLine = primaryCache
    ? `  const primaryCache = caches.get(${JSON.stringify(primaryCache)}) ?? null;`
    : `  const primaryCache = null;`;
  const primaryCacheEndpointLine = primaryCache
    ? `  const primaryCacheEndpoint = cacheEndpoints.get(${JSON.stringify(primaryCache)}) ?? null;`
    : `  const primaryCacheEndpoint = null;`;
  const primaryCacheWiringLine = primaryCache
    ? `  const primaryCacheWiring = cacheWiring.get(${JSON.stringify(primaryCache)}) ?? null;`
    : `  const primaryCacheWiring = null;`;

  const returnExpression = `{
    databases,
    databaseConnectionStrings,
    caches,
    cacheEndpoints,
    cacheWiring,
    primaryDatabase,
    primaryCache,
    primaryCacheEndpoint,
    primaryCacheWiring,
  }`;

  return renderTemplateAssetSync(
    TEMPLATE_KEYS.generatedAspireHelpersGenerateRegisterInfrastructure1,
    {
      __slot0__: String(fileHeader('register-infrastructure.mts')),
      __slot1__: String(SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS),
      __slot2__: String(
        sdkValueImports.length > 0
          ? `import { ${
            sdkValueImports.join(', ')
          } } from '${SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS}';`
          : '',
      ),
      __slot3__: String(
        `import { ${
          compatImports.join(', ')
        } } from '${SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT}';`,
      ),
      __slot4__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
      __slot5__: String(
        dbBlocks.length > 0 ? dbBlocks.join('\n\n') : '  // No databases configured',
      ),
      __slot6__: String(
        cacheBlocks.length > 0 ? cacheBlocks.join('\n\n') : '  // No caches configured',
      ),
      __slot7__: String(primaryDbLine),
      __slot8__: String(primaryCacheLine),
      __slot9__: String(primaryCacheEndpointLine),
      __slot10__: String(primaryCacheWiringLine),
      __slot11__: String(
        hasPersistentContainerDatabase
          ? `  const isolatedStart = (await builder.getConfiguration()\n    .getConfigValue('DcpPublisher:RandomizePorts'))?.toLowerCase() === 'true';`
          : '',
      ),
      asyncKeyword: usesAwait ? 'async ' : '',
      builderParam: usesBuilder ? 'builder' : '_builder',
      appHostDirParam: usesAppHostDir ? 'appHostDir' : '_appHostDir',
      returnStatement: usesAwait
        ? `  return ${returnExpression};`
        : `  return Promise.resolve(${returnExpression});`,
    },
  );
}

function needsPostgresCredentialReadiness(
  entry: RegisterInfrastructureOptions['databases'][string],
): boolean {
  return entry.Engine === 'Postgres' && (entry.Mode ?? 'Container') === 'Container';
}

function usesResolvedDataPath(
  dbEntries: ReadonlyArray<readonly [string, RegisterInfrastructureOptions['databases'][string]]>,
  cacheEntries: ReadonlyArray<readonly [string, CacheEntry]>,
): boolean {
  return dbEntries.some(([, entry]) =>
    entry.Engine === 'Sqlite' ||
    ((entry.Mode ?? 'Container') === 'Container' && entry.DataPath !== undefined)
  ) || cacheEntries.some(([, entry]) =>
    entry.DataPath !== undefined &&
    !['External', 'Local'].includes(entry.Mode ?? 'Container')
  );
}

/**
 * Emits the `<name>_auth` check beside the listener check. A listener accepts the socket
 * before the server accepts the login, so only this check proves consumers can connect.
 * The password travels as the in-memory value already given to the secret parameter —
 * Aspire ATS rejects `ReferenceExpression.getValue()` inside AppHost callbacks.
 */
function appendPostgresCredentialReadinessLines(lines: string[], id: string, name: string): void {
  const healthCheckKey = `${name}_auth`;
  lines.push(
    `  builder.addHealthCheck(${
      JSON.stringify(healthCheckKey)
    }, createPostgresCredentialReadinessCheck({`,
  );
  lines.push(`    endpoint: () => ${id}_server.getEndpoint('tcp'),`);
  lines.push(`    password: ${id}_password_value,`);
  lines.push(`  }));`);
  lines.push(`  await ${id}_server.withHealthCheck(${JSON.stringify(healthCheckKey)});`);
}
