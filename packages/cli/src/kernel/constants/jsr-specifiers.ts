/**
 * JSR package specifiers used by public CLI scaffolding.
 */

/** NetScript package names that public scaffolds may import from JSR. */
export type NetscriptPackage =
  | 'aspire'
  | 'config'
  | 'contracts'
  | 'database'
  | 'fresh'
  | 'fresh-ui'
  | 'kv'
  | 'logger'
  | 'plugin'
  | 'plugin-auth-core'
  | 'auth-workos'
  | 'auth-better-auth'
  | 'auth-kv-oauth'
  | 'plugin-sagas-core'
  | 'plugin-triggers-core'
  | 'runtime-config'
  | 'sdk'
  | 'service'
  | 'telemetry'
  | 'workers';

/** Published JSR specifiers for NetScript packages. */
export const JSR_SPECIFIERS: Readonly<Record<NetscriptPackage, string>> = {
  aspire: 'jsr:@netscript/aspire@^1.0.0',
  config: 'jsr:@netscript/config@^1.0.0',
  contracts: 'jsr:@netscript/contracts@^1.0.0',
  database: 'jsr:@netscript/database@^1.0.0',
  fresh: 'jsr:@netscript/fresh@^1.0.0',
  'fresh-ui': 'jsr:@netscript/fresh-ui@^1.0.0',
  kv: 'jsr:@netscript/kv@^1.0.0',
  logger: 'jsr:@netscript/logger@^1.0.0',
  plugin: 'jsr:@netscript/plugin@^1.0.0',
  'plugin-auth-core': 'jsr:@netscript/plugin-auth-core@^1.0.0',
  'auth-workos': 'jsr:@netscript/auth-workos@^1.0.0',
  'auth-better-auth': 'jsr:@netscript/auth-better-auth@^1.0.0',
  'auth-kv-oauth': 'jsr:@netscript/auth-kv-oauth@^1.0.0',
  'plugin-sagas-core': 'jsr:@netscript/plugin-sagas-core@^1.0.0',
  'plugin-triggers-core': 'jsr:@netscript/plugin-triggers-core@^1.0.0',
  'runtime-config': 'jsr:@netscript/runtime-config@^1.0.0',
  sdk: 'jsr:@netscript/sdk@^1.0.0',
  service: 'jsr:@netscript/service@^1.0.0',
  telemetry: 'jsr:@netscript/telemetry@^1.0.0',
  workers: 'jsr:@netscript/plugin-workers-core@^1.0.0',
} as const;
