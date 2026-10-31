/** NetScript CORS configuration and response authority; Hono resolves the policy. */
import { cors } from 'hono/cors';
import type { CorsOptions, ServiceMiddleware } from '../types.ts';

type ResolvedCorsOptions = NonNullable<CorsOptions>;

const ACCESS_CONTROL_RESPONSE_HEADERS = [
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'access-control-expose-headers',
  'access-control-allow-methods',
  'access-control-allow-headers',
  'access-control-max-age',
] as const;

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

/**
 * Preserve Hono's once-resolved CORS decision across handlers and proxied responses.
 * Snapshot all six headers, including absence, before downstream code runs; restore
 * them on the final response and retain the union of checkpoint and final Vary tokens.
 * Native preflight short-circuits unchanged. Credentialed resolvers cannot emit '*'.
 */
export function createServiceCorsMiddleware(options: ResolvedCorsOptions): ServiceMiddleware {
  const resolveOrigin = options.origin;
  const upstream = options.credentials && typeof resolveOrigin === 'function'
    ? cors({
      ...options,
      origin: async (origin, context) => {
        const allowed = await resolveOrigin(origin, context);
        return allowed === '*' ? null : allowed;
      },
    })
    : cors(options);
  return async (c, next) => {
    let checkpoint: { headers: Map<string, string | null>; vary: string | null } | undefined;
    const preflight = await upstream(c, async () => {
      checkpoint = {
        headers: new Map(
          ACCESS_CONTROL_RESPONSE_HEADERS.map((name) => [name, c.res.headers.get(name)]),
        ),
        vary: c.res.headers.get('vary'),
      };
      await next();
    });
    if (preflight) return preflight;
    if (!checkpoint) return;

    const vary = unionVary(checkpoint.vary, c.res.headers.get('vary'));
    // Hono's finalized-safe API rewraps even immutable responses without its
    // response setter reapplying stale headers. Call it once; then headers are mutable.
    c.header('vary', vary);
    for (const [name, value] of checkpoint.headers) {
      if (value === null) c.res.headers.delete(name);
      else c.res.headers.set(name, value);
    }
    return;
  };
}

function unionVary(checkpoint: string | null, final: string | null): string | undefined {
  const tokens = new Map<string, string>();
  for (const value of [checkpoint, final]) {
    for (const part of value?.split(',') ?? []) {
      const token = part.trim();
      if (token === '*') return '*';
      const key = token.toLowerCase();
      if (token && !tokens.has(key)) tokens.set(key, token);
    }
  }
  return tokens.size ? [...tokens.values()].join(', ') : undefined;
}
