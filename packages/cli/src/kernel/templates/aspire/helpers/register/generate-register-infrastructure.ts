/**
 * @module
 *
 * Generator for `.helpers/register-infrastructure.mts` — registers databases
 * and caches with the Aspire SDK builder. Handles engine dispatch, container
 * vs external mode, persistent lifetime, data bind mounts, and primary
 * resource resolution.
 */

import type { CacheEntry } from '@netscript/aspire/types'
import type { RegisterInfrastructureOptions } from '../types.ts'
import { fileHeader } from '../_utils.ts'
import { SCAFFOLD_ASPIRE_MODULES } from '../../../../constants/scaffold/scaffold-aspire.ts'
import { SCAFFOLD_VERSIONS } from '../../../../constants/scaffold/scaffold-versions.ts'
import { TEMPLATE_KEYS } from '../../../../assets/manifest.ts'
import { renderTemplateAssetSync } from '../../../../adapters/templates/template-asset.ts'

/** Maps database engine names to SDK builder method names. */
const DB_ENGINE_METHODS: Record<string, string> = {
  Postgres: 'addPostgres',
  Mysql: 'addMySql',
  Mssql: 'addSqlServer',
}

const MSSQL_CONTAINER_IMAGE = 'mssql/server'
const MSSQL_CONTAINER_TAG = '2022-latest'
const MSSQL_SA_PASSWORD = 'NetscriptE2e!Sql2026'

/** Default Redis-compatible cache container images. */
const CACHE_CONTAINER_IMAGES: Record<
  string,
  { readonly image: string; readonly tag: string }
> = {
  Redis: { image: 'docker.io/library/redis', tag: '7' },
  Garnet: { image: 'ghcr.io/microsoft/garnet', tag: '1.1.10' },
}

/** Default Redis-compatible TCP port. */
const CACHE_DEFAULT_PORT = 6379

/** Deno KV Connect container image (shared KV over HTTP). */
const DENOKV_CONTAINER = {
  image: 'ghcr.io/denoland/denokv',
  tag: '0.11.0',
} as const

/** Deno KV Connect HTTP port inside the container. */
const DENOKV_HTTP_PORT = 4512

/**
 * Generates the register-infrastructure.mts file content.
 *
 * @param options - Database and cache entries from parsed config
 * @returns Generated TypeScript source as a string
 */
