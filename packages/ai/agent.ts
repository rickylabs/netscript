/**
 * `@netscript/ai/agent` — the agent loop.
 *
 * Public entry for the E3 agent loop: {@linkcode createAgentLoop} plus the
 * typestate, history-strategy, and error vocabulary needed to drive and observe
 * a run. The loop consumes its model and tool collaborators purely by factory
 * injection (A10) — importing this subpath pulls **no** provider SDK, so an app
 * chooses its provider by importing e.g. `@netscript/ai/anthropic` separately.
 *
 * @example Drive a bounded, cancellable loop
 * ```ts
 * import { createAgentLoop, slidingWindowHistory } from "@netscript/ai/agent";
 *
 * const loop = createAgentLoop({
 *   modelProvider,               // a ChatModelProviderPort
 *   tools,                       // a ToolRegistryPort
 *   history: slidingWindowHistory({ maxMessages: 12 }),
 * });
 *
 * for await (const chunk of loop.run({ model: "anthropic:claude-sonnet-4-5", messages })) {
 *   if (chunk.type === "text") console.log(chunk.delta);
 *   if (chunk.type === "done") console.log(chunk.usage);
 * }
 * ```
 *
 * @module
 */

export {
  type AgentLoop,
  type AgentLoopDeps,
  createAgentLoop,
  DEFAULT_MAX_STEPS,
} from './src/agent/loop.ts';
export {
  DEFAULT_HISTORY_WINDOW,
  type HistoryStrategy,
  slidingWindowHistory,
  type SlidingWindowOptions,
} from './src/agent/history.ts';
export {
  type AgentLoopState,
  isTerminalState,
  type TerminalAgentLoopState,
} from './src/agent/state.ts';
export { AgentMaxStepsExceededError } from './src/agent/errors.ts';

// Re-export the seams the loop is programmed against, so `@netscript/ai/agent`
// is a self-contained surface for wiring a loop.
export type { AgentLoopInput, AgentLoopOptions, AgentLoopPort } from './src/ports/agent-loop.ts';
export type {
  ChatClientCallOptions,
  ChatClientEvent,
  ChatClientPort,
  ChatClientRequest,
  ChatErrorEvent,
  ChatFinishEvent,
  ChatFinishReason,
  ChatModelProviderPort,
  ChatTextEvent,
  ChatToolCallEvent,
} from './src/ports/chat-client.ts';
export type { ToolHandler, ToolRegistryPort } from './src/ports/tool-registry.ts';
