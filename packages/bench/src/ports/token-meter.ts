/**
 * TokenMeter port: prices a usage record. Isolates the cost model behind a seam
 * so the pricing table can be swapped (per model, or a future live rate feed)
 * without touching the runner.
 *
 * @module
 */

import type { TokenUsage } from '../domain/agent.ts';

/** Prices token usage into USD. */
export interface TokenMeter {
  /** USD cost of the given usage under the active pricing table. */
  price(usage: TokenUsage): number;
}
