import type {
  ManualTriggerPayload,
  TriggerEvent,
  TriggerEventId,
  TriggerId,
} from '../domain/mod.ts';
import type {
  ProcessableTriggerDefinition,
  TriggerEventStorePort,
  TriggerProcessorPort,
} from '../ports/mod.ts';

/** Manual trigger fire request consumed by the runtime dispatcher. */
export type ManualTriggerFireInput = Readonly<{
  payload?: Readonly<Record<string, unknown>>;
  idempotencyKey?: string;
  reason?: string;
  traceparent?: string;
  tracestate?: string;
  firedBy?: string;
}>;

/** Manual trigger fire response returned by the runtime dispatcher. */
export type ManualTriggerFireResponse = Readonly<{
  accepted: boolean;
  eventId: TriggerEventId;
  triggerId: TriggerId;
  status: 'pending' | 'deferred';
}>;

/** Generates event ids for manual trigger fire events. */
export type ManualTriggerEventIdFactory = (
  definition: ProcessableTriggerDefinition,
  input: ManualTriggerFireInput,
) => TriggerEventId;

/** Options accepted by the manual trigger dispatcher factory. */
export type ManualDispatcherOptions = Readonly<{
  eventStore: TriggerEventStorePort;
  processor: TriggerProcessorPort;
  now?: () => Date;
  createEventId?: ManualTriggerEventIdFactory;
}>;

/** Runtime port for explicit manual trigger dispatch. */
export interface ManualDispatcher {
  /** Persist and process a manual-fire event for the supplied trigger definition. */
  fire(
    definition: ProcessableTriggerDefinition,
    input?: ManualTriggerFireInput,
  ): Promise<ManualTriggerFireResponse>;
}

/** Create a manual trigger dispatcher from explicit runtime ports. */
export function createManualDispatcher(options: ManualDispatcherOptions): ManualDispatcher {
  return new DefaultManualDispatcher(options);
}

class DefaultManualDispatcher implements ManualDispatcher {
  readonly #eventStore: TriggerEventStorePort;
  readonly #processor: TriggerProcessorPort;
  readonly #now: () => Date;
  readonly #createEventId: ManualTriggerEventIdFactory;

  constructor(options: ManualDispatcherOptions) {
    this.#eventStore = options.eventStore;
    this.#processor = options.processor;
    this.#now = options.now ?? (() => new Date());
    this.#createEventId = options.createEventId ?? defaultEventId;
  }

  async fire(
    definition: ProcessableTriggerDefinition,
    input: ManualTriggerFireInput = {},
  ): Promise<ManualTriggerFireResponse> {
    const event = this.#createEvent(definition, input);
    await this.#eventStore.save(event);
    const result = await this.#processor.process(event, definition);
    const status = result.status === 'deferred' ? 'deferred' : 'pending';
    return {
      accepted: true,
      eventId: event.id,
      triggerId: event.triggerId,
      status,
    };
  }

  #createEvent(
    definition: ProcessableTriggerDefinition,
    input: ManualTriggerFireInput,
  ): TriggerEvent<'manual', ManualTriggerPayload<Readonly<Record<string, unknown>>>> {
    const now = this.#now().toISOString();
    return {
      id: this.#createEventId(definition, input),
      triggerId: definition.id,
      kind: 'manual',
      status: 'pending',
      payload: {
        payload: input.payload ?? {},
        firedBy: input.firedBy,
        reason: input.reason,
        firedAt: now,
      },
      attempt: 0,
      detectedAt: now,
      updatedAt: now,
      idempotencyKey: input.idempotencyKey,
      traceparent: input.traceparent,
      tracestate: input.tracestate,
    };
  }
}

function defaultEventId(): TriggerEventId {
  return `trg_evt_${crypto.randomUUID()}` as TriggerEventId;
}
