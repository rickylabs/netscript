/**
 * Server registration for the standard query-cache invalidation edge.
 *
 * @module
 */

import type { App } from 'fresh';
import { getCacheProvider } from '@netscript/sdk/cache';
import {
  DEFAULT_QUERY_CACHE_INVALIDATION_PATH,
  type ServerQueryCacheKey,
  type ServerQueryCacheKeyPart,
} from '../../application/query/query-cache-invalidation.ts';

/** Configuration for the framework-owned server query-cache invalidation route. */
export interface FreshQueryCacheInvalidationOptions {
  /** Route path; defaults to `/_netscript/query-cache/invalidate`. */
  path?: string;
}

type QueryCacheInvalidator = (queryKey: ServerQueryCacheKey) => Promise<void>;

/** Register the JSON-only server query-cache invalidation route. */
export function registerQueryCacheInvalidationRoute<State>(
  app: App<State>,
  options: FreshQueryCacheInvalidationOptions = {},
  invalidate: QueryCacheInvalidator = async (queryKey) => {
    await getCacheProvider().invalidateQueries(queryKey);
  },
): void {
  app.post(options.path ?? DEFAULT_QUERY_CACHE_INVALIDATION_PATH, async (ctx) => {
    const origin = ctx.req.headers.get('origin');
    if (origin !== null && origin !== new URL(ctx.req.url).origin) {
      return new Response('Cross-origin invalidation is forbidden', { status: 403 });
    }

    const contentType = ctx.req.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.startsWith('application/json')) {
      return new Response('Expected application/json', { status: 415 });
    }

    let body: unknown;
    try {
      body = await ctx.req.json();
    } catch {
      return new Response('Invalid JSON body', { status: 400 });
    }

    const queryKey = readQueryKey(body);
    if (queryKey === null) {
      return new Response('Expected a non-empty primitive queryKey array', { status: 400 });
    }

    await invalidate(queryKey);
    return new Response(null, { status: 204 });
  });
}

function readQueryKey(body: unknown): ServerQueryCacheKey | null {
  if (!isRecord(body) || !Array.isArray(body.queryKey) || body.queryKey.length === 0) {
    return null;
  }

  return body.queryKey.every(isQueryKeyPart) ? body.queryKey : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isQueryKeyPart(value: unknown): value is ServerQueryCacheKeyPart {
  return value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean';
}