export function generateRegisterInfrastructure(
  options: RegisterInfrastructureOptions,
): string {
  const { databases, caches, primaryDatabase, primaryCache } = options
  const dbEntries = Object.entries(databases)
  const cacheEntries = Object.entries(caches)
  const usesDenoKvContainer = cacheEntries.some(([, entry]) =>
    entry.Engine === 'DenoKv' &&
    !['External', 'Local'].includes(entry.Mode ?? 'Container')
  )
  const hasPersistentContainerDatabase = dbEntries.some(([, entry]) =>
    entry.Engine !== 'Sqlite' &&
    (entry.Mode ?? 'Container') === 'Container' &&
    entry.Persistent === true
  )
  const usesDatabaseListenerReadiness = dbEntries.some(([, entry]) =>
    ['Postgres', 'Mysql', 'Mssql'].includes(entry.Engine) &&
    (entry.Mode ?? 'Container') === 'Container'
  )
  const usesRespReadiness = cacheEntries.some(([, entry]) =>
    ['Redis', 'Garnet'].includes(entry.Engine) &&
    !['External', 'Local'].includes(entry.Mode ?? 'Container')
  )
  const sdkValueImports = [
    ...(hasPersistentContainerDatabase ? ['ContainerLifetime'] : []),
    ...(cacheEntries.some(([, entry]) => !['External', 'Local'].includes(entry.Mode ?? 'Container'))
      ? ['EndpointProperty']
      : []),
  ]
  const compatImports = [
    'type CacheWiring',
    ...(usesDatabaseListenerReadiness ? ['createEndpointListenerReadinessCheck'] : []),
    ...(usesRespReadiness ? ['createRespPingCheck'] : []),
    ...(dbEntries.some(([, entry]) =>
        ['Postgres', 'Mysql'].includes(entry.Engine) &&
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
    ...(usesResolvedDataPath(dbEntries, cacheEntries) ? ['resolveDataPath'] : []),
    ...(cacheEntries.some(([, entry]) => entry.Mode === 'Auto') ? ['shouldUseContainerCache'] : []),
  ]

  // Build database registration blocks
  const dbBlocks: string[] = []
  for (const [databaseIndex, [name, entry]] of dbEntries.entries()) {
    const id = `db_${databaseIndex}`
    const mode = entry.Mode ?? 'Container'

    if (entry.Engine === 'Sqlite') {
      const sqlitePath = entry.DataPath ?? entry.DatabaseName ?? `${name}.sqlite`
      dbBlocks.push(`  // database ${databaseIndex} (Sqlite, resolved file-backed resource)
  const ${id} = await builder.addParameter(${JSON.stringify(name)}, {
    value: resolveDataPath(appHostDir, ${JSON.stringify(sqlitePath)}, ${JSON.stringify(name)}),
    secret: false,
  });
  databases.set(${JSON.stringify(name)}, ${id});`)
      continue
    }

    if (mode === 'External') {
      dbBlocks.push(`  // database ${databaseIndex} (External)
  const ${id} = await builder.addConnectionString(${JSON.stringify(name)});
  databases.set(${JSON.stringify(name)}, ${id});
  databaseConnectionStrings.set(
    ${JSON.stringify(name)},
    async () => await builder.getConfiguration().getConnectionString(${JSON.stringify(name)}),
  );`)
      continue
    }

    const method = DB_ENGINE_METHODS[entry.Engine] ?? 'addConnectionString'
    const lines: string[] = []

    lines.push(`  // database ${databaseIndex} (Container)`)
    // TypeScript Aspire SDK: every `builder.addXxx(...)` and `.addDatabase(...)`
    // returns a ResourcePromise. The chained configuration methods
    // (`withLifetime`, `withDataBindMount`, …) are defined on the promise,
    // but the stored value passed to `.withReference(...)` later MUST be the
    // resolved resource — otherwise the runtime rejects with
    // "Argument 'source' is a Promise-like value". So we `await` the entire
    // chain here.
    if (entry.Engine === 'Postgres' || entry.Engine === 'Mysql') {
      lines.push(
        `  const ${id}_password = await builder.addParameter(${
          JSON.stringify(`${name}-password`)
        }, {`,
      )
      lines.push(`    value: ensureDatabasePassword(appHostDir, ${JSON.stringify(name)}),`)
      lines.push(`    secret: true,`)
      lines.push(`  });`)
      lines.push(`  const ${id}_server = await builder.${method}(${JSON.stringify(name)}, {`)
      if (entry.Port !== undefined) {
        lines.push(`    port: ${entry.Port},`)
      }
      lines.push(`    password: ${id}_password,`)
      lines.push(`  })`)
    } else if (entry.Engine === 'Mssql') {
      lines.push(
        `  const ${id}_password = await builder.addParameter(${
          JSON.stringify(`${name}-password`)
        }, {`,
      )
      lines.push(`    value: '${MSSQL_SA_PASSWORD}',`)
      lines.push(`    secret: true,`)
      lines.push(`  });`)
      lines.push(`  const ${id}_server = await builder.${method}(${JSON.stringify(name)}, {`)
      if (entry.Port !== undefined) {
        lines.push(`    port: ${entry.Port},`)
      }
      lines.push(`    password: ${id}_password,`)
      lines.push(`  })`)
    } else {
      lines.push(`  const ${id}_server = await builder.${method}(${JSON.stringify(name)})`)
    }

    if (entry.Persistent) {
      lines.push(
        `    // Isolated starts randomize ports, so a configured-persistent container must remain session-scoped.`,
      )
      lines.push(
        `    .withLifetime(isolatedStart ? ContainerLifetime.Session : ContainerLifetime.Persistent)`,
      )
    }
    if (entry.DataPath) {
      lines.push(
        `    .withDataBindMount(resolveDataPath(appHostDir, ${JSON.stringify(entry.DataPath)}, ${
          JSON.stringify(name)
        }))`,
      )
    }
    if (entry.Engine === 'Mssql') {
      lines.push(`    .withImage('${MSSQL_CONTAINER_IMAGE}')`)
      lines.push(
        `    .withImageTag(${JSON.stringify(entry.ImageTag ?? MSSQL_CONTAINER_TAG)})`,
      )
      lines.push(`    .withEnvironment('ACCEPT_EULA', 'Y')`)
      lines.push(`    .withEnvironment('SA_PASSWORD', '${MSSQL_SA_PASSWORD}')`)
      lines.push(
        `    .withEnvironment('MSSQL_SA_PASSWORD', '${MSSQL_SA_PASSWORD}')`,
      )
    }

    // Close the server chain with semicolon
    const lastIdx = lines.length - 1
    lines[lastIdx] = lines[lastIdx] + ';'

    if (['Postgres', 'Mysql', 'Mssql'].includes(entry.Engine)) {
      const healthCheckKey = `${name}_listener`
      lines.push(`  builder.addHealthCheck(${JSON.stringify(healthCheckKey)}, async () => {`)
      lines.push(`    return await createEndpointListenerReadinessCheck({`)
      lines.push(`      kind: ${JSON.stringify(entry.Engine.toLowerCase())},`)
      lines.push(`      endpoint: () => ${id}_server.getEndpoint('tcp'),`)
      lines.push(`    })();`)
      lines.push(`  });`)
      lines.push(`  await ${id}_server.withHealthCheck(${JSON.stringify(healthCheckKey)});`)
    }

    // Add database child resource if DatabaseName is specified
    if (entry.DatabaseName) {
      lines.push(
        `  const ${id} = await ${id}_server.addDatabase(${JSON.stringify(entry.DatabaseName)});`,
      )
    } else {
      lines.push(`  const ${id} = ${id}_server;`)
    }

    lines.push(`  databases.set(${JSON.stringify(name)}, ${id});`)
    dbBlocks.push(lines.join('\n'))
  }

  // Build cache registration blocks
  const cacheBlocks: string[] = []
  for (const [cacheIndex, [name, entry]] of cacheEntries.entries()) {
    const id = `cache_${cacheIndex}`
    const mode = entry.Mode ?? 'Container'

    // DenoKv Local — in-process Deno.openKv(), no Aspire resource.
    if (entry.Engine === 'DenoKv' && mode === 'Local') {
      cacheBlocks.push(
        `  // cache ${cacheIndex} (DenoKv, Local — in-process Deno.openKv(), no Aspire resource)\n` +
          `  cacheWiring.set(${
            JSON.stringify(name)
          }, { resource: null, reference: null, env: {}, local: true });`,
      )
      continue
    }

    // External — connection-string resource; consumer wires by reference only.
    if (mode === 'External') {
      cacheBlocks.push(`  // cache ${cacheIndex} (External)
  const ${id} = await builder.addConnectionString(${JSON.stringify(name)});
  caches.set(${JSON.stringify(name)}, ${id});
  cacheWiring.set(${
        JSON.stringify(name)
      }, { resource: ${id}, reference: ${id}, env: {}, local: false });`)
      continue
    }

    // Auto — environment-aware at apphost runtime (D5/D6). Docker present →
    // the configured container backend (DenoKv Connect for DenoKv, else the
    // Redis-compatible Garnet/Redis container). Docker absent → the Garnet
    // dotnet-tool executable (cross-fallback for the Docker-less bare-metal
    // host, #372). Both branches emit inline so the generated apphost decides
    // at `aspire start` without regeneration.
    if (mode === 'Auto') {
      const container = entry.Engine === 'DenoKv'
        ? denokvContainerSetup(id, name, entry)
        : redisGarnetContainerSetup(id, name, entry)
      const executable = garnetExecutableSetup(id, name, entry)
      const lines: string[] = []

      lines.push(
        `  // cache ${cacheIndex} (Auto — Docker container; Docker-less Garnet executable)`,
      )
      lines.push(`  let ${id}_wiring: CacheWiring;`)
      lines.push(`  if (shouldUseContainerCache()) {`)
      for (const line of container.lines) lines.push(`  ${line}`)
      lines.push(`    ${id}_wiring = ${container.wiring};`)
      lines.push(`  } else {`)
      for (const line of executable.lines) lines.push(`  ${line}`)
      lines.push(`    ${id}_wiring = ${executable.wiring};`)
      lines.push(`  }`)
      lines.push(`  cacheWiring.set(${JSON.stringify(name)}, ${id}_wiring);`)
      cacheBlocks.push(lines.join('\n'))
      continue
    }

    // DenoKv Container — Deno KV Connect over HTTP with an access token.
    if (entry.Engine === 'DenoKv') {
      const setup = denokvContainerSetup(id, name, entry)
      const lines = [
        `  // cache ${cacheIndex} (DenoKv, Container — Deno KV Connect)`,
        ...setup.lines,
        `  cacheWiring.set(${JSON.stringify(name)}, ${setup.wiring});`,
      ]
      cacheBlocks.push(lines.join('\n'))
      continue
    }

    // Garnet Executable — Docker-less self-provisioned dotnet tool (#372).
    if (entry.Engine === 'Garnet' && mode === 'Executable') {
      const setup = garnetExecutableSetup(id, name, entry)
      const lines = [
        `  // cache ${cacheIndex} (Garnet, Executable — Docker-less dotnet tool)`,
        ...setup.lines,
        `  cacheWiring.set(${JSON.stringify(name)}, ${setup.wiring});`,
      ]
      cacheBlocks.push(lines.join('\n'))
      continue
    }

    // Redis / Garnet Container — Redis-compatible TCP endpoint.
    const setup = redisGarnetContainerSetup(id, name, entry)
    const lines = [
      `  // cache ${cacheIndex} (Container)`,
      ...setup.lines,
      `  cacheWiring.set(${JSON.stringify(name)}, ${setup.wiring});`,
    ]
    cacheBlocks.push(lines.join('\n'))
  }

  // Primary resolution
  const primaryDbLine = primaryDatabase
    ? `  const primaryDatabase = databases.get(${JSON.stringify(primaryDatabase)}) ?? null;`
    : `  const primaryDatabase = null;`
  const primaryCacheLine = primaryCache
    ? `  const primaryCache = caches.get(${JSON.stringify(primaryCache)}) ?? null;`
    : `  const primaryCache = null;`
  const primaryCacheEndpointLine = primaryCache
    ? `  const primaryCacheEndpoint = cacheEndpoints.get(${JSON.stringify(primaryCache)}) ?? null;`
    : `  const primaryCacheEndpoint = null;`
  const primaryCacheWiringLine = primaryCache
    ? `  const primaryCacheWiring = cacheWiring.get(${JSON.stringify(primaryCache)}) ?? null;`
    : `  const primaryCacheWiring = null;`

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
    },
  )
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
    !['External', 'Local'].includes(entry.Mode ?? 'Container') &&
    !(entry.Engine === 'Garnet' && entry.Mode === 'Executable')
  )
}

