/**
 * @module @netscript/config
 *
 * Type-safe identity helpers for split NetScript config modules.
 */

import type {
  SagaRetentionConfig,
  SagaRetryConfig,
  SagaScalingConfig,
  SagasConfig,
  SagaTimeoutConfig,
} from '../../types.ts';

/** Authoring form for a saga definition before schema defaults are applied. */
export interface SagaDefinitionInput {
  /** Unique saga identifier. */
  readonly id: string;
  /** Human-readable saga name. */
  readonly name: string;
  /** Entrypoint file path relative to the saga directory. */
  readonly entrypoint: string;
  /** Topic used for message routing and isolation. */
  readonly topic?: string;
  /** Saga description. */
  readonly description?: string;
  /** Whether the saga is enabled. */
  readonly enabled?: boolean;
  /** Retry configuration for this saga. */
  readonly retry?: Readonly<SagaRetryConfig>;
  /** Timeout configuration for this saga. */
  readonly timeout?: Readonly<SagaTimeoutConfig>;
  /** Saga tags for filtering. */
  readonly tags?: readonly string[];
  /** Additional metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Authoring form for a saga group before schema defaults are applied. */
export interface SagaGroupInput {
  /** Topic identifier for message routing. */
  readonly topic: string;
  /** Scaling configuration for this topic. */
  readonly scaling?: Readonly<SagaScalingConfig>;
  /** Retention policy for this topic. */
  readonly retention?: Readonly<SagaRetentionConfig>;
  /** Saga definitions belonging to this topic. */
  readonly sagas?: readonly SagaDefinitionInput[];
}

/** Authoring form for split saga config files before schema defaults are applied. */
export interface SagasConfigInput extends Partial<Omit<SagasConfig, 'sagas' | 'groups'>> {
  /** Legacy flat saga definitions. */
  sagas?: readonly SagaDefinitionInput[];
  /** Saga groups organized by topic. */
  groups?: readonly SagaGroupInput[];
}

/**
 * Define a split saga config module.
 *
 * @param config - Saga config authoring object.
 * @returns The same config object for downstream validation.
 */
export function defineSagas(config: SagasConfigInput): SagasConfigInput {
  return config;
}
