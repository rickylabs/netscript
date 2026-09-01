/**
 * @module templates/aspire/helpers/generate-register-infrastructure_test
 */

import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1'
import { describe, it } from 'jsr:@std/testing@^1/bdd'

import { generateRegisterInfrastructure } from '../register/generate-register-infrastructure.ts'
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts'
import { SCAFFOLD_VERSIONS } from '../../../../constants/scaffold/scaffold-versions.ts'

// `generateRegisterInfrastructure` reads templates synchronously, which requires a
// previously-awaited registry hydration. The tests exercise it directly (outside
// the CLI dispatch path), so hydrate at module load.
await DEFAULT_TEMPLATE_REGISTRY.hydrate()

function countOccurrences(value: string, needle: string): number {
  return value.split(needle).length - 1
}

function emittedHealthCheckBlock(
  output: string,
  key: string,
  resourceIdentifier: string,
): string {
  const startMarker = `builder.addHealthCheck(${JSON.stringify(key)}, async () => {`
  const endMarker = `await ${resourceIdentifier}.withHealthCheck(${JSON.stringify(key)});`
  const start = output.indexOf(startMarker)
  const end = output.indexOf(endMarker, start)
  assert(start >= 0, `missing health-check registration ${key}`)
  assert(end > start, `missing health-check attachment ${key}`)
  return output.slice(start, end + endMarker.length)
}