/**
 * Emits the DenoKv Connect container setup lines (shared by the Container arm
 * and the Docker branch of the Auto arm). Returns the setup lines plus the
 * `CacheWiring` object-literal expression so callers control where it is stored
 * (direct `cacheWiring.set` vs. an Auto `let`-binding).
 */
function denokvContainerSetup(
  id: string,
  name: string,
  entry: CacheEntry,
): { lines: string[]; wiring: string } {
  const tag = entry.ImageTag ?? DENOKV_CONTAINER.tag
  const imageRef = `${DENOKV_CONTAINER.image}:${tag}`
  const lines: string[] = []

  lines.push(`  const ${id}_token = _generateAccessToken();`)
  lines.push(
    `  const ${id} = await builder.addContainer(${JSON.stringify(name)}, ${
      JSON.stringify(imageRef)
    })`,
  )
  lines.push(
    `    .withEndpoint({ name: 'http', targetPort: ${DENOKV_HTTP_PORT}, scheme: 'http' })`,
  )
  lines.push(`    .withContainerRuntimeArgs(['--init'])`)
  lines.push(`    .withArgs(['--sqlite-path', '/data/denokv.sqlite', 'serve'])`)
  lines.push(`    .withEnvironment('DENO_KV_ACCESS_TOKEN', ${id}_token)`)
  if (entry.DataPath) {
    lines.push(
      `    .withBindMount(resolveDataPath(appHostDir, ${JSON.stringify(entry.DataPath)}, ${
        JSON.stringify(name)
      }), '/data')`,
    )
  }

  const lastIdx = lines.length - 1
  lines[lastIdx] = lines[lastIdx] + ';'

  lines.push(`  const ${id}_httpEndpoint = await ${id}.getEndpoint('http');`)
  lines.push(
    `  const ${id}_httpUrl = ${id}_httpEndpoint.property(EndpointProperty.Url);`,
  )
  lines.push(`  caches.set(${JSON.stringify(name)}, ${id});`)
  lines.push(`  cacheEndpoints.set(${JSON.stringify(name)}, ${id}_httpEndpoint);`)

  // DENO_KV_URL is injected explicitly (scheme-complete, via EndpointProperty.Url)
  // so the consumer's autoDetectProvider() resolves the KV Connect URL from an env
  // key regardless of the resource name — mirroring how the Redis/Garnet arms inject
  // GARNET_URI/REDIS_URI. Without it, auto-detect only finds a DenoKv URL when the
  // resource is literally named 'kv' (services__kv__http__0), silently falling back
  // to in-process Deno.openKv() otherwise.
  const wiring =
    `{ resource: ${id}, reference: ${id}_httpEndpoint, env: { DENO_KV_URL: ${id}_httpUrl, DENO_KV_ACCESS_TOKEN: ${id}_token, CACHE_PROVIDER: 'denokv' }, local: false }`
  return { lines, wiring }
}

