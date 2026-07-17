/**
 * Validation and URL construction for native auto-update releases.
 *
 * @module
 */

import { resolveDenoReleaseTarget } from '../adapters/deno-auto-update-adapter.ts';
import { DEFAULT_RELEASE_CHANNEL } from '../domain/constants.ts';
import type {
  AutoUpdateReleaseConfig,
  AutoUpdateReleaseTarget,
  ReleaseClient,
} from '../domain/types.ts';

function requireHttpsUrl(value: string, field: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError(`${field} must be a valid HTTPS URL.`);
  }

  if (url.protocol !== 'https:') {
    throw new TypeError(`${field} must use HTTPS.`);
  }

  return url;
}

function normalizeChannel(channel: string | undefined): string {
  const normalized = channel?.trim() ?? DEFAULT_RELEASE_CHANNEL;
  if (normalized.length === 0) {
    throw new TypeError('channel must not be empty.');
  }
  return normalized;
}

function createUpdateUrl(
  baseUrl: string,
  channel: string,
  target: AutoUpdateReleaseTarget,
): string {
  const base = requireHttpsUrl(baseUrl, 'baseUrl');
  if (base.search.length > 0 || base.hash.length > 0) {
    throw new TypeError('baseUrl must not contain a query string or fragment.');
  }

  base.pathname = `${base.pathname.replace(/\/+$/, '')}/`;
  const channelSegment = encodeURIComponent(channel);
  return new URL(`${channelSegment}/${target.os}-${target.arch}`, base).href;
}

/** Create a validated release client for an explicit native target. */
export function createReleaseClientForTarget(
  config: AutoUpdateReleaseConfig,
  target: AutoUpdateReleaseTarget,
): ReleaseClient {
  const channel = normalizeChannel(config.channel);
  if (config.publicKey.trim().length === 0) {
    throw new TypeError('publicKey must not be empty.');
  }

  const manualUpdateUrl = requireHttpsUrl(config.manualUpdateUrl, 'manualUpdateUrl').href;

  return {
    channel,
    target: { ...target },
    updateUrl: createUpdateUrl(config.baseUrl, channel, target),
    publicKey: config.publicKey,
    manualUpdateUrl,
  };
}

/** Create a validated native release client for the current Deno build target. */
export function createReleaseClient(config: AutoUpdateReleaseConfig): ReleaseClient {
  return createReleaseClientForTarget(config, resolveDenoReleaseTarget());
}
