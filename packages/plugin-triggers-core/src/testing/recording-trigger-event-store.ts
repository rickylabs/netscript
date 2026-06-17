import type { TriggerEvent, TriggerEventId, TriggerEventStatus } from '../domain/mod.ts';
import type { TriggerEventListOptions, TriggerEventStorePort } from '../ports/mod.ts';
import { MemoryTriggerEventStore } from './memory-trigger-event-store.ts';

/** Operation recorded by a recording trigger event store. */
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
  /** Operations recorded by this store wrapper. */
  readonly operations: RecordingTriggerEventStoreOperation[] = [];
  readonly #inner: TriggerEventStorePort;

  /** Create a recording wrapper around another event store. */
  constructor(inner: TriggerEventStorePort = new MemoryTriggerEventStore()) {
    this.#inner = inner;
  }

  /** Record and forward a save operation. */
  save(event: TriggerEvent): Promise<void> {
    this.operations.push({ type: 'save', event });
    return this.#inner.save(event);
  }

  /** Record and forward a load operation. */
  load(eventId: TriggerEventId): Promise<TriggerEvent | undefined> {
    this.operations.push({ type: 'load', eventId });
    return this.#inner.load(eventId);
  }

  /** Record and forward an update-status operation. */
  updateStatus(
    eventId: TriggerEventId,
    status: TriggerEventStatus,
    metadata?: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    this.operations.push({ type: 'updateStatus', eventId, status, metadata });
    return this.#inner.updateStatus(eventId, status, metadata);
  }

  /** Record and forward a list operation. */
  list(options?: TriggerEventListOptions): Promise<readonly TriggerEvent[]> {
    this.operations.push({ type: 'list', options });
    return this.#inner.list(options);
  }

  /** Clear recorded operations without clearing the wrapped store. */
  clearOperations(): void {
    this.operations.splice(0);
  }
}
