/**
 * `createAgentLoop()` — the E3 agent loop.
 *
 * Drives the model↔tool cycle as an explicit typestate machine
 * (`idle → running → awaiting-tool → running → done | aborted | errored`) and
 * yields the {@linkcode AgentChunk} stream. Both collaborators — the chat client
 * source ({@linkcode ChatModelProviderPort}) and the tool registry
 * ({@linkcode ToolRegistryPort}) — are supplied by **factory injection** (A10);
 * this module imports no concrete provider or registry.
 *
 * Design highlights:
 * - **Bounded steps.** `maxSteps` caps model↔tool iterations; exceeding it
 *   settles the run in `errored` with an {@linkcode AgentMaxStepsExceededError}.
 * - **Bounded context.** A {@linkcode HistoryStrategy} (default sliding window)
 *   truncates the transcript sent to the model each turn.
 * - **Real usage.** Per-turn usage comes from the provider's finish event; the
 *   loop sums those real numbers — it never estimates from string length.
 * - **Cancellation.** `stop()` and the per-run `AbortSignal` unwind to the
 *   `aborted` terminal state and a final `done` chunk; nothing hangs or leaks.
 *
 * @module
 */

import type { AgentChunk } from '../contracts/chunk.ts';
import type { Message } from '../contracts/message.ts';
import type { ModelId, ModelRef } from '../contracts/model.ts';
import type { ToolCall, ToolResult } from '../contracts/tool.ts';
import type { Usage } from '../contracts/usage.ts';
import type { ChatModelProviderPort } from '../ports/chat-client.ts';
import type { ToolRegistryPort } from '../ports/tool-registry.ts';
import { createNoopToolRegistry } from '../ports/tool-registry.ts';
import type { AgentLoopInput, AgentLoopOptions, AgentLoopPort } from '../ports/agent-loop.ts';
import type { HistoryStrategy } from './history.ts';
import { slidingWindowHistory } from './history.ts';
import type { AgentLoopState } from './state.ts';
import { AgentMaxStepsExceededError } from './errors.ts';

/** Default `maxSteps` when neither the run options nor the deps set one. */
export const DEFAULT_MAX_STEPS = 8;

/**
 * Dependencies for {@linkcode createAgentLoop}. Every collaborator is injected;
 * the loop constructs none of them itself (A10).
 */
export interface AgentLoopDeps {
  /** Source of single-turn chat clients, bound per model id. */
  readonly modelProvider: ChatModelProviderPort;
  /** Registry resolving tool handlers. Defaults to a no-op (no tools). */
  readonly tools?: ToolRegistryPort;
  /** Transcript-truncation strategy. Defaults to a sliding window. */
  readonly history?: HistoryStrategy;
  /** Step bound used when a run supplies no `maxSteps`. */
  readonly defaultMaxSteps?: number;
}

/**
 * A live agent loop: an {@linkcode AgentLoopPort} plus its observable
 * {@linkcode AgentLoop.state} and a {@linkcode AgentLoop.stop} control.
 */
export interface AgentLoop extends AgentLoopPort {
  /** The current typestate of the loop. */
  readonly state: AgentLoopState;
  /**
   * Request cancellation of the in-flight run. The active run unwinds to the
   * `aborted` terminal state and completes; calling it with no active run is a
   * no-op.
   */
  stop(): void;
}

/**
 * Create an agent loop from injected collaborators.
 *
 * @example Run a bounded loop and consume its chunk stream
 * ```ts
 * import { createAgentLoop } from "@netscript/ai/agent";
 *
 * const loop = createAgentLoop({ modelProvider, tools });
 * const abort = new AbortController();
 * for await (const chunk of loop.run({ model: "anthropic:claude-sonnet-4-5", messages }, {
 *   signal: abort.signal,
 *   maxSteps: 6,
 * })) {
 *   if (chunk.type === "text") Deno.stdout.writeSync(new TextEncoder().encode(chunk.delta));
 *   if (chunk.type === "done") break;
 * }
 * // abort.abort() (or loop.stop()) settles the run in the `aborted` state.
 * ```
 */
