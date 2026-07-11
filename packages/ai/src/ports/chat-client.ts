/**
 * Chat-client port — the **owned** model-invocation seam.
 *
 * A {@linkcode ChatClientPort} is one provider-neutral, single model *turn*:
 * given a request (messages + optional system + optional tool descriptors) it
 * streams {@linkcode ChatClientEvent}s (text deltas, model-requested tool calls,
 * and a terminal finish carrying **real** provider usage). It does **not**
 * execute tools — that is the agent loop's job (E3). Multi-turn iteration,
 * tool execution, and step bounding all live above this seam.
 *
 * This type is deliberately owned by `@netscript/ai`: no external model-SDK
 * type appears in its public shape, so E2 provider adapters translate their
 * wrapped `@tanstack/ai` client to/from this vocabulary internally and the
 * published `deno doc --lint` surface stays free of provider-SDK class refs.
 *
 * @module
 */

import type { GenerationOptions } from '../contracts/generation.ts';
import type { Message } from '../contracts/message.ts';
import type { ModelId } from '../contracts/model.ts';
import type { ToolCall, ToolDescriptor } from '../contracts/tool.ts';
import type { Usage } from '../contracts/usage.ts';

/**
 * Why a single model turn stopped, normalized across providers.
 */
export type ChatFinishReason =
  | 'stop'
  | 'length'
  | 'tool-calls'
  | 'content-filter'
  | 'error'
  | 'unknown';

/**
 * Input to a single {@linkcode ChatClientPort.stream} turn.
 */
export interface ChatClientRequest {
  /** The conversation so far, oldest first. */
  readonly messages: readonly Message[];
  /** System instruction prepended to this turn, when any. */
  readonly system?: string;
  /**
   * Tool descriptors the model may call this turn. Descriptors only — the model
   * emits {@linkcode ToolCall}s; the agent loop resolves and executes them.
   */
  readonly tools?: readonly ToolDescriptor[];
  /**
   * Provider-neutral per-turn generation options (reasoning effort, output-token
   * cap, open provider-options escape hatch). Each provider adapter maps this to
   * its native request shape; omitting it leaves the provider defaults. Additive
   * and optional — existing call sites compile unchanged.
   */
  readonly options?: GenerationOptions;
}

/**
 * Per-turn options for {@linkcode ChatClientPort.stream}.
 */
export interface ChatClientCallOptions {
  /** Cancellation signal for the turn; aborting stops the underlying request. */
  readonly signal?: AbortSignal;
  /**
   * Provider-native options for this turn. These override static
   * construction-time model options; omission retains configured defaults.
   */
  readonly modelOptions?: Readonly<Record<string, unknown>>;
  /**
   * Provider connection values for this turn. Non-empty values override the
   * provider's construction-time defaults without changing later turns.
   * `host` is the Ollama daemon origin; hosted providers use `baseURL`.
   */
  readonly connection?: ChatClientConnectionOptions;
}

/** Provider connection values that may vary for each chat turn. */
export interface ChatClientConnectionOptions {
  /** API key used only for this turn. */
  readonly apiKey?: string;
  /** Hosted provider base URL used only for this turn. */
  readonly baseURL?: string;
  /** Ollama daemon host used only for this turn. */
  readonly host?: string;
}

/** Incremental assistant text produced by the model. */
export interface ChatTextEvent {
  /** Discriminant. */
  readonly type: 'text';
  /** The text fragment produced this tick. */
  readonly delta: string;
}

/**
 * Incremental model reasoning / extended-thinking output produced this turn.
 *
 * Emitted when a reasoning-capable provider streams chain-of-thought deltas
 * (surfaced via {@linkcode GenerationOptions.reasoningEffort}); the wrapped
 * adapter translates the provider's reasoning stream event to this owned shape.
 * Providers without a reasoning wire never emit it.
 */
export interface ChatReasoningEvent {
  /** Discriminant. */
  readonly type: 'reasoning';
  /** The reasoning fragment produced this tick. */
  readonly delta: string;
}

/** A fully-assembled tool call the model requested this turn. */
export interface ChatToolCallEvent {
  /** Discriminant. */
  readonly type: 'tool-call';
  /** The requested tool call, with fully-accumulated arguments. */
  readonly toolCall: ToolCall;
}

/** Terminal event closing a single turn, carrying that turn's real usage. */
export interface ChatFinishEvent {
  /** Discriminant. */
  readonly type: 'finish';
  /** Real per-turn usage as reported by the provider, when available. */
  readonly usage?: Usage;
  /** Why the turn stopped, when reported. */
  readonly finishReason?: ChatFinishReason;
}

/** A turn-level error surfaced through the stream. */
export interface ChatErrorEvent {
  /** Discriminant. */
  readonly type: 'error';
  /** Human-readable error message. */
  readonly message: string;
  /** Underlying cause, when available. */
  readonly cause?: unknown;
}

/**
 * Discriminated union of everything a single {@linkcode ChatClientPort.stream}
 * turn can yield.
 */
export type ChatClientEvent =
  | ChatTextEvent
  | ChatReasoningEvent
  | ChatToolCallEvent
  | ChatFinishEvent
  | ChatErrorEvent;

/**
 * A provider-neutral single-turn chat client. Constructed by a
 * {@linkcode ChatModelProviderPort} for one model id; the agent loop drives it
 * turn by turn.
 */
export interface ChatClientPort {
  /** Adapter kind (e.g. `"text"`). */
  readonly kind: string;
  /** Provider name (e.g. `"anthropic"`). */
  readonly name: string;
  /**
   * Run one model turn and stream its {@linkcode ChatClientEvent}s. Passing an
   * already-aborted `options.signal` yields at most a terminal event and never
   * hangs.
   */
  stream(
    request: ChatClientRequest,
    options?: ChatClientCallOptions,
  ): AsyncIterable<ChatClientEvent>;
}

/**
 * A {@linkcode import('./model-provider.ts').ModelProviderPort} that can also
 * mint a {@linkcode ChatClientPort} for one of its models. This is the seam the
 * agent loop injects (A10): it never imports a concrete provider, only this
 * capability shape.
 */
export interface ChatModelProviderPort {
  /** Stable registry id (e.g. `"anthropic"`). */
  readonly id: string;
  /** Construct a single-turn chat client bound to `modelId`. */
  createChatClient(modelId: ModelId): ChatClientPort;
}