describe('generateRegisterInfrastructure', () => {
  it('emits live TCP listener checks for every container database engine', () => {
    const fixtures: readonly {
      readonly engine: 'Postgres' | 'Mysql' | 'Mssql'
      readonly name: string
      readonly kind: string
    }[] = [
      { engine: 'Postgres', name: 'postgres', kind: 'postgres' },
      { engine: 'Mysql', name: 'mysql', kind: 'mysql' },
      { engine: 'Mssql', name: 'mssql', kind: 'mssql' },
    ]

    for (const fixture of fixtures) {
      const output = generateRegisterInfrastructure({
        databases: {
          [fixture.name]: {
            Enabled: true,
            Engine: fixture.engine,
            Mode: 'Container',
            Persistent: false,
          },
        },
        caches: {},
      })
      const key = `${fixture.name}_listener`
      const server = 'db_0_server'
      const block = emittedHealthCheckBlock(output, key, server)

      assert(!output.includes('EndpointProperty'))
      assertStringIncludes(output, 'createListenerReadinessCheck')
      assertStringIncludes(block, `const endpoint = await ${server}.getEndpoint('tcp');`)
      assertStringIncludes(block, 'const host = await endpoint.host();')
      assertStringIncludes(block, 'const port = await endpoint.port();')
      assertStringIncludes(
        block,
        `return createListenerReadinessCheck({ kind: ${
          JSON.stringify(fixture.kind)
        }, host, port })();`,
      )
      assert(!block.toLowerCase().includes('password'))
      assert(!block.toLowerCase().includes('username'))
      assert(!block.includes('db_0_password'))
    }
  })

  it('emits live RESP checks for Redis and every Garnet runtime arm', () => {
    const fixtures: readonly {
      readonly engine: 'Redis' | 'Garnet'
      readonly name: string
      readonly mode: 'Auto' | 'Container' | 'Executable'
      readonly registrationCount: number
    }[] = [
      { engine: 'Redis', name: 'redis', mode: 'Container', registrationCount: 1 },
      { engine: 'Garnet', name: 'garnet-container', mode: 'Container', registrationCount: 1 },
      { engine: 'Garnet', name: 'garnet-executable', mode: 'Executable', registrationCount: 1 },
      { engine: 'Garnet', name: 'garnet-auto', mode: 'Auto', registrationCount: 2 },
    ]

    for (const fixture of fixtures) {
      const output = generateRegisterInfrastructure({
        databases: {},
        caches: {
          [fixture.name]: {
            Enabled: true,
            Engine: fixture.engine,
            Mode: fixture.mode,
          },
        },
      })
      const identifier = 'cache_0'
      const key = `${fixture.name}_resp`
      const block = emittedHealthCheckBlock(output, key, identifier)

      assertStringIncludes(output, 'createRespPingCheck')
      assertEquals(
        countOccurrences(output, `builder.addHealthCheck(${JSON.stringify(key)}, async () => {`),
        fixture.registrationCount,
      )
      assertStringIncludes(block, `const endpoint = await ${identifier}.getEndpoint('tcp');`)
      assertStringIncludes(block, 'const host = await endpoint.host();')
      assertStringIncludes(block, 'const port = await endpoint.port();')
      assertStringIncludes(block, 'return createRespPingCheck({ host, port })();')
      assert(!block.toLowerCase().includes('password'))
      assert(!block.toLowerCase().includes('username'))
    }
  })

  it('does not emit listener checks for SQLite, external resources, or Deno KV', () => {
    const output = generateRegisterInfrastructure({
      databases: {
        sqlite: {
          Enabled: true,
          Engine: 'Sqlite',
          Mode: 'External',
          DatabaseName: 'app.sqlite',
          Persistent: false,
        },
        external: {
          Enabled: true,
          Engine: 'Postgres',
          Mode: 'External',
          Persistent: false,
        },
      },
      caches: {
        'deno-kv': { Enabled: true, Engine: 'DenoKv', Mode: 'Container' },
        'deno-kv-auto': { Enabled: true, Engine: 'DenoKv', Mode: 'Auto' },
        external: { Enabled: true, Engine: 'Redis', Mode: 'External' },
      },
    })

    assert(!output.includes('sqlite_listener'))
    assert(!output.includes('external_listener'))
    assert(!output.includes('deno-kv_listener'))
    assert(!output.includes('deno-kv_resp'))
    assert(!output.includes('deno-kv-auto_listener'))
    assert(!output.includes('deno-kv-auto_resp'))
    assert(!output.includes('external_resp'))
  })

  it('omits database host ports by default and honors an explicit pin', () => {
    const engines: readonly ('Postgres' | 'Mysql' | 'Mssql')[] = [
      'Postgres',
      'Mysql',
      'Mssql',
    ]
    for (const engine of engines) {
      const unpinned = generateRegisterInfrastructure({
        databases: {
          database: {
            Enabled: true,
            Engine: engine,
            Mode: 'Container',
            Persistent: false,
          },
        },
        caches: {},
      })
      const pinned = generateRegisterInfrastructure({
        databases: {
          database: {
            Enabled: true,
            Engine: engine,
            Mode: 'Container',
            Port: 55_432,
            Persistent: false,
          },
        },
        caches: {},
      })

      assert(!unpinned.includes('port: 55432'))
      assertStringIncludes(pinned, 'port: 55432')
    }
  })

  it('omits Redis-compatible host ports by default and honors explicit pins', () => {
    const unpinned = generateRegisterInfrastructure({
      databases: {},
      caches: {
        redis: { Enabled: true, Engine: 'Redis', Mode: 'Container' },
      },
    })
    const pinned = generateRegisterInfrastructure({
      databases: {},
      caches: {
        garnet: { Enabled: true, Engine: 'Garnet', Mode: 'Executable', Port: 16_379 },
      },
    })

    assert(!unpinned.includes('port: 6379'))
    assertStringIncludes(pinned, 'port: 16379')
    assertStringIncludes(pinned, 'targetPort: 6379')
  })

  it('uses session lifetime for configured-persistent databases only under isolated starts', () => {
    const output = generateRegisterInfrastructure({
      databases: {
        postgres: {
          Enabled: true,
          Engine: 'Postgres',
          Mode: 'Container',
          Persistent: true,
        },
      },
      caches: {},
      primaryDatabase: 'postgres',
    })

    assertStringIncludes(
      output,
      "getConfigValue('DcpPublisher:RandomizePorts')",
    )
    assertStringIncludes(
      output,
      'isolatedStart ? ContainerLifetime.Session : ContainerLifetime.Persistent',
    )
    assertStringIncludes(
      output,
      'Isolated starts randomize ports, so a configured-persistent container must remain session-scoped.',
    )
  })

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
      'builder.addContainer("redis", "docker.io/library/redis:7")',
    )
    assertStringIncludes(
      output,
      'cacheEndpoints.set("redis", cache_0_tcpEndpoint);',
    )
    assertStringIncludes(
      output,
      'const primaryCache = caches.get("redis") ?? null;',
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
      'builder.addContainer("garnet", "ghcr.io/microsoft/garnet:1.1.10")',
    )
    assertStringIncludes(
      output,
      'cacheEndpoints.set("garnet", cache_0_tcpEndpoint);',
    )
    assertStringIncludes(
      output,
      'const primaryCacheEndpoint = cacheEndpoints.get("garnet") ?? null;',
    )
    // Garnet container builds Redis-compatible wiring (host:port + provider tag)
    // consumed once via withCacheReference.
    assertStringIncludes(
      output,
      'cache_0_hostPort = cache_0_tcpEndpoint.property(EndpointProperty.HostAndPort)',
    )
    assertStringIncludes(output, 'cacheWiring.set("garnet", {')
    assertStringIncludes(output, 'GARNET_URI: cache_0_hostPort')
    assertStringIncludes(output, 'REDIS_URI: cache_0_hostPort')
    assertStringIncludes(output, 'CACHE_PROVIDER: "garnet"')
    assertStringIncludes(
      output,
      'const primaryCacheWiring = cacheWiring.get("garnet") ?? null;',
    )
  })

  it('keeps the default Garnet container tag aligned with the executable tool pin', () => {
    const output = generateRegisterInfrastructure({
      databases: {},
      caches: {
        garnet: {
          Enabled: true,
          Engine: 'Garnet',
          Mode: 'Container',
        },
      },
    })

    assertStringIncludes(
      output,
      `builder.addContainer("garnet", "ghcr.io/microsoft/garnet:${SCAFFOLD_VERSIONS.GARNET_TOOL}")`,
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
    assert(!output.includes(`builder.addContainer("deno-kv"`))
    assert(!output.includes(`cacheEndpoints.set('deno-kv'`))
    assertStringIncludes(
      output,
      'cacheWiring.set("deno-kv", { resource: null, reference: null, env: {}, local: true });',
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

    assertStringIncludes(output, 'cache_0_token = _generateAccessToken();')
    assertStringIncludes(
      output,
      'builder.addContainer("deno-kv", "ghcr.io/denoland/denokv:0.11.0")',
    )
    assertStringIncludes(
      output,
      "withEndpoint({ name: 'http', targetPort: 4512, scheme: 'http' })",
    )
    assertStringIncludes(output, "withArgs(['--sqlite-path', '/data/denokv.sqlite', 'serve'])")
    assertStringIncludes(output, "withEnvironment('DENO_KV_ACCESS_TOKEN', cache_0_token)")
    assertStringIncludes(output, 'cacheWiring.set("deno-kv", {')
    assertStringIncludes(output, 'DENO_KV_ACCESS_TOKEN: cache_0_token')
    assertStringIncludes(output, "CACHE_PROVIDER: 'denokv'")
    // Explicit scheme-complete URL so auto-detect resolves KV Connect by env key,
    // not only via the name-bound services__kv__http__0 discovery key.
    assertStringIncludes(
      output,
      'cache_0_httpEndpoint.property(EndpointProperty.Url)',
    )
    assertStringIncludes(output, 'DENO_KV_URL: cache_0_httpUrl')
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
    assert(!output.includes('builder.addContainer("garnet"'))
    // Self-provisions the garnet-server tool manifest, then runs it via dotnet.
    assertStringIncludes(
      output,
      'cache_0_workdir = ensureGarnetToolManifest(appHostDir, "1.1.10");',
    )
    assertStringIncludes(
      output,
      "builder.addExecutable(\"garnet\", 'dotnet', cache_0_workdir, ['tool', 'run', 'garnet-server', '--port', '6379'])",
    )
    assertStringIncludes(
      output,
      "withEndpoint({ name: 'tcp', targetPort: 6379, scheme: 'tcp' })",
    )
    assertStringIncludes(
      output,
      'cache_0_hostPort = cache_0_tcpEndpoint.property(EndpointProperty.HostAndPort)',
    )
    assertStringIncludes(output, 'cacheWiring.set("garnet", {')
    assertStringIncludes(output, 'GARNET_URI: cache_0_hostPort')
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
      'ensureGarnetToolManifest(appHostDir, "1.0.61");',
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
    assertStringIncludes(output, 'let cache_0_wiring: CacheWiring;')
    assertStringIncludes(output, 'if (shouldUseContainerCache()) {')
    // Docker present → Redis-compatible Garnet container (default engine kept).
    assertStringIncludes(
      output,
      'builder.addContainer("garnet", "ghcr.io/microsoft/garnet:1.1.10")',
    )
    // Docker absent → self-provisioned Garnet dotnet-tool executable.
    assertStringIncludes(
      output,
      "builder.addExecutable(\"garnet\", 'dotnet', cache_0_workdir, ['tool', 'run', 'garnet-server', '--port', '6379'])",
    )
    assertStringIncludes(output, 'ensureGarnetToolManifest(appHostDir')
    assertStringIncludes(output, 'cacheWiring.set("garnet", cache_0_wiring);')
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

    assertStringIncludes(output, 'let cache_0_wiring: CacheWiring;')
    assertStringIncludes(output, 'if (shouldUseContainerCache()) {')
    // Docker present → DenoKv Connect container (engine-aware container branch).
    assertStringIncludes(
      output,
      'builder.addContainer("deno-kv", "ghcr.io/denoland/denokv:0.11.0")',
    )
    assertStringIncludes(output, 'cache_0_token = _generateAccessToken();')
    // Docker absent → Garnet executable cross-fallback (D6).
    assertStringIncludes(
      output,
      'builder.addExecutable("deno-kv", \'dotnet\', cache_0_workdir,',
    )
    assertStringIncludes(output, 'cacheWiring.set("deno-kv", cache_0_wiring);')
  })

  it('registers sqlite as a resolved file-backed Aspire resource', () => {
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

    assertStringIncludes(output, 'Sqlite, resolved file-backed resource')
    assertStringIncludes(output, 'builder.addParameter("sqlite", {')
    assertStringIncludes(
      output,
      'value: resolveDataPath(appHostDir, "app.sqlite", "sqlite"),',
    )
    assertStringIncludes(output, 'secret: false,')
    assert(!output.includes("builder.addConnectionString('sqlite')"))
    assertStringIncludes(output, 'databases.set("sqlite", db_0);')
    assert(!output.includes('sqlite_server.addDatabase('))
    assert(!output.includes('const sqlite_server'))
    assert(!output.includes('ContainerLifetime'))
    assert(!output.includes('ensureDatabasePassword'))
    assert(!output.includes('const isolatedStart'))
  })

  it('generates one resolved graph resource per scaffolded backing service', () => {
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
      caches: {
        'deno-kv': {
          Enabled: true,
          Engine: 'DenoKv',
          Mode: 'Container',
          DataPath: 'data/kv',
        },
      },
      primaryDatabase: 'sqlite',
      primaryCache: 'deno-kv',
    })

    assertEquals(countOccurrences(output, 'builder.addParameter("sqlite"'), 1)
    assertEquals(countOccurrences(output, 'builder.addContainer("deno-kv"'), 1)
    assert(!output.includes("builder.addConnectionString('deno-kv')"))
    assertStringIncludes(
      output,
      'cache_0_httpEndpoint.property(EndpointProperty.Url)',
    )
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

    assertStringIncludes(output, 'builder.addParameter("mssql-password", {')
    assertStringIncludes(output, "value: 'NetscriptE2e!Sql2026'")
    assertStringIncludes(output, 'secret: true')
    assertStringIncludes(output, 'builder.addSqlServer("mssql", {')
    assertStringIncludes(output, 'password: db_0_password')
    assertStringIncludes(output, ".withImage('mssql/server')")
    assertStringIncludes(output, '.withImageTag("2022-latest")')
    assertStringIncludes(output, ".withEnvironment('ACCEPT_EULA', 'Y')")
    assertStringIncludes(
      output,
      ".withEnvironment('SA_PASSWORD', 'NetscriptE2e!Sql2026')",
    )
    assertStringIncludes(
      output,
      ".withEnvironment('MSSQL_SA_PASSWORD', 'NetscriptE2e!Sql2026')",
    )
    assertStringIncludes(output, 'db_0_server.addDatabase("app-mssql-db")')
    assertStringIncludes(output, 'databases.set("mssql", db_0);')
  })

  it('persists container database credentials for resident AppHost restarts', () => {
    for (const Engine of ['Postgres', 'Mysql'] as const) {
      const name = Engine.toLowerCase()
      const output = generateRegisterInfrastructure({
        databases: { [name]: { Enabled: true, Engine, Mode: 'Container', Persistent: true } },
        caches: {},
        primaryDatabase: name,
      })

      assertStringIncludes(output, `builder.addParameter(${JSON.stringify(`${name}-password`)}, {`)
      assertStringIncludes(
        output,
        `value: ensureDatabasePassword(appHostDir, ${JSON.stringify(name)})`,
      )
      assertStringIncludes(
        output,
        `builder.${Engine === 'Postgres' ? 'addPostgres' : 'addMySql'}(${JSON.stringify(name)}, {`,
      )
      assertStringIncludes(output, 'password: db_0_password')
    }
  })
})
