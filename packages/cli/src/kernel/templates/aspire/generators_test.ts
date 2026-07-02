/**
 * @module templates/aspire/generators_test
 *
 * Unit tests for Aspire Tier 1 generators.
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd'
import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1'
import { generateGlobalJson } from './generate-global-json.ts'
import { generateAspireConfig } from './generate-aspire-config.ts'
import { generateAppsettings } from './generate-appsettings.ts'
import { SCAFFOLD_VERSIONS } from '../../constants/scaffold/scaffold-versions.ts'

// ============================================================================
// generateGlobalJson
// ============================================================================

describe('generateGlobalJson', () => {
  it('should produce valid JSON with SDK version', () => {
    const output = generateGlobalJson()
    const config = JSON.parse(output)
    assertEquals(config.sdk.version, SCAFFOLD_VERSIONS.DOTNET_SDK)
  })

  it('should set rollForward to latestMinor', () => {
    const config = JSON.parse(generateGlobalJson())
    assertEquals(config.sdk.rollForward, 'latestMinor')
  })

  it('should allow prereleases', () => {
    const config = JSON.parse(generateGlobalJson())
    assertEquals(config.sdk.allowPrerelease, true)
  })

  it('should accept custom SDK version', () => {
    const output = generateGlobalJson({ sdkVersion: '9.0.0' })
    const config = JSON.parse(output)
    assertEquals(config.sdk.version, '9.0.0')
  })

  it('should end with trailing newline', () => {
    assert(generateGlobalJson().endsWith('\n'))
  })

  it('keeps the root and sdk key ordering stable', () => {
    const config = JSON.parse(generateGlobalJson())

    assertEquals(Object.keys(config), ['sdk'])
    assertEquals(Object.keys(config.sdk), [
      'version',
      'rollForward',
      'allowPrerelease',
    ])
  })
})

// ============================================================================
// generateAspireConfig
// ============================================================================

describe('generateAspireConfig', () => {
  it('should produce valid JSON with appHostPath', () => {
    const output = generateAspireConfig()
    const config = JSON.parse(output)
    assertEquals(config.appHostPath, 'dotnet/AppHost')
  })

  it('should accept custom appHostPath', () => {
    const output = generateAspireConfig({ appHostPath: 'infra/Host' })
    const config = JSON.parse(output)
    assertEquals(config.appHostPath, 'infra/Host')
  })

  it('should end with trailing newline', () => {
    assert(generateAspireConfig().endsWith('\n'))
  })

  it('keeps the minimal config shape stable', () => {
    const config = JSON.parse(generateAspireConfig())

    assertEquals(Object.keys(config), ['appHostPath'])
  })
})

// ============================================================================
// generateAppsettings
// ============================================================================

describe('generateAppsettings', () => {
  it('should produce valid JSON with NetScript config root', () => {
    const config = JSON.parse(generateAppsettings())
    assert(config.NetScript, 'top-level NetScript key')
    assertEquals(typeof config.NetScript.Name, 'string')
    assert(config.NetScript.Otel, 'NetScript.Otel block')
    assert(config.NetScript.Apps, 'NetScript.Apps block')
  })

  it('should include OTEL endpoint under NetScript.Otel', () => {
    const config = JSON.parse(generateAppsettings())
    assertStringIncludes(config.NetScript.Otel.HttpEndpoint, 'localhost')
  })

  it('should accept custom appPort and otelPort', () => {
    const config = JSON.parse(
      generateAppsettings({
        appName: 'dashboard',
        appPort: 9000,
        otelPort: 9001,
      }),
    )
    assertEquals(config.NetScript.Apps.dashboard.Port, 9000)
    assertStringIncludes(config.NetScript.Otel.HttpEndpoint, '9001')
  })

  it('should omit Databases/PrimaryDatabase when dbEngine is none', () => {
    const config = JSON.parse(generateAppsettings({ dbEngine: 'none' }))
    assertEquals(config.NetScript.Databases, {})
    assertEquals(config.NetScript.PrimaryDatabase, undefined)
  })

  it('defaults shared cache to redis', () => {
    const config = JSON.parse(generateAppsettings())

    assertEquals(config.NetScript.PrimaryCache, 'redis')
    assertEquals(config.NetScript.Cache.redis.Engine, 'Redis')
    assertEquals(config.NetScript.Cache.redis.Mode, 'Container')
    assertEquals(config.NetScript.Cache.redis.DataPath, '.data/redis')
  })

  it('can omit shared cache emission', () => {
    const config = JSON.parse(generateAppsettings({ cache: false }))

    assertEquals(config.NetScript.PrimaryCache, undefined)
    assertEquals(config.NetScript.Cache, {})
  })

  it('emits garnet cache appsettings when selected', () => {
    const config = JSON.parse(generateAppsettings({ cacheBackend: 'garnet' }))

    assertEquals(config.NetScript.PrimaryCache, 'garnet')
    assertEquals(config.NetScript.Cache.garnet.Engine, 'Garnet')
    assertEquals(config.NetScript.Cache.garnet.DataPath, '.data/garnet')
  })

  it('emits deno-kv cache appsettings when selected', () => {
    const config = JSON.parse(generateAppsettings({ cacheBackend: 'deno-kv' }))

    assertEquals(config.NetScript.PrimaryCache, 'deno-kv')
    assertEquals(config.NetScript.Cache['deno-kv'].Engine, 'DenoKv')
    assertEquals(config.NetScript.Cache['deno-kv'].Mode, 'External')
    assertEquals(config.NetScript.Cache['deno-kv'].DataPath, 'data/kv')
  })

  it('should register Postgres engine when dbEngine is postgres', () => {
    const config = JSON.parse(
      generateAppsettings({ name: 'alpha-app', dbEngine: 'postgres' }),
    )
    assertEquals(config.NetScript.PrimaryDatabase, 'postgres')
    assertEquals(config.NetScript.Databases.postgres.Engine, 'Postgres')
    assertEquals(config.NetScript.Databases.postgres.Mode, 'Container')
    assertEquals(config.NetScript.Databases.postgres.Persistent, true)
    assertEquals(config.NetScript.Databases.postgres.DataPath, '.data/postgres')
    assertEquals(config.NetScript.Tools['prisma-studio'].Enabled, true)
    assertEquals(config.NetScript.Tools['prisma-studio'].TaskName, 'db:studio')
    assertEquals(config.NetScript.Tools['prisma-studio'].Database, 'postgres')
  })

  it('should register Sqlite engine without Mode', () => {
    const config = JSON.parse(
      generateAppsettings({ name: 'alpha-app', dbEngine: 'sqlite' }),
    )
    assertEquals(config.NetScript.PrimaryDatabase, 'sqlite')
    assertEquals(config.NetScript.Databases.sqlite.Engine, 'Sqlite')
    assertEquals(config.NetScript.Databases.sqlite.Mode, undefined)
  })

  it('should register MSSQL engine with matching Aspire password parameter', () => {
    const config = JSON.parse(
      generateAppsettings({ name: 'alpha-app', dbEngine: 'mssql' }),
    )
    assertEquals(config.Parameters['mssql-password'], 'NetscriptE2e!Sql2026')
    assertEquals(config.NetScript.PrimaryDatabase, 'mssql')
    assertEquals(config.NetScript.Databases.mssql.Engine, 'Mssql')
    assertEquals(config.NetScript.Databases.mssql.Mode, 'Container')
    assertEquals(config.NetScript.Databases.mssql.Persistent, true)
  })

  it('should include example service when provided', () => {
    const config = JSON.parse(
      generateAppsettings({
        name: 'alpha-app',
        service: { name: 'users', port: 3000 },
      }),
    )
    assertEquals(config.NetScript.Services.users.Port, 3000)
    assertEquals(config.NetScript.Services.users.Runtime, 'deno')
    assertEquals(config.NetScript.Services.users.Entrypoint, 'src/main.ts')
  })

  it('should produce an empty Services block when no service provided', () => {
    const config = JSON.parse(generateAppsettings())
    assertEquals(config.NetScript.Services, {})
  })

  it('should omit Prisma Studio when no database is configured', () => {
    const config = JSON.parse(generateAppsettings({ dbEngine: 'none' }))
    assertEquals(config.NetScript.Tools, {})
  })

  it('should end with trailing newline', () => {
    assert(generateAppsettings().endsWith('\n'))
  })

  it('keeps the default NetScript key ordering stable', () => {
    const config = JSON.parse(generateAppsettings())

    assertEquals(Object.keys(config), ['NetScript'])
    assertEquals(Object.keys(config.NetScript), [
      'Name',
      'Version',
      'Otel',
      'PrimaryCache',
      'Databases',
      'Cache',
      'Services',
      'Plugins',
      'BackgroundProcessors',
      'Apps',
      'Tools',
    ])
    assertEquals(Object.keys(config.NetScript.Apps), ['dashboard'])
  })

  it('keeps service + postgres sections structurally stable', () => {
    const config = JSON.parse(generateAppsettings({
      name: 'alpha-app',
      appName: 'dashboard',
      service: { name: 'users', port: 3000 },
      dbEngine: 'postgres',
    }))

    assertEquals(Object.keys(config.NetScript), [
      'Name',
      'Version',
      'Otel',
      'PrimaryDatabase',
      'PrimaryCache',
      'Databases',
      'Cache',
      'Services',
      'Plugins',
      'BackgroundProcessors',
      'Apps',
      'Tools',
    ])
    assertEquals(Object.keys(config.NetScript.Databases.postgres), [
      'Engine',
      'Mode',
      'DatabaseName',
      'Persistent',
      'DataPath',
    ])
    assertEquals(Object.keys(config.NetScript.Services), ['users'])
    assertEquals(Object.keys(config.NetScript.Apps), ['dashboard'])
    assertEquals(Object.keys(config.NetScript.Tools['prisma-studio']), [
      'Enabled',
      'TaskName',
      'Database',
      'Description',
    ])
  })
})