/**
 * Emits the Garnet executable setup lines (shared by the Executable arm and the
 * Docker-less branch of the Auto arm). Runs `garnet-server` as a self-provisioned
 * dotnet tool (no Docker) over a Redis-compatible TCP endpoint. The tool
 * version pins from `CacheEntry.ToolVersion`, falling back to the scaffold pin.
 */
function garnetExecutableSetup(
  id: string,
  name: string,
  entry: CacheEntry,
): { lines: string[]; wiring: string } {
  const version = entry.ToolVersion ?? SCAFFOLD_VERSIONS.GARNET_TOOL
  const lines: string[] = []

  lines.push(
    `  const ${id}_workdir = ensureGarnetToolManifest(appHostDir, ${JSON.stringify(version)});`,
  )
  lines.push(
    `  const ${id} = await builder.addExecutable(${
      JSON.stringify(name)
    }, 'dotnet', ${id}_workdir, ['tool', 'run', 'garnet-server', '--port', '${CACHE_DEFAULT_PORT}'])`,
  )
  lines.push(
    `    .withEndpoint(${cacheEndpointOptions(entry.Port)});`,
  )
  lines.push(`  const ${id}_tcpEndpoint = await ${id}.getEndpoint('tcp');`)
  lines.push(
    `  const ${id}_hostPort = ${id}_tcpEndpoint.property(EndpointProperty.HostAndPort);`,
  )
  if (['Redis', 'Garnet'].includes(entry.Engine)) {
    appendRespReadinessLines(lines, id, name)
  }
  lines.push(`  caches.set(${JSON.stringify(name)}, ${id});`)
  lines.push(`  cacheEndpoints.set(${JSON.stringify(name)}, ${id}_tcpEndpoint);`)

  const wiring =
    `{ resource: ${id}, reference: ${id}_tcpEndpoint, env: { GARNET_URI: ${id}_hostPort, REDIS_URI: ${id}_hostPort, CACHE_PROVIDER: 'garnet' }, local: false }`
  return { lines, wiring }
}

