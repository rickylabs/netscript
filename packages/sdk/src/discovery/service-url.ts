/**
 * Service URL discovery from browser and server environments.
 *
 * @module
 */

import {
  type BrowserEnvironment,
  createBrowserServiceEnvKey,
  createBrowserServiceShortEnvKey,
  getBrowserServiceUrl,
  getBrowserServiceUrlFromEnv,
} from './browser-env.ts';

/**
 * Supported protocols for Aspire service discovery endpoints.
 */
export type ServiceProtocol = 'http' | 'https';

/**
 * Resolved service endpoint metadata discovered from Aspire environment variables.
 */
export interface ServiceInfo {
  /** Service name. */
  name: string;
  /** HTTP endpoint URL, when configured. */
  http?: string;
  /** HTTPS endpoint URL, when configured. */
  https?: string;
}

/**
 * Server environment reader used by service discovery.
 */
export interface ServerEnvironment {
  /** Read one environment variable by key. */
  get(key: string): string | undefined;
  /** Return all environment variables when enumeration is supported. */
  toObject?(): Record<string, string>;
}

/**
 * Explicit environment sources used by the pure URL resolver.
 */
export interface ServiceUrlEnvironmentSources {
  /** Browser environment values, usually `import.meta.env`. */
  browserEnv?: BrowserEnvironment;
  /** Server environment reader, usually `Deno.env`. */
  serverEnv?: ServerEnvironment;
}

/**
 * Build the native Aspire server environment key for a service endpoint.
 */
export function createServerServiceEnvKey(
  serviceName: string,
  protocol: ServiceProtocol = 'http',
  index = 0,
): string {
  return `services__${serviceName}__${protocol}__${index}`;
}

function getDenoEnvironment(): ServerEnvironment | undefined {
  return typeof Deno !== 'undefined' ? Deno.env : undefined;
}

/**
 * Resolve a service URL from explicit browser and server environment sources.
 */
export function resolveServiceUrlFromSources(
  serviceName: string,
  protocol: ServiceProtocol = 'http',
  index = 0,
  sources: ServiceUrlEnvironmentSources = {},
): string | undefined {
  const browserUrl = getBrowserServiceUrlFromEnv(
    sources.browserEnv,
    serviceName,
    protocol,
    index,
  );
  if (browserUrl) {
    return browserUrl;
  }

  const serverEnv = sources.serverEnv;
  if (!serverEnv) {
    return undefined;
  }

  return serverEnv.get(createServerServiceEnvKey(serviceName, protocol, index));
}

/**
 * Get service URL from Aspire browser or server environment variables.
 */
export function getServiceUrl(
  serviceName: string,
  protocol: ServiceProtocol = 'http',
  index = 0,
): string {
  const browserUrl = getBrowserServiceUrl(serviceName, protocol, index);
  if (browserUrl) {
    return browserUrl;
  }

  const serverEnv = getDenoEnvironment();
  if (serverEnv) {
    const envKey = createServerServiceEnvKey(serviceName, protocol, index);
    const url = serverEnv.get(envKey);

    if (!url) {
      throw new Error(
        `Service URL not found for "${serviceName}" (${protocol}). ` +
          `Expected environment variable: ${envKey}`,
      );
    }

    return url;
  }

  const fullKey = createBrowserServiceEnvKey(serviceName, protocol, index);
  const shortKey = createBrowserServiceShortEnvKey(serviceName);
  throw new Error(
    `Service URL not found for "${serviceName}" in the browser. ` +
      `Expected import.meta.env.${fullKey} or import.meta.env.${shortKey} ` +
      `(injected by Aspire via WithConfiguredViteHttpReferences).`,
  );
}

/**
 * Get all endpoints for a service.
 */
export function getServiceInfo(serviceName: string): ServiceInfo {
  const info: ServiceInfo = { name: serviceName };

  try {
    info.http = getServiceUrl(serviceName, 'http');
  } catch {
    // HTTP endpoint not configured.
  }

  try {
    info.https = getServiceUrl(serviceName, 'https');
  } catch {
    // HTTPS endpoint not configured.
  }

  if (!info.http && !info.https) {
    throw new Error(
      `No endpoints found for service "${serviceName}". ` +
        `Check Aspire configuration in dotnet/AppHost/Program.cs`,
    );
  }

  return info;
}

/**
 * Get all available server-side Aspire service names.
 */
export function getAllServices(): string[] {
  const services = new Set<string>();
  const entries = getDenoEnvironment()?.toObject?.() ?? {};

  for (const [key] of Object.entries(entries)) {
    if (key.startsWith('services__')) {
      const parts = key.split('__');
      if (parts.length >= 2) {
        services.add(parts[1]);
      }
    }
  }

  return Array.from(services).sort();
}

/**
 * Check whether a service endpoint is available.
 */
export function isServiceAvailable(
  serviceName: string,
  protocol?: ServiceProtocol,
): boolean {
  try {
    if (protocol) {
      getServiceUrl(serviceName, protocol);
      return true;
    }

    getServiceInfo(serviceName);
    return true;
  } catch {
    return false;
  }
}
