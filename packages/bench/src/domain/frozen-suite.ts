/**
 * Frozen-suite contract. A task's `tests/frozen-suite.ts` exports a
 * {@link FrozenSuite}: a set of black-box probes run against a booted service.
 * Probes are author-facing; they never run in the agent's sandbox and the agent
 * never sees them.
 *
 * A probe asserts by throwing: returning normally is a pass, throwing is a fail
 * (the thrown message becomes the probe error). This keeps authored probes tiny
 * and framework-free while remaining fully driver-agnostic.
 *
 * @module
 */

import type { HttpClient } from '../ports/http-client.ts';

/** Context handed to each probe. */
export interface ProbeContext {
  /** Base URL of the booted service under test, e.g. `http://127.0.0.1:8080`. */
  readonly baseUrl: string;
  /** HTTP client bound to the service. */
  readonly http: HttpClient;
  /**
   * Restart the service without wiping persistence, then resolve once healthy.
   * Used by persistence-across-restart probes. In unit tests the fake runner
   * supplies a no-op that preserves the in-memory store.
   */
  restart(): Promise<void>;
}

/** A single black-box probe. Throws to fail. */
export interface ProbeDefinition {
  readonly id: string;
  readonly title: string;
  run(ctx: ProbeContext): Promise<void>;
}

/** A task's full frozen suite. */
export interface FrozenSuite {
  readonly taskId: string;
  readonly probes: readonly ProbeDefinition[];
}
