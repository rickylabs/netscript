import type { WorkflowEvent, WorkflowState } from './workflow-types.ts';

/** Clock contract used by workflow runtime code. */
export type WorkflowClock = Readonly<{
  now(): Date;
}>;

/** Store contract for durable workflow state and routed events. */
export interface WorkflowStateStore {
  saveState(state: WorkflowState): Promise<void>;
  findState(workflowId: string, executionId: string): Promise<WorkflowState | undefined>;
  saveEvent(event: WorkflowEvent): Promise<void>;
  takeEvent<T = unknown>(
    executionId: string,
    eventName: string,
  ): Promise<WorkflowEvent<T> | undefined>;
}

/** In-memory workflow state store for tests and local runtime composition. */
export class MemoryWorkflowStateStore implements WorkflowStateStore {
  readonly #states = new Map<string, WorkflowState>();
  readonly #events = new Map<string, WorkflowEvent>();

  saveState(state: WorkflowState): Promise<void> {
    this.#states.set(stateKey(state.workflowId, state.executionId), state);
    return Promise.resolve();
  }

  findState(workflowId: string, executionId: string): Promise<WorkflowState | undefined> {
    return Promise.resolve(this.#states.get(stateKey(workflowId, executionId)));
  }

  saveEvent(event: WorkflowEvent): Promise<void> {
    this.#events.set(eventKey(event.executionId, event.eventName), event);
    return Promise.resolve();
  }

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

function stateKey(workflowId: string, executionId: string): string {
  return `${workflowId}:${executionId}`;
}

function eventKey(executionId: string, eventName: string): string {
  return `${executionId}:${eventName}`;
}
