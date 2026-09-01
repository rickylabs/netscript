/**
 * Browser service-discovery environment lookup.
 *
 * @module
 */

import type { ServiceProtocol } from './service-url.ts';

/**
 * Environment bag exposed by browser bundlers such as Vite.
 */
export type BrowserEnvironment = Record<string, unknown> | undefined;

// Contract source: packages/aspire/src/application/build-vite-env-var-name.ts.
// The cross-package discovery test pins this exact identifier-segment rule.
function normalizeViteIdentifierSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Build the Aspire-compatible browser environment key for a service endpoint.
 */
export function createBrowserServiceEnvKey(
  serviceName: string,
  protocol: ServiceProtocol = 'http',
  index = 0,
): string {
  const normalizedServiceName = normalizeViteIdentifierSegment(serviceName);
  return `VITE_services__${normalizedServiceName}__${protocol}__${index}`;
}

/**
 * Build the shorthand browser environment key for a service endpoint.
 */
export function createBrowserServiceShortEnvKey(serviceName: string): string {
  return `VITE_${normalizeViteIdentifierSegment(serviceName).toUpperCase()}_URL`;
}

/**
 * Read a service URL from a provided browser environment bag.
 */
export function getBrowserServiceUrlFromEnv(
  env: BrowserEnvironment,
  serviceName: string,
  protocol: ServiceProtocol = 'http',
  index = 0,
): string | undefined {
  if (!env) {
    return undefined;
  }

  const fullKey = createBrowserServiceEnvKey(serviceName, protocol, index);
  const fullUrl = env[fullKey];
  if (typeof fullUrl === 'string' && fullUrl.length > 0) {
    return fullUrl;
  }

  const shortKey = createBrowserServiceShortEnvKey(serviceName);
  const shortUrl = env[shortKey];
  return typeof shortUrl === 'string' && shortUrl.length > 0 ? shortUrl : undefined;
}

/**
 * Read a service URL from `import.meta.env` when a browser bundler exposes it.
 */
export function getBrowserServiceUrl(
  serviceName: string,
  protocol: ServiceProtocol = 'http',
  index = 0,
): string | undefined {
  try {
    const env = (import.meta as ImportMeta & { readonly env?: BrowserEnvironment }).env;
    return getBrowserServiceUrlFromEnv(env, serviceName, protocol, index);
  } catch {
    return undefined;
  }
}
