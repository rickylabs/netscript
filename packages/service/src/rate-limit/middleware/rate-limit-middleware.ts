/** Rate-limit stage on the existing service middleware seam. @module */
import type { ServiceEnvironment, ServiceMiddleware } from '../../types.ts';
import { createPackageLogger, type Logger } from '@netscript/logger';
import { rateLimitWindow } from '../domain/rate-limit.ts';
import { rateLimitAddressKey, resolveServiceClientAddress } from './client-address.ts';
import type { ServiceRateLimitOptions } from './options.ts';

const RATE_LIMIT_LOGGER = createPackageLogger('service');

/**
 * Creates route-scoped middleware returning JSON 429 and whole-second Retry-After.
 * Paths are exact, or end in `/*` to select a subtree including its root. Unmatched
 * requests perform no store IO. Selected routes share the quota of each key.
 * Custom keys override address resolution; absent socket metadata shares `unknown`.
 *
 * @param options - Routes, fixed-window quota, store, and optional client key/clock.
 * @returns Middleware that reserves a slot before calling the next stage.
 * @example
 * ```ts
 * import { createService } from '@netscript/service';
 * import { createMemoryRateLimitStore, createRateLimitMiddleware } from '@netscript/service/rate-limit';
 * const app = createService({}, { name: 'device' })
 *   .use(createRateLimitMiddleware({ routes: ['/device/*'], limit: 5,
 *     windowMs: 60_000, store: createMemoryRateLimitStore() }))
 *   .route('post', '/device/start', (c) => c.json({ started: true }))
 *   .build();
 * ```
 */
export function createRateLimitMiddleware(options: ServiceRateLimitOptions): ServiceMiddleware {
  const { limit, windowMs, store, key, trustProxy } = options;
  rateLimitWindow({ key: '', limit, windowMs, now: 0 });
  const ipv6Prefix = options.ipv6Prefix ?? 64;
  if (!Number.isInteger(ipv6Prefix) || ipv6Prefix < 0 || ipv6Prefix > 128) {
    throw new RangeError('Rate-limit ipv6Prefix must be an integer from 0 to 128');
  }
  let warnedMissingPeer = false;
  const now = options.now ?? Date.now;
  const routes = options.routes.map((route) => {
    if (
      !route.startsWith('/') || /[?#]/.test(route) ||
      (route.includes('*') && (!route.endsWith('/*') || route.indexOf('*') !== route.length - 1))
    ) {
      throw new TypeError('Rate-limit routes must be exact paths or end in /*');
    }
    return {
      path: route.endsWith('/*') ? route.slice(0, -2) : route,
      subtree: route.endsWith('/*'),
    };
  });
  if (!routes.length) throw new RangeError('Rate-limit routes must not be empty');
  return async (context, next) => {
    const path = context.req.path;
    if (
      !routes.some((route) =>
        path === route.path || (route.subtree && path.startsWith(`${route.path}/`))
      )
    ) {
      await next();
      return;
    }
    let clientKey: string;
    if (key) {
      clientKey = await key(context);
    } else {
      const address = resolveServiceClientAddress(
        context.req.raw,
        context.env as ServiceEnvironment | undefined,
        trustProxy,
      );
      if (address === undefined && !warnedMissingPeer) {
        warnedMissingPeer = true;
        const logger: Logger = context.get('logger') ?? RATE_LIMIT_LOGGER;
        logger.warn(
          'Rate limit has no socket metadata or custom key; all clients share the unknown bucket. Pass remoteAddr to fetch() or set key.',
        );
      }
      clientKey = address === undefined ? 'unknown' : rateLimitAddressKey(address, ipv6Prefix);
    }
    const decision = await store.consume({
      key: clientKey,
      limit,
      windowMs,
      now: now(),
      signal: context.req.raw.signal,
    });
    if (!decision.allowed) {
      context.header(
        'Retry-After',
        String(Math.max(1, Math.ceil((decision.resetAt - now()) / 1000))),
      );
      return context.json({ error: 'RATE_LIMITED' }, 429);
    }
    await next();
    return;
  };
}
