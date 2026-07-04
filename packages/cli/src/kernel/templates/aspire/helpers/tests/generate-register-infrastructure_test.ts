/**
 * @module templates/aspire/helpers/generate-register-infrastructure_test
 */

import { assert, assertStringIncludes } from 'jsr:@std/assert@^1'
import { describe, it } from 'jsr:@std/testing@^1/bdd'

import { generateRegisterInfrastructure } from '../register/generate-register-infrastructure.ts'
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts'

// `generateRegisterInfrastructure` reads templates synchronously, which requires a
// previously-awaited registry hydration. The tests exercise it directly (outside
// the CLI dispatch path), so hydrate at module load.
await DEFAULT_TEMPLATE_REGISTRY.hydrate()

describe('generateRegisterInfrastructure', () => {
  it('registers redis cache containers with endpoint wiring', () => {
    const output = generateRegisterInfrastructure({
      databases: {},
      caches: {
        redis: {
          Enabled: true,
          Engine: 'Redis',
          Mode: 'Container',
          DataPath: '.data/redis',
        },
      },
      primaryCache: 'redis',
    })

    assertStringIncludes(
      output,
      "builder.addContainer('redis', 'docker.io/library/redis:7')",
    )
    assertStringIncludes(
      output,
      "cacheEndpoints.set('redis', redis_tcpEndpoint);",
    )
    assertStringIncludes(
      output,
      "const primaryCache = caches.get('redis') ?? null;",
    )
  })

  it('registers garnet cache containers with endpoint wiring', () => {
    const output = generateRegisterInfrastructure({
      databases: {},
      caches: {
        garnet: {
          Enabled: true,
          Engine: 'Garnet',
          Mode: 'Container',
          DataPath: '.data/garnet',
        },
      },
      primaryCache: 'garnet',
    })

    assertStringIncludes(
      output,
      "builder.addContainer('garnet', 'ghcr.io/microsoft/garnet:1.1.1')",
    )
    assertStringIncludes(
      output,
      "cacheEndpoints.set('garnet', garnet_tcpEndpoint);",
    )
    assertStringIncludes(
      output,
      "const primaryCacheEndpoint = cacheEndpoints.get('garnet') ?? null;",
    )
    // Garnet container builds Redis-compatible wiring (host:port + provider tag)
    // consumed once via withCacheReference.
    assertStringIncludes(
      output,
      'garnet_hostPort = garnet_tcpEndpoint.property(EndpointProperty.HostAndPort)',
    )
    assertStringIncludes(output, "cacheWiring.set('garnet', {")
    assertStringIncludes(output, 'GARNET_URI: garnet_hostPort')
    assertStringIncludes(output, 'REDIS_URI: garnet_hostPort')
    assertStringIncludes(output, "CACHE_PROVIDER: 'garnet'")
    assertStringIncludes(
      output,
      "const primaryCacheWiring = cacheWiring.get('garnet') ?? null;",
    )
  })

  it('emits deno-kv Local cache as in-process wiring without an Aspire resource', () => {
    const output = generateRegisterInfrastructure({
      databases: {},
      caches: {
        'deno-kv': {
          Enabled: true,
          Engine: 'DenoKv',
          Mode: 'Local',
          DataPath: 'data/kv',
        },
      },
      primaryCache: 'deno-kv',
    })

    // Local mode: no container, no endpoint — consumers use in-process Deno.openKv().
    assert(!output.includes(`builder.addContainer('deno-kv'`))
    assert(!output.includes(`cacheEndpoints.set('deno-kv'`))
    assertStringIncludes(
      output,
      "cacheWiring.set('deno-kv', { resource: null, reference: null, env: {}, local: true });",
    )
  })

  it('emits deno-kv Container cache as a Deno KV Connect container with an access token', () => {
    const output = generateRegisterInfrastructure({
      databases: {},
      caches: {
        'deno-kv': {
          Enabled: true,
          Engine: 'DenoKv',
          Mode: 'Container',
          DataPath: 'data/kv',
        },
      },
      primaryCache: 'deno-kv',
    })

    assertStringIncludes(output, 'deno_kv_token = generateAccessToken();')
    assertStringIncludes(
      output,
      "builder.addContainer('deno-kv', 'ghcr.io/denoland/denokv:0.11.0')",
    )
    assertStringIncludes(
      output,
      "withEndpoint({ name: 'http', targetPort: 4512, scheme: 'http' })",
    )
    assertStringIncludes(output, "withArgs(['--sqlite-path', '/data/denokv.sqlite', 'serve'])")
    assertStringIncludes(output, "withEnvironment('DENO_KV_ACCESS_TOKEN', deno_kv_token)")
    assertStringIncludes(output, "cacheWiring.set('deno-kv', {")
    assertStringIncludes(output, 'DENO_KV_ACCESS_TOKEN: deno_kv_token')
    assertStringIncludes(output, "CACHE_PROVIDER: 'denokv'")
  })

  it('emits garnet Executable cache as a self-provisioned dotnet tool (Docker-less)', () => {
    const output = generateRegisterInfrastructure({
      databases: {},
      caches: {
        garnet: {
          Enabled: true,
          Engine: 'Garnet',
          Mode: 'Executable',
        },
      },
      primaryCache: 'garnet',
    })

    // No container in the executable arm — bare-metal dotnet tool.
    assert(!output.includes("builder.addContainer('garnet'"))
    // Self-provisions the garnet-server tool manifest, then runs it via dotnet.
    assertStringIncludes(
      output,
      "garnet_workdir = ensureGarnetToolManifest(appHostDir, '1.1.10');",
    )
    assertStringIncludes(
      output,
      "builder.addExecutable('garnet', 'dotnet', garnet_workdir, ['tool', 'run', 'garnet-server', '--port', '6379'])",
    )
    assertStringIncludes(
      output,
      "withEndpoint({ name: 'tcp', targetPort: 6379, scheme: 'tcp' })",
    )
    assertStringIncludes(
      output,
      'garnet_hostPort = garnet_tcpEndpoint.property(EndpointProperty.HostAndPort)',
    )
    assertStringIncludes(output, "cacheWiring.set('garnet', {")
    assertStringIncludes(output, 'GARNET_URI: garnet_hostPort')
    assertStringIncludes(output, "CACHE_PROVIDER: 'garnet'")
  })

  it('honors an explicit ToolVersion pin for the garnet Executable arm', () => {
    const output = generateRegisterInfrastructure({
      databases: {},
      caches: {
        garnet: {
          Enabled: true,
          Engine: 'Garnet',
          Mode: 'Executable',
          ToolVersion: '1.0.61',
        },
      },
      primaryCache: 'garnet',
    })

    assertStringIncludes(
      output,
      "ensureGarnetToolManifest(appHostDir, '1.0.61');",
    )
  })

  it('emits garnet Auto as a runtime Docker probe: Garnet container vs Garnet executable', () => {
    const output = generateRegisterInfrastructure({
      databases: {},
      caches: {
        garnet: {
          Enabled: true,
          Engine: 'Garnet',
          Mode: 'Auto',
        },
      },
      primaryCache: 'garnet',
    })

    // Runtime branch on the container-runtime probe, resolved at apphost start.
    assertStringIncludes(output, 'let garnet_wiring: CacheWiring;')
    assertStringIncludes(output, 'if (shouldUseContainerCache()) {')
    // Docker present → Redis-compatible Garnet container (default engine kept).
    assertStringIncludes(
      output,
      "builder.addContainer('garnet', 'ghcr.io/microsoft/garnet:1.1.1')",
    )
    // Docker absent → self-provisioned Garnet dotnet-tool executable.
    assertStringIncludes(
      output,
      "builder.addExecutable('garnet', 'dotnet', garnet_workdir, ['tool', 'run', 'garnet-server', '--port', '6379'])",
    )
    assertStringIncludes(output, 'ensureGarnetToolManifest(appHostDir')
    assertStringIncludes(output, "cacheWiring.set('garnet', garnet_wiring);")
    // Both branches speak Redis, so consumer wiring is provider-stable.
    assertStringIncludes(output, "CACHE_PROVIDER: 'garnet'")
  })

  it('emits deno-kv Auto with the DenoKv Connect container as the Docker branch', () => {
    const output = generateRegisterInfrastructure({
      databases: {},
      caches: {
        'deno-kv': {
          Enabled: true,
          Engine: 'DenoKv',
          Mode: 'Auto',
        },
      },
      primaryCache: 'deno-kv',
    })

    assertStringIncludes(output, 'let deno_kv_wiring: CacheWiring;')
    assertStringIncludes(output, 'if (shouldUseContainerCache()) {')
    // Docker present → DenoKv Connect container (engine-aware container branch).
    assertStringIncludes(
      output,
      "builder.addContainer('deno-kv', 'ghcr.io/denoland/denokv:0.11.0')",
    )
    assertStringIncludes(output, 'deno_kv_token = generateAccessToken();')
    // Docker absent → Garnet executable cross-fallback (D6).
    assertStringIncludes(
      output,
      "builder.addExecutable('deno-kv', 'dotnet', deno_kv_workdir,",
    )
    assertStringIncludes(output, "cacheWiring.set('deno-kv', deno_kv_wiring);")
  })

  it('skips sqlite Aspire resource registration entirely', () => {
    const output = generateRegisterInfrastructure({
      databases: {
        sqlite: {
          Enabled: true,
          Engine: 'Sqlite',
          Mode: 'External',
          DatabaseName: 'app.sqlite',
          Persistent: false,
        },
      },
      caches: {},
      primaryDatabase: 'sqlite',
    })

    assertStringIncludes(
      output,
      'Sqlite, file-backed — no Aspire resource needed',
    )
    assert(!output.includes("builder.addConnectionString('sqlite')"))
    assert(!output.includes("databases.set('sqlite', sqlite);"))
    assert(!output.includes('sqlite_server.addDatabase('))
    assert(!output.includes('const sqlite_server'))
  })

  it('registers SQL Server containers with explicit image and password policy env', () => {
    const output = generateRegisterInfrastructure({
      databases: {
        mssql: {
          Enabled: true,
          Engine: 'Mssql',
          Mode: 'Container',
          DatabaseName: 'app-mssql-db',
          Persistent: true,
          ImageTag: '2022-latest',
        },
      },
      caches: {},
      primaryDatabase: 'mssql',
    })

    assertStringIncludes(output, "builder.addParameter('mssql-password', {")
    assertStringIncludes(output, "value: 'NetscriptE2e!Sql2026'")
    assertStringIncludes(output, 'secret: true')
    assertStringIncludes(output, "builder.addSqlServer('mssql', {")
    assertStringIncludes(output, 'password: mssql_password')
    assertStringIncludes(output, ".withImage('mssql/server')")
    assertStringIncludes(output, ".withImageTag('2022-latest')")
    assertStringIncludes(output, ".withEnvironment('ACCEPT_EULA', 'Y')")
    assertStringIncludes(
      output,
      ".withEnvironment('SA_PASSWORD', 'NetscriptE2e!Sql2026')",
    )
    assertStringIncludes(
      output,
      ".withEnvironment('MSSQL_SA_PASSWORD', 'NetscriptE2e!Sql2026')",
    )
    assertStringIncludes(output, "mssql_server.addDatabase('app-mssql-db')")
    assertStringIncludes(output, "databases.set('mssql', mssql);")
  })
})
