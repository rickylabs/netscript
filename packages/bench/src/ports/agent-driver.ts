/**
 * AgentDriver port: yields a stream of assistant turns for a task attempt.
 *
 * @module
 */

import type { AgentRunRequest, AgentTurn } from '../domain/agent.ts';

/**
 * Drives an agent to solve a task inside a prepared sandbox. Implementations
 * materialize each turn's edits into `request.workdir` before yielding, so the
 * runner can evaluate the frozen suite against post-turn state.
 *
 * The real adapter shells out to headless Claude Code; the fake adapter replays
 * a scripted turn list for deterministic tests.
 */
export interface AgentDriver {
  /** Async stream of assistant turns in emission order. */
  run(request: AgentRunRequest): AsyncIterable<AgentTurn>;
}
