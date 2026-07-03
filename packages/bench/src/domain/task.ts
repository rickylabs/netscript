/**
 * Task and lane domain types.
 *
 * A {@link BenchTask} is a single agentic coding challenge (prompt + frozen
 * test suite + rubric). A {@link FrameworkLane} identifies the stack a task is
 * solved in. Slice 1 ships one task (`t1-storefront-api`) and one lane
 * (`netscript`).
 *
 * @module
 */

/** Stable identifier for a bench task, e.g. `t1-storefront-api`. */
export type TaskId = string;

/** Stable identifier for a framework lane, e.g. `netscript`. */
export type LaneId = string;

/**
 * A framework lane: the stack an agent is asked to build the task in. Kept
 * data-only so additional lanes (encore, nest, ...) can be added without code
 * changes when cross-framework comparison lands.
 */
export interface FrameworkLane {
  /** Stable lane id (`netscript`). */
  readonly id: LaneId;
  /** Human-readable lane name. */
  readonly name: string;
  /**
   * Path (relative to the task dir) to the per-lane agent guidance file, e.g.
   * `context/AGENTS.md`. Copied/surfaced into the sandbox before the run.
   */
  readonly contextPath: string;
}

/**
 * A single bench task. Paths are relative to the task directory so the whole
 * package stays portable for a clean lift to a standalone repo.
 */
export interface BenchTask {
  /** Stable task id (`t1-storefront-api`). */
  readonly id: TaskId;
  /** Short human title. */
  readonly title: string;
  /** Absolute or repo-relative path to the task directory. */
  readonly dir: string;
  /** Path to the agent-facing prompt (relative to {@link dir}). */
  readonly promptPath: string;
  /** Path to the rubric checklist (relative to {@link dir}). */
  readonly rubricPath: string;
  /**
   * Path to the frozen black-box test suite module (relative to {@link dir}).
   * The suite is loaded and executed by the test runner against a running
   * service; it is never shown to the agent.
   */
  readonly testSuitePath: string;
  /** Lanes this task can be solved in. Slice 1 = `[netscript]`. */
  readonly lanes: readonly FrameworkLane[];
}
