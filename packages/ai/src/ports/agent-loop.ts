/**
 * Agent loop port — the seam slice E3 plugs into.
 *
 * The agent loop drives the model↔tool cycle and yields the
 * {@linkcode AgentChunk} stream. This core defines only the seam and a throwing
 * default; the real loop (planning, tool execution, step limits, streaming
 * assembly) is slice E3 and is injected via {@linkcode createAiRuntime}.
 *
 * @module
 */

import type { AgentChunk } from '../contracts/chunk.ts';
import type { GenerationOptions } from '../contracts/generation.ts';
import type { Message } from '../contracts/message.ts';
import type { ModelRef } from '../contracts/model.ts';
import type { ToolDescriptor } from '../contracts/tool.ts';
import { AiNotConfiguredError } from '../contracts/errors.ts';

/**
 * Input to a single agent-loop run.
 */
export interface AgentLoopInput {
  /** Which model to drive the loop with. */
  readonly model: ModelRef;
  /** The conversation so far. */
  readonly messages: readonly Message[];
  /** Tools the model may call this run. */
  readonly tools?: readonly ToolDescriptor[];
  /** System instruction prepended to the run. */
  readonly system?: string;
  /**
   * Provider-neutral per-turn generation options (reasoning effort, output-token
   * cap, open provider-options escape hatch). The loop threads it into every
   * {@linkcode import('./chat-client.ts').ChatClientRequest} it issues, where the
   * bound provider adapter maps it natively. Optional and additive.
   */
  readonly options?: GenerationOptions;
}

/**
 * Per-run options for the agent loop.
 */
export interface AgentLoopOptions {
  /** Cancellation signal for the run. */
  readonly signal?: AbortSignal;
  /** Maximum model↔tool iterations before the loop stops. */
  readonly maxSteps?: number;
}

/**
 * The agent loop capability seam. A run is an async-iterable of chunks.
 */
export interface AgentLoopPort {
  /** Drive one run, yielding the chunk stream. */
  run(input: AgentLoopInput, options?: AgentLoopOptions): AsyncIterable<AgentChunk>;
}

/**
 * Create the default throwing agent loop. Iterating a run rejects with
 * {@linkcode AiNotConfiguredError} — wire the E3 loop via createAiRuntime.
 */
export function createUnconfiguredAgentLoop(): AgentLoopPort {
  return {
    run(): AsyncIterable<AgentChunk> {
      return {
        [Symbol.asyncIterator](): AsyncIterator<AgentChunk> {
          return {
            next(): Promise<IteratorResult<AgentChunk>> {
              return Promise.reject(
                new AiNotConfiguredError(
                  'agentLoop',
                  'Inject an AgentLoopPort via createAiRuntime.',
                ),
              );
            },
          };
        },
      };
    },
  };
}
