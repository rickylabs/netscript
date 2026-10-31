/**
 * Durable Streams service entrypoint.
 *
 * Starts the `@durable-streams/server` `DurableStreamTestServer` on an
 * internal port, then fronts it with the mandated `createPluginService`
 * serving surface configured as a pure transparent proxy:
 *   - `/health`, `/health/live`, `/health/ready` via `withHealth`
 *   - all other requests proxied to the upstream DurableStreamTestServer
 *     through a raw catch-all route (`method: 'all'`, `path: '/*'`)
 *
 * Streams is the one plugin with no oRPC contract, so the service is built
 * with an empty router and `serveRpc: false` (no `withRPC` wiring).
 *
 * Storage defaults to ephemeral memory; all events are lost on process restart.
 * An explicit `STREAMS_DATA_DIR` selects file storage only after a startup
 * write/read probe succeeds. Empty, missing, non-directory or unwritable opt-ins
 * fail startup without falling back to memory. File mode supports replay after
 * an orderly process restart; it does not claim power-loss durability.
 *
 * @module
 */

import { startStreamsService } from './service.ts';

// The legacy plural entrypoint retains its authored public and wildcard-origin posture.
const LEGACY_PUBLIC_REASON =
  'Guarded adoption awaits caller credentials, runtime session seeding, per-service access policy and auth discovery references (#1383).';

await startStreamsService({
  auth: { public: true, reason: LEGACY_PUBLIC_REASON },
  cors: { origin: '*' },
});
