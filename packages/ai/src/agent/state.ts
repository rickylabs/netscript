/**
 * Agent-loop typestate.
 *
 * A run is an explicit state machine. Modeling the states as a closed union
 * (rather than ad-hoc booleans) makes the terminal set — and every legal
 * transition — checkable and documentable (see `docs/architecture.md`).
 *
 * ```text
 *  idle ─▶ running ─▶ awaiting-tool ─▶ running ─▶ done
 *                 └────────────────────────────▶ errored
 *                 └────────────────────────────▶ aborted
 * ```
 *
 * @module
 */

/**
 * The lifecycle state of an agent-loop run.
 *
 * - `idle` — constructed, no run in flight.
 * - `running` — a model turn is streaming.
 * - `awaiting-tool` — the model requested tool calls that are executing.
 * - `done` — the model produced a final answer with no further tool calls.
 * - `aborted` — the run was cancelled via `stop()` or an `AbortSignal`.
 * - `errored` — the run stopped on a model/turn error or the `maxSteps` bound.
 */
export type AgentLoopState =
  | 'idle'
  | 'running'
  | 'awaiting-tool'
  | 'done'
  | 'aborted'
  | 'errored';

/**
 * The terminal states a run can settle in. Once a run reaches one of these it
 * yields a final `done` chunk and the async iterable completes.
 */
export type TerminalAgentLoopState = Extract<
  AgentLoopState,
  'done' | 'aborted' | 'errored'
>;

/** Whether `state` is a terminal state. */
export function isTerminalState(state: AgentLoopState): state is TerminalAgentLoopState {
  return state === 'done' || state === 'aborted' || state === 'errored';
}
