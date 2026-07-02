/**
 * Model identity and capability contracts.
 *
 * These describe *which* model to talk to and *what* it can do. Resolution of a
 * reference to a concrete provider happens in the model registry
 * (`../ports/model-provider.ts`); this module only defines the vocabulary.
 *
 * @module
 */

import type { ContentModality } from './content.ts';

/** Opaque provider-scoped model identifier (e.g. `claude-sonnet-4`). */
export type ModelId = string;

/**
 * Declared capabilities of a model, used for routing and validation.
 */
export interface ModelCapabilities {
  /** Whether the model supports token streaming. */
  readonly streaming?: boolean;
  /** Whether the model supports tool/function calling. */
  readonly tools?: boolean;
  /** Whether the model accepts image input. */
  readonly vision?: boolean;
  /** Whether the model can produce embeddings. */
  readonly embeddings?: boolean;
  /** Modalities accepted as input. */
  readonly inputModalities?: readonly ContentModality[];
  /** Maximum accepted input tokens, when known. */
  readonly maxInputTokens?: number;
  /** Maximum producible output tokens, when known. */
  readonly maxOutputTokens?: number;
}

/**
 * Static description of a model exposed by a provider.
 */
export interface ModelDescriptor {
  /** Provider-scoped model id. */
  readonly id: ModelId;
  /** Registered provider id that owns this model. */
  readonly provider: string;
  /** Human-readable label. */
  readonly displayName?: string;
  /** Declared capabilities, when known. */
  readonly capabilities?: ModelCapabilities;
}

/**
 * Structured model reference: an explicit provider + model pair.
 */
export interface ModelSelector {
  /** Registered provider id. */
  readonly provider: string;
  /** Provider-scoped model id. */
  readonly model: ModelId;
}

/**
 * A reference to a model, either a `"<provider>:<model>"` string or a
 * structured {@linkcode ModelSelector}.
 */
export type ModelRef = string | ModelSelector;

/**
 * A resolved model returned by the registry: the descriptor plus the id of the
 * provider that produced it.
 */
export interface ModelHandle {
  /** The resolved model descriptor. */
  readonly descriptor: ModelDescriptor;
  /** Id of the provider that produced the descriptor. */
  readonly providerId: string;
}
