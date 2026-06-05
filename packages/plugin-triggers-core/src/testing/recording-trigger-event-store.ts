import type { TriggerEvent, TriggerEventId, TriggerEventStatus } from '../domain/mod.ts';
import type { TriggerEventListOptions, TriggerEventStorePort } from '../ports/mod.ts';
import { MemoryTriggerEventStore } from './memory-trigger-event-store.ts';

export type RecordingTriggerEventStoreOperation =
  | Readonly<{ type: 'save'; event: TriggerEvent }>
  | Readonly<{ type: 'load'; eventId: TriggerEventId }>
  | Readonly<{
    type: 'updateStatus';
    eventId: TriggerEventId;
    status: TriggerEventStatus;
    metadata?: Readonly<Record<string, unknown>>;
  }>
  | Readonly<{ type: 'list'; options?: TriggerEventListOptions }>;

/** Event store wrapper that records operations while preserving memory-store behavior. */
export class RecordingTriggerEventStore implements TriggerEventStorePort {
  readonly operations: RecordingTriggerEventStoreOperation[] = [];
  readonly #inner: TriggerEventStorePort;

  constructor(inner: TriggerEventStorePort = new MemoryTriggerEventStore()) {
    this.#inner = inner;
  }

  save(event: TriggerEvent): Promise<void> {
    this.operations.push({ type: 'save', event });
    return this.#inner.save(event);
  }

  load(eventId: TriggerEventId): Promise<TriggerEvent | undefined> {
    this.operations.push({ type: 'load', eventId });
    return this.#inner.load(eventId);
  }

  updateStatus(
    eventId: TriggerEventId,
    status: TriggerEventStatus,
    metadata?: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    this.operations.push({ type: 'updateStatus', eventId, status, metadata });
    return this.#inner.updateStatus(eventId, status, metadata);
  }

  list(options?: TriggerEventListOptions): Promise<readonly TriggerEvent[]> {
    this.operations.push({ type: 'list', options });
    return this.#inner.list(options);
  }

  clearOperations(): void {
    this.operations.splice(0);
  }
}
