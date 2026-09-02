/**
 * Auth plugin service initialization.
 *
 * @module
 */

import type { PluginServiceContext } from '@netscript/plugin/sdk';
import type { WatchableKv } from '@netscript/kv';
import {
  type AuthServiceAppsettings,
  createAuthServiceBackendRegistry,
} from './backend-registry.ts';
import type { ResolvedAuthBackendRegistry } from '@netscript/plugin-auth-core/ports';

/** Auth plugin service context with the declared auth appsettings seam. */
export interface AuthPluginServiceContext extends PluginServiceContext {
  /** Host-provided appsettings contribution for the auth runtime-config topic. */
  readonly appsettings?: AuthServiceAppsettings;
}

/** Resolve and construct the auth backend registry from host service context. */
export async function initializeAuthService(
  ctx: PluginServiceContext,
  dbClient?: unknown,
): Promise<ResolvedAuthBackendRegistry> {
  const kv = watchableKv(ctx.kv);
  return await createAuthServiceBackendRegistry({
    env: { ...Deno.env.toObject(), ...ctx.env },
    appsettings: serviceAppsettings(ctx),
    dbClient,
    kv,
  });
}

function serviceAppsettings(ctx: PluginServiceContext): AuthServiceAppsettings | undefined {
  if (ctx.appsettings === undefined) return undefined;
  return isAuthServiceAppsettings(ctx.appsettings) ? ctx.appsettings : undefined;
}

function isAuthServiceAppsettings(value: unknown): value is AuthServiceAppsettings {
  if (typeof value !== 'object' || value === null) return false;
  return isAuthSettingsGroup(Reflect.get(value, 'auth'), 'lower') &&
    isAuthSettingsGroup(Reflect.get(value, 'Auth'), 'upper');
}

function isAuthSettingsGroup(value: unknown, style: 'lower' | 'upper'): boolean {
  if (value === undefined) return true;
  if (typeof value !== 'object' || value === null) return false;
  const backendKey = style === 'lower' ? 'backend' : 'Backend';
  const auditKey = style === 'lower' ? 'audit' : 'Audit';
  const saltKey = style === 'lower' ? 'salt' : 'Salt';
  const environmentKey = style === 'lower' ? 'environment' : 'Environment';
  return optionalString(Reflect.get(value, backendKey)) &&
    isAuditSettings(Reflect.get(value, auditKey), saltKey) &&
    isStringRecord(Reflect.get(value, environmentKey));
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isAuditSettings(value: unknown, saltKey: 'salt' | 'Salt'): boolean {
  return value === undefined ||
    (typeof value === 'object' && value !== null && optionalString(Reflect.get(value, saltKey)));
}

function isStringRecord(value: unknown): boolean {
  if (value === undefined) return true;
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value).every((entry) => typeof entry === 'string');
}

function watchableKv(value: unknown): WatchableKv {
  if (isWatchableKv(value)) {
    return value;
  }
  throw new TypeError('Auth service requires a WatchableKv-compatible host context.');
}

function isWatchableKv(value: unknown): value is WatchableKv {
  return (
    typeof value === 'object' && value !== null &&
    'get' in value && typeof value.get === 'function' &&
    'has' in value && typeof value.has === 'function' &&
    'set' in value && typeof value.set === 'function' &&
    'delete' in value && typeof value.delete === 'function' &&
    'list' in value && typeof value.list === 'function' &&
    'close' in value && typeof value.close === 'function' &&
    Symbol.asyncDispose in value && typeof value[Symbol.asyncDispose] === 'function' &&
    'watch' in value && typeof value.watch === 'function' &&
    'watchPrefix' in value && typeof value.watchPrefix === 'function' &&
    'supportsWatch' in value && typeof value.supportsWatch === 'boolean'
  );
}
