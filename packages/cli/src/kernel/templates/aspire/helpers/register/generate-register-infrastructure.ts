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
import { fileHeader, safeIdentifier } from '../_utils.ts'
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
  Garnet: { image: 'ghcr.io/microsoft/garnet', tag: '1.1.1' },
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

  // Build database registration blocks
  const dbBlocks: string[] = []
  for (const [name, entry] of dbEntries) {
    const id = safeIdentifier(name)
    const mode = entry.Mode ?? 'Container'

    if (entry.Engine === 'Sqlite') {
      dbBlocks.push(
        `  // ${name} (Sqlite, file-backed — no Aspire resource needed)`,
      )
      continue
    }

    if (mode === 'External') {
      dbBlocks.push(`  // ${name} (${entry.Engine}, External)
  const ${id} = await builder.addConnectionString('${name}');
  databases.set('${name}', ${id});`)
      continue
    }

    const method = DB_ENGINE_METHODS[entry.Engine] ?? 'addConnectionString'
    const lines: string[] = []

    lines.push(`  // ${name} (${entry.Engine}, Container)`)
    // TypeScript Aspire SDK: every `builder.addXxx(...)` and `.addDatabase(...)`
    // returns a ResourcePromise. The chained configuration methods
    // (`withLifetime`, `withDataBindMount`, …) are defined on the promise,
    // but the stored value passed to `.withReference(...)` later MUST be the
    // resolved resource — otherwise the runtime rejects with
    // "Argument 'source' is a Promise-like value". So we `await` the entire
    // chain here.
    if (entry.Engine === 'Mssql') {
      lines.push(
        `  const ${id}_password = await builder.addParameter('${name}-password', {`,
      )
      lines.push(`    value: '${MSSQL_SA_PASSWORD}',`)
      lines.push(`    secret: true,`)
      lines.push(`  });`)
      lines.push(`  const ${id}_server = await builder.${method}('${name}', {`)
      lines.push(`    password: ${id}_password,`)
      lines.push(`  })`)
    } else {
      lines.push(`  const ${id}_server = await builder.${method}('${name}')`)
    }

    if (entry.Persistent) {
      lines.push(`    .withLifetime(ContainerLifetime.Persistent)`)
    }
    if (entry.DataPath) {
      lines.push(
        `    .withDataBindMount(resolveDataPath(appHostDir, '${entry.DataPath}', '${name}'))`,
      )
    }
    if (entry.Engine === 'Mssql') {
      lines.push(`    .withImage('${MSSQL_CONTAINER_IMAGE}')`)
      lines.push(
        `    .withImageTag('${entry.ImageTag ?? MSSQL_CONTAINER_TAG}')`,
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

    // Add database child resource if DatabaseName is specified
    if (entry.DatabaseName) {
      lines.push(
        `  const ${id} = await ${id}_server.addDatabase('${entry.DatabaseName}');`,
      )
    } else {
      lines.push(`  const ${id} = ${id}_server;`)
    }

    lines.push(`  databases.set('${name}', ${id});`)
    dbBlocks.push(lines.join('\n'))
  }

  // Build cache registration blocks
  const cacheBlocks: string[] = []
  for (const [name, entry] of cacheEntries) {
    const id = safeIdentifier(name)
    const mode = entry.Mode ?? 'Container'

    // DenoKv Local — in-process Deno.openKv(), no Aspire resource.
    if (entry.Engine === 'DenoKv' && mode === 'Local') {
      cacheBlocks.push(
        `  // ${name} (DenoKv, Local — in-process Deno.openKv(), no Aspire resource)\n` +
          `  cacheWiring.set('${name}', { resource: null, reference: null, env: {}, local: true });`,
      )
      continue
    }

    // External — connection-string resource; consumer wires by reference only.
    if (mode === 'External') {
      cacheBlocks.push(`  // ${name} (${entry.Engine}, External)
  const ${id} = await builder.addConnectionString('${name}');
  caches.set('${name}', ${id});
  cacheWiring.set('${name}', { resource: ${id}, reference: ${id}, env: {}, local: false });`)
      continue
    }

    // DenoKv Container — Deno KV Connect over HTTP with an access token.
    if (entry.Engine === 'DenoKv') {
      const setup = denokvContainerSetup(id, name, entry)
      const lines = [
        `  // ${name} (DenoKv, Container — Deno KV Connect)`,
        ...setup.lines,
        `  cacheWiring.set('${name}', ${setup.wiring});`,
      ]
      cacheBlocks.push(lines.join('\n'))
      continue
    }

    // Garnet Executable — Docker-less self-provisioned dotnet tool (#372).
    if (entry.Engine === 'Garnet' && mode === 'Executable') {
      const setup = garnetExecutableSetup(id, name, entry)
      const lines = [
        `  // ${name} (Garnet, Executable — Docker-less dotnet tool)`,
        ...setup.lines,
        `  cacheWiring.set('${name}', ${setup.wiring});`,
      ]
      cacheBlocks.push(lines.join('\n'))
      continue
    }

    // Redis / Garnet Container — Redis-compatible TCP endpoint.
    const image = CACHE_CONTAINER_IMAGES[entry.Engine] ??
      CACHE_CONTAINER_IMAGES.Redis
    const tag = entry.ImageTag ?? image.tag
    const imageRef = `${image.image}:${tag}`
    const provider = entry.Engine === 'Garnet' ? 'garnet' : 'redis'
    const lines: string[] = []

    lines.push(`  // ${name} (${entry.Engine}, Container)`)
    lines.push(
      `  const ${id} = await builder.addContainer('${name}', '${imageRef}')`,
    )
    lines.push(`    .withEndpoint(${cacheEndpointOptions(entry.Port)})`)

    if (entry.DataPath) {
      lines.push(
        `    .withBindMount(resolveDataPath(appHostDir, '${entry.DataPath}', '${name}'), '/data')`,
      )
    }

    const lastIdx = lines.length - 1
    lines[lastIdx] = lines[lastIdx] + ';'

    lines.push(`  const ${id}_tcpEndpoint = await ${id}.getEndpoint('tcp');`)
    lines.push(
      `  const ${id}_hostPort = ${id}_tcpEndpoint.property(EndpointProperty.HostAndPort);`,
    )
    lines.push(`  caches.set('${name}', ${id});`)
    lines.push(`  cacheEndpoints.set('${name}', ${id}_tcpEndpoint);`)
    lines.push(
      `  cacheWiring.set('${name}', { resource: ${id}, reference: ${id}_tcpEndpoint, env: { GARNET_URI: ${id}_hostPort, REDIS_URI: ${id}_hostPort, CACHE_PROVIDER: '${provider}' }, local: false });`,
    )
    cacheBlocks.push(lines.join('\n'))
  }

  // Primary resolution
  const primaryDbLine = primaryDatabase
    ? `  const primaryDatabase = databases.get('${primaryDatabase}') ?? null;`
    : `  const primaryDatabase = null;`
  const primaryCacheLine = primaryCache
    ? `  const primaryCache = caches.get('${primaryCache}') ?? null;`
    : `  const primaryCache = null;`
  const primaryCacheEndpointLine = primaryCache
    ? `  const primaryCacheEndpoint = cacheEndpoints.get('${primaryCache}') ?? null;`
    : `  const primaryCacheEndpoint = null;`
  const primaryCacheWiringLine = primaryCache
    ? `  const primaryCacheWiring = cacheWiring.get('${primaryCache}') ?? null;`
    : `  const primaryCacheWiring = null;`

  return renderTemplateAssetSync(
    TEMPLATE_KEYS.generatedAspireHelpersGenerateRegisterInfrastructure1,
    {
      __slot0__: String(fileHeader('register-infrastructure.mts')),
      __slot1__: String(SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS),
      __slot2__: String(SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS),
      __slot3__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
      __slot4__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
      __slot5__: String(
        dbBlocks.length > 0
          ? dbBlocks.join('\n\n')
          : '  // No databases configured',
      ),
      __slot6__: String(
        cacheBlocks.length > 0
          ? cacheBlocks.join('\n\n')
          : '  // No caches configured',
      ),
      __slot7__: String(primaryDbLine),
      __slot8__: String(primaryCacheLine),
      __slot9__: String(primaryCacheEndpointLine),
      __slot10__: String(primaryCacheWiringLine),
    },
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

  lines.push(`  const ${id}_token = generateAccessToken();`)
  lines.push(`  const ${id} = await builder.addContainer('${name}', '${imageRef}')`)
  lines.push(
    `    .withEndpoint({ name: 'http', targetPort: ${DENOKV_HTTP_PORT}, scheme: 'http' })`,
  )
  lines.push(`    .withContainerRuntimeArgs(['--init'])`)
  lines.push(`    .withArgs(['--sqlite-path', '/data/denokv.sqlite', 'serve'])`)
  lines.push(`    .withEnvironment('DENO_KV_ACCESS_TOKEN', ${id}_token)`)
  if (entry.DataPath) {
    lines.push(
      `    .withBindMount(resolveDataPath(appHostDir, '${entry.DataPath}', '${name}'), '/data')`,
    )
  }

  const lastIdx = lines.length - 1
  lines[lastIdx] = lines[lastIdx] + ';'

  lines.push(`  const ${id}_httpEndpoint = await ${id}.getEndpoint('http');`)
  lines.push(`  caches.set('${name}', ${id});`)
  lines.push(`  cacheEndpoints.set('${name}', ${id}_httpEndpoint);`)

  const wiring =
    `{ resource: ${id}, reference: ${id}_httpEndpoint, env: { DENO_KV_ACCESS_TOKEN: ${id}_token, CACHE_PROVIDER: 'denokv' }, local: false }`
  return { lines, wiring }
}

/**
 * Emits the Garnet executable setup lines (shared by the Executable arm and the
 * Docker-less branch of the Auto arm). Runs `garnet-server` as a self-provisioned
 * dotnet tool (no Docker) over a Redis-compatible TCP endpoint (#372). The tool
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
    `  const ${id}_workdir = ensureGarnetToolManifest(appHostDir, '${version}');`,
  )
  lines.push(
    `  const ${id} = await builder.addExecutable('${name}', 'dotnet', ${id}_workdir, ['tool', 'run', 'garnet-server', '--port', '${CACHE_DEFAULT_PORT}'])`,
  )
  lines.push(
    `    .withEndpoint({ name: 'tcp', targetPort: ${CACHE_DEFAULT_PORT}, scheme: 'tcp' });`,
  )
  lines.push(`  const ${id}_tcpEndpoint = await ${id}.getEndpoint('tcp');`)
  lines.push(
    `  const ${id}_hostPort = ${id}_tcpEndpoint.property(EndpointProperty.HostAndPort);`,
  )
  lines.push(`  caches.set('${name}', ${id});`)
  lines.push(`  cacheEndpoints.set('${name}', ${id}_tcpEndpoint);`)

  const wiring =
    `{ resource: ${id}, reference: ${id}_tcpEndpoint, env: { GARNET_URI: ${id}_hostPort, REDIS_URI: ${id}_hostPort, CACHE_PROVIDER: 'garnet' }, local: false }`
  return { lines, wiring }
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
