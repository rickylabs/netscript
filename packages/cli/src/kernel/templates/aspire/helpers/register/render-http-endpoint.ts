/**
 * @module
 *
 * Renders the `withHttpEndpoint(...)` options object for a generated Aspire
 * resource registration.
 *
 * Aspire's `port` is the **host** (proxy) port, not the port the process binds.
 * A pinned host port is a machine-global reservation that `aspire start
 * --isolated` cannot randomise away, so two workspaces scaffolded from the same
 * template collide by construction. Omitting it lets Aspire allocate both the
 * host port and the target port and inject the target port through `PORT`,
 * which every scaffolded entrypoint already reads.
 *
 * Pinning is therefore opt-in: a resource pins a host port only when its config
 * entry carries `HostPort` (or the deprecated `Port` alias).
 */

import { RESOURCE_DEFAULTS } from '@netscript/aspire/constants';
import type { HostPortEntry } from '@netscript/aspire/types';

/**
 * Resolves the host port a config entry pins, preferring `HostPort` over the
 * deprecated `Port` alias. Returns `undefined` when the entry pins nothing.
 */
export function resolveHostPort(entry: HostPortEntry): number | undefined {
  return entry.HostPort ?? entry.Port;
}

/**
 * Renders the `withHttpEndpoint(...)` argument for a resource entry — with a
 * `port` only when the entry pins one.
 *
 * @param entry - Config entry that may carry `HostPort` or the `Port` alias
 * @returns Source text of the options object, e.g. `{ env: 'PORT' }`
 */
export function renderHttpEndpointOptions(entry: HostPortEntry): string {
  const hostPort = resolveHostPort(entry);
  const env = `env: '${RESOURCE_DEFAULTS.PortEnvVar}'`;
  return hostPort === undefined ? `{ ${env} }` : `{ port: ${hostPort}, ${env} }`;
}

/**
 * Renders a complete `.withHttpEndpoint(...)` call for a resource entry.
 *
 * @param entry - Config entry that may carry `HostPort` or the `Port` alias
 * @returns Source text of the call, without a leading dot-chain indent
 */
export function renderHttpEndpointCall(entry: HostPortEntry): string {
  return `withHttpEndpoint(${renderHttpEndpointOptions(entry)})`;
}
