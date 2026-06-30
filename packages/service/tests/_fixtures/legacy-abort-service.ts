/**
 * Fixture service for the Deno.serve legacy-abort regression test (#176).
 *
 * Boots a minimal service whose handler observes `request.signal` for
 * cancellation — the same access pattern the oRPC runtime uses. Under Deno's
 * legacy `Deno.serve` behavior this prints a deprecation warning to stderr on a
 * successful response; under `--unstable-no-legacy-abort` it must not.
 *
 * Protocol: prints `READY <port>` to stdout once listening, serves requests,
 * and shuts down on SIGINT (or after the parent closes it). The `/cancel`
 * route resolves a deferred when its request signal aborts, then reports
 * `CANCELLED` to stdout so the parent can assert genuine cancellation still
 * propagates.
 *
 * @module
 */

import { createService } from '../../mod.ts';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const running = await createService({}, { name: 'legacy-abort-fixture' })
  .route('get', '/ok', (c) => {
    // Touch the request signal the way the oRPC runtime does: this is what
    // arms Deno's legacy abort-on-success path.
    c.req.raw.signal.addEventListener('abort', () => {}, { once: true });
    return c.text('ok');
  })
  .route('get', '/cancel', async (c) => {
    c.req.raw.signal.addEventListener('abort', () => {
      console.log('CANCELLED');
    }, { once: true });
    await delay(10_000);
    return c.text('done');
  })
  .serve({ port: 0, handleSignals: false });

console.log(`READY ${running.addr.port}`);

Deno.addSignalListener('SIGINT', () => {
  void running.stop().then(() => Deno.exit(0));
});
