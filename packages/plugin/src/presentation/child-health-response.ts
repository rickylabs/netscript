import type { ChildHealthSnapshot } from '../domain/child-health.ts';

/**
 * Serve the child health route; every state except ready returns HTTP 503.
 *
 * @example
 * ```ts
 * import { ChildHealthMonitor, childHealthResponse } from '@netscript/plugin/health';
 * const health = new ChildHealthMonitor();
 * const response = childHealthResponse(new Request('http://localhost/health'), health.snapshot());
 * console.log(response.status); // 503
 * ```
 */
export function childHealthResponse(request: Request, health: ChildHealthSnapshot): Response {
  if (new URL(request.url).pathname !== '/health') {
    return new Response('Not Found', { status: 404 });
  }
  return Response.json(health, {
    status: health.state === 'ready' && health.registryReady && health.dependencyReady ? 200 : 503,
    headers: { 'cache-control': 'no-store' },
  });
}
