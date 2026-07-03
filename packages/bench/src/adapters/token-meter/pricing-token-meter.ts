/**
 * Pricing token meter: prices usage against a fixed {@link ModelPricing} table.
 * Pure and deterministic — the same usage always prices identically.
 *
 * @module
 */

import type { TokenUsage } from '../../domain/agent.ts';
import type { ModelPricing } from '../../domain/metrics.ts';
import { costOf } from '../../domain/metrics.ts';
import type { TokenMeter } from '../../ports/token-meter.ts';

/** A {@link TokenMeter} backed by a static per-model pricing table. */
export class PricingTokenMeter implements TokenMeter {
  readonly #pricing: ModelPricing;

  constructor(pricing: ModelPricing) {
    this.#pricing = pricing;
  }

  price(usage: TokenUsage): number {
    return costOf(usage, this.#pricing);
  }
}