/**
 * Emits the Redis-compatible container setup lines for Redis/Garnet (shared by
 * the Container arm and the Docker branch of a Redis/Garnet Auto arm). Wires a
 * `GARNET_URI`/`REDIS_URI` host:port pair plus the provider tag.
 */
function redisGarnetContainerSetup(
  id: string,
  name: string,
  entry: CacheEntry,
): { lines: string[]; wiring: string } {
  const image = CACHE_CONTAINER_IMAGES[entry.Engine] ??
    CACHE_CONTAINER_IMAGES.Redis
  const tag = entry.ImageTag ?? image.tag
  const imageRef = `${image.image}:${tag}`
  const provider = entry.Engine === 'Garnet' ? 'garnet' : 'redis'
  const lines: string[] = []

  lines.push(
    `  const ${id} = await builder.addContainer(${JSON.stringify(name)}, ${
      JSON.stringify(imageRef)
    })`,
  )
  lines.push(`    .withEndpoint(${cacheEndpointOptions(entry.Port)})`)
  if (entry.DataPath) {
    lines.push(
      `    .withBindMount(resolveDataPath(appHostDir, ${JSON.stringify(entry.DataPath)}, ${
        JSON.stringify(name)
      }), '/data')`,
    )
  }

  const lastIdx = lines.length - 1
  lines[lastIdx] = lines[lastIdx] + ';'

  lines.push(`  const ${id}_tcpEndpoint = await ${id}.getEndpoint('tcp');`)
  lines.push(
    `  const ${id}_hostPort = ${id}_tcpEndpoint.property(EndpointProperty.HostAndPort);`,
  )
  if (['Redis', 'Garnet'].includes(entry.Engine)) {
    appendRespReadinessLines(lines, id, name)
  }
  lines.push(`  caches.set(${JSON.stringify(name)}, ${id});`)
  lines.push(`  cacheEndpoints.set(${JSON.stringify(name)}, ${id}_tcpEndpoint);`)

  const wiring =
    `{ resource: ${id}, reference: ${id}_tcpEndpoint, env: { GARNET_URI: ${id}_hostPort, REDIS_URI: ${id}_hostPort, CACHE_PROVIDER: ${
      JSON.stringify(provider)
    } }, local: false }`
  return { lines, wiring }
}

function appendRespReadinessLines(lines: string[], id: string, name: string): void {
  const healthCheckKey = `${name}_resp`
  lines.push(`  builder.addHealthCheck(${JSON.stringify(healthCheckKey)}, async () => {`)
  lines.push(`    const endpoint = await ${id}.getEndpoint('tcp');`)
  lines.push(`    const host = await endpoint.host();`)
  lines.push(`    const port = await endpoint.port();`)
  lines.push(`    return createRespPingCheck({ host, port })();`)
  lines.push(`  });`)
  lines.push(`  await ${id}.withHealthCheck(${JSON.stringify(healthCheckKey)});`)
}

function cacheEndpointOptions(port: number | undefined): string {
  const options = [
    "name: 'tcp'",
    `targetPort: ${CACHE_DEFAULT_PORT}`,
    "scheme: 'tcp'",
  ]
  if (port !== undefined) {
    options.unshift(`port: ${port}`)
  }
  return `{ ${options.join(', ')} }`
}
