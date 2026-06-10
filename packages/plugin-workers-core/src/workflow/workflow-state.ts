import type { WorkflowEvent, WorkflowState } from './workflow-types.ts';

/** Clock contract used by workflow runtime code. */
export type WorkflowClock = Readonly<{
  /** Returns the current wall-clock time for runtime timestamps. */
  now(): Date;
}>;

/** Store contract for durable workflow state and routed events. */
export interface WorkflowStateStore {
  /** Persists the latest state for a workflow execution. */
  saveState(state: WorkflowState): Promise<void>;
  /** Finds a workflow execution state by workflow id and execution id. */
  findState(workflowId: string, executionId: string): Promise<WorkflowState | undefined>;
  /** Persists an external event for a workflow execution. */
  saveEvent(event: WorkflowEvent): Promise<void>;
  /** Reads and removes a matching event for a workflow execution. */
  takeEvent<T = unknown>(
    executionId: string,
    eventName: string,
  ): Promise<WorkflowEvent<T> | undefined>;
}

/** In-memory workflow state store for tests and local runtime composition. */
export class MemoryWorkflowStateStore implements WorkflowStateStore {
  readonly #states = new Map<string, WorkflowState>();
  readonly #events = new Map<string, WorkflowEvent>();

  /** Persists the latest state for a workflow execution. */
  saveState(state: WorkflowState): Promise<void> {
    this.#states.set(stateKey(state.workflowId, state.executionId), state);
    return Promise.resolve();
  }

  /** Finds a workflow execution state by workflow id and execution id. */
  findState(workflowId: string, executionId: string): Promise<WorkflowState | undefined> {
    return Promise.resolve(this.#states.get(stateKey(workflowId, executionId)));
  }

  /** Persists an external event for a workflow execution. */
  saveEvent(event: WorkflowEvent): Promise<void> {
    this.#events.set(eventKey(event.executionId, event.eventName), event);
    return Promise.resolve();
  }

  /** Reads and removes a matching event for a workflow execution. */
  takeEvent<T = unknown>(
    executionId: string,
    eventName: string,
  ): Promise<WorkflowEvent<T> | undefined> {
    const key = eventKey(executionId, eventName);
    const event = this.#events.get(key) as WorkflowEvent<T> | undefined;
    this.#events.delete(key);
    return Promise.resolve(event);
  }
}

/** Creates the map key for a workflow execution state. */
function stateKey(workflowId: string, executionId: string): string {
  return `${workflowId}:${executionId}`;
}

/** Creates the map key for a workflow execution event. */
function eventKey(executionId: string, eventName: string): string {
  return `${executionId}:${eventName}`;
}
