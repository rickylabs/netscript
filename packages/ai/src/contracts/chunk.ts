/**
 * Agent-loop stream chunk contract.
 *
 * The agent loop (E3) is an async-iterable of these discriminated chunks.
 * Defining the union here lets provider adapters and consumers agree on the
 * wire vocabulary before the loop is implemented. Per Q1, a real
 * {@linkcode UsageChunk} is part of the union from day one.
 *
 * @module
 */

import type { Message } from './message.ts';
import type { ToolCall, ToolResult } from './tool.ts';
import type { Usage } from './usage.ts';

/** Discriminant tags for {@linkcode AgentChunk}. */
export type AgentChunkType =
  | 'text'
  | 'tool-call'
  | 'tool-result'
  | 'message'
  | 'usage'
  | 'error'
  | 'done';

/** Incremental assistant text output. */
export interface TextChunk {
  /** Discriminant. */
  readonly type: 'text';
  /** The text fragment appended this tick. */
  readonly delta: string;
}

/** A tool invocation requested by the model. */
export interface ToolCallChunk {
  /** Discriminant. */
  readonly type: 'tool-call';
  /** The requested tool call. */
  readonly toolCall: ToolCall;
}

/** The result of an executed tool, fed back into the loop. */
export interface ToolResultChunk {
  /** Discriminant. */
  readonly type: 'tool-result';
  /** The executed tool's result. */
  readonly result: ToolResult;
}

/** A fully-assembled message committed to the transcript. */
export interface MessageChunk {
  /** Discriminant. */
  readonly type: 'message';
  /** The completed message. */
  readonly message: Message;
}

/**
 * Token usage emitted by the loop. Q1: this is a real chunk the loop produces
 * (typically once per model step and/or at completion).
 */
export interface UsageChunk {
  /** Discriminant. */
  readonly type: 'usage';
  /** Usage accounted for the step/run. */
  readonly usage: Usage;
}

/** A recoverable or terminal error surfaced through the stream. */
export interface ErrorChunk {
  /** Discriminant. */
  readonly type: 'error';
  /** Human-readable error message. */
  readonly error: string;
  /** Underlying cause, when available. */
  readonly cause?: unknown;
}

/** Terminal chunk closing a run, optionally carrying final usage. */
export interface DoneChunk {
  /** Discriminant. */
  readonly type: 'done';
  /** Final usage for the run, when available. */
  readonly usage?: Usage;
}

/**
 * Discriminated union of everything the agent loop can stream.
 */
export type AgentChunk =
  | TextChunk
  | ToolCallChunk
  | ToolResultChunk
  | MessageChunk
  | UsageChunk
  | ErrorChunk
  | DoneChunk;