export function createAgentLoop(deps: AgentLoopDeps): AgentLoop {
  const provider = deps.modelProvider;
  const tools = deps.tools ?? createNoopToolRegistry();
  const history = deps.history ?? slidingWindowHistory();
  const configuredMaxSteps = deps.defaultMaxSteps ?? DEFAULT_MAX_STEPS;

  let state: AgentLoopState = 'idle';
  let activeController: AbortController | null = null;

  async function* run(
    input: AgentLoopInput,
    options?: AgentLoopOptions,
  ): AsyncGenerator<AgentChunk> {
    const maxSteps = options?.maxSteps ?? configuredMaxSteps;
    const controller = new AbortController();
    activeController = controller;
    const signal = combineSignals(options?.signal, controller.signal);

    const aggregate: MutableUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let sawUsage = false;
    const working: Message[] = [...input.messages];
    const modelId = resolveModelId(input.model);

    state = 'running';
    try {
      for (let step = 0;; step++) {
        if (signal.aborted) {
          state = 'aborted';
          yield doneChunk(sawUsage, aggregate);
          return;
        }
        if (step >= maxSteps) {
          state = 'errored';
          const error = new AgentMaxStepsExceededError(maxSteps);
          yield { type: 'error', error: error.message, cause: error };
          yield doneChunk(sawUsage, aggregate);
          return;
        }

        const client = provider.createChatClient(modelId);
        const messages = history.apply(working);

        let assistantText = '';
        const turnToolCalls: ToolCall[] = [];
        let turnErrored = false;

        for await (
          const event of client.stream(
            { messages, system: input.system, tools: input.tools },
            { signal },
          )
        ) {
          if (signal.aborted) {
            break;
          }
          switch (event.type) {
            case 'text': {
              assistantText += event.delta;
              yield { type: 'text', delta: event.delta };
              break;
            }
            case 'tool-call': {
              turnToolCalls.push(event.toolCall);
              yield { type: 'tool-call', toolCall: event.toolCall };
              break;
            }
            case 'finish': {
              if (event.usage) {
                sawUsage = true;
                addUsage(aggregate, event.usage);
                yield { type: 'usage', usage: event.usage };
              }
              break;
            }
            case 'error': {
              turnErrored = true;
              yield { type: 'error', error: event.message, cause: event.cause };
              break;
            }
          }
          if (turnErrored) {
            break;
          }
        }

        if (signal.aborted) {
          state = 'aborted';
          yield doneChunk(sawUsage, aggregate);
          return;
        }
        if (turnErrored) {
          state = 'errored';
          yield doneChunk(sawUsage, aggregate);
          return;
        }

        const assistantMessage: Message = turnToolCalls.length > 0
          ? { role: 'assistant', content: assistantText, toolCalls: turnToolCalls }
          : { role: 'assistant', content: assistantText };
        working.push(assistantMessage);
        yield { type: 'message', message: assistantMessage };

        if (turnToolCalls.length === 0) {
          state = 'done';
          yield doneChunk(sawUsage, aggregate);
          return;
        }

        state = 'awaiting-tool';
        for (const call of turnToolCalls) {
          if (signal.aborted) {
            state = 'aborted';
            yield doneChunk(sawUsage, aggregate);
            return;
          }
          const result = await executeToolCall(tools, call);
          yield { type: 'tool-result', result };
          working.push(toToolMessage(result, call));
        }
        state = 'running';
      }
    } catch (cause) {
      if (signal.aborted) {
        state = 'aborted';
        yield doneChunk(sawUsage, aggregate);
        return;
      }
      state = 'errored';
      yield { type: 'error', error: errorMessage(cause), cause };
      yield doneChunk(sawUsage, aggregate);
    } finally {
      if (activeController === controller) {
        activeController = null;
      }
    }
  }

  return {
    get state(): AgentLoopState {
      return state;
    },
    run(input: AgentLoopInput, options?: AgentLoopOptions): AsyncIterable<AgentChunk> {
      return run(input, options);
    },
    stop(): void {
      activeController?.abort(new DOMException('Agent loop stopped.', 'AbortError'));
    },
  };
}

/** Mutable accumulator mirror of the readonly {@linkcode Usage} core fields. */
interface MutableUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** Sum a turn's real usage into the run aggregate (core token fields only). */
function addUsage(aggregate: MutableUsage, usage: Usage): void {
  aggregate.promptTokens += usage.promptTokens;
  aggregate.completionTokens += usage.completionTokens;
  aggregate.totalTokens += usage.totalTokens;
}

/** Build the terminal `done` chunk, carrying aggregate usage when any was seen. */
function doneChunk(sawUsage: boolean, aggregate: MutableUsage): AgentChunk {
  if (!sawUsage) {
    return { type: 'done' };
  }
  const usage: Usage = {
    promptTokens: aggregate.promptTokens,
    completionTokens: aggregate.completionTokens,
    totalTokens: aggregate.totalTokens,
  };
  return { type: 'done', usage };
}

/** Execute one tool call through the injected registry, never throwing. */
async function executeToolCall(tools: ToolRegistryPort, call: ToolCall): Promise<ToolResult> {
  const handler = tools.resolveHandler(call.name);
  if (!handler) {
    return {
      toolCallId: call.id,
      content: `No handler registered for tool "${call.name}".`,
      state: 'error',
      error: 'tool-not-found',
    };
  }
  try {
    return await handler(call);
  } catch (cause) {
    return {
      toolCallId: call.id,
      content: errorMessage(cause),
      state: 'error',
      error: errorMessage(cause),
    };
  }
}

/** Convert an executed tool result into a `tool`-role transcript message. */
function toToolMessage(result: ToolResult, call: ToolCall): Message {
  return {
    role: 'tool',
    content: result.content,
    toolCallId: result.toolCallId,
    name: call.name,
  };
}

/** Resolve the provider-scoped model id from a {@linkcode ModelRef}. */
function resolveModelId(model: ModelRef): ModelId {
  if (typeof model !== 'string') {
    return model.model;
  }
  const separator = model.indexOf(':');
  return separator >= 0 ? model.slice(separator + 1) : model;
}

/** Merge an optional external signal with the loop's internal stop signal. */
function combineSignals(external: AbortSignal | undefined, internal: AbortSignal): AbortSignal {
  return external ? AbortSignal.any([external, internal]) : internal;
}

/** Reduce an unknown thrown value to a message string. */
function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
