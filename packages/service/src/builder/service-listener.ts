/**
 * HTTP listener mechanics for the service builder.
 *
 * Owns the `Deno.serve` lifecycle: port resolution, abort-signal bridging, the
 * startup log banner, and the `stop()` teardown contract. Kept separate from the
 * builder class so the listener concern can evolve (e.g. TLS, clustering) without
 * touching the fluent API.
 *
 * @module
 */

import { createServiceLogger } from '@netscript/logger';
import type { RunningService, ServeOptions, ServiceApp } from '../types.ts';

/**
 * Starts a `Deno.serve` listener for a built service app.
 *
 * @param app - The built service app (provides `fetch`).
 * @param serviceName - Service name used for the startup log banner.
 * @param defaultPort - Port to use when `options.port` is absent.
 * @param options - Serve options (port, external abort signal).
 * @returns The running service handle with address and `stop()`.
 */
export function startServiceListener(
  app: ServiceApp,
  serviceName: string,
  defaultPort: number,
  options?: ServeOptions,
): RunningService {
  const serviceLogger = createServiceLogger(serviceName);
  const port = options?.port ?? defaultPort;
  const controller = new AbortController();

  if (options?.signal?.aborted) {
    controller.abort(options.signal.reason);
  } else {
    options?.signal?.addEventListener(
      'abort',
      () => controller.abort(options.signal?.reason),
      { once: true },
    );
  }

  const server = Deno.serve(
    {
      port,
      signal: controller.signal,
      onListen: ({ hostname, port }) => {
        const origin = `http://${hostname}:${port}`;
        serviceLogger.info('Service listening', {
          service: serviceName,
          origin,
          docs: `${origin}/api/docs`,
          openapi: `${origin}/api/openapi.json`,
          health: `${origin}/health`,
        });
      },
    },
    (request) => app.fetch(request),
  );

  return {
    app,
    addr: server.addr as RunningService['addr'],
    stop: async () => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
      await server.finished;
    },
  };
}
