/** NetScript CORS defaults and validation; Hono owns the HTTP middleware. */
import { cors } from 'hono/cors';
import type { CorsOptions, ServiceMiddleware } from '../types.ts';

type ResolvedCorsOptions = NonNullable<CorsOptions>;

/** Resolve and snapshot configuration once, before serving requests. */
export function resolveServiceCorsOptions(options?: CorsOptions): ResolvedCorsOptions {
  const origin = options?.origin ?? readWorkspaceOrigins();
  return {
    ...options,
    origin: Array.isArray(origin) ? [...origin] : origin,
    ...(Array.isArray(options?.allowMethods) ? { allowMethods: [...options.allowMethods] } : {}),
    ...(options?.allowHeaders ? { allowHeaders: [...options.allowHeaders] } : {}),
    ...(options?.exposeHeaders ? { exposeHeaders: [...options.exposeHeaders] } : {}),
  };
}

function readWorkspaceOrigins(): string[] {
  const configured = Deno.env.get('NETSCRIPT_CORS_ORIGINS');
  if (!configured?.trim()) return [];
  return configured.split(',').map((entry) => {
    const origin = entry.trim();
    const url = URL.parse(origin);
    if (!url || !['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
      throw new TypeError(
        'NETSCRIPT_CORS_ORIGINS must contain comma-separated exact HTTP(S) origins',
      );
    }
    return origin;
  });
}

/** Reject statically known credentialed wildcards at the build boundary. */
export function assertServiceCorsOptions(options: ResolvedCorsOptions): void {
  if (
    options.credentials &&
    (options.origin === '*' || (Array.isArray(options.origin) && options.origin.includes('*')))
  ) {
    throw new TypeError('CORS wildcard origins cannot be combined with credentials');
  }
}

/** Keep upstream origin resolvers from emitting a credentialed wildcard. */
export function createServiceCorsMiddleware(options: ResolvedCorsOptions): ServiceMiddleware {
  const resolveOrigin = options.origin;
  if (options.credentials && typeof resolveOrigin === 'function') {
    return cors({
      ...options,
      origin: async (origin, context) => {
        const allowed = await resolveOrigin(origin, context);
        return allowed === '*' ? null : allowed;
      },
    });
  }
  return cors(options);
}
