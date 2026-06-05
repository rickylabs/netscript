import type { TriggerContext, TriggerDefinition, TriggerEvent } from '../domain/mod.ts';
import type {
  TriggerProcessorPort,
  TriggerProcessorStopOptions,
  TriggerProcessResult,
} from '../ports/mod.ts';

/** Inline processor that invokes handlers directly for tests. */
export class InlineTriggerProcessor implements TriggerProcessorPort {
  readonly processed: TriggerEvent[] = [];
  readonly #now: () => Date;
  #stopped = false;

  constructor(options: Readonly<{ now?: () => Date }> = {}) {
    this.#now = options.now ?? (() => new Date());
  }

  async process<TDefinition extends TriggerDefinition<string, never, never>>(
    event: TriggerEvent,
    definition: TDefinition,
  ): Promise<TriggerProcessResult> {
    if (this.#stopped) {
      throw new Error('Inline trigger processor is stopped.');
    }
    this.processed.push(event);
    const processable = definition as unknown as TriggerDefinition<
      string,
      TriggerEvent,
      TriggerContext
    >;
    const actions = await processable.handler(event, {
      triggerId: event.triggerId,
      now: this.#now,
    });
    const deferred = actions.some((action) => action.kind === 'defer');
    return {
      event,
      status: deferred ? 'deferred' : 'completed',
      actionsDispatched: actions.length,
    };
  }

  stop(_options?: TriggerProcessorStopOptions): Promise<void> {
    this.#stopped = true;
    return Promise.resolve();
  }
}
