import type { TriggerEvent } from '../domain/mod.ts';
import type {
  ProcessableTriggerDefinition,
  TriggerProcessorPort,
  TriggerProcessorStopOptions,
  TriggerProcessResult,
} from '../ports/mod.ts';

/** Inline processor that invokes handlers directly for tests. */
export class InlineTriggerProcessor implements TriggerProcessorPort {
  /** Events processed by this inline processor. */
  readonly processed: TriggerEvent[] = [];
  readonly #now: () => Date;
  #stopped = false;

  /** Create an inline processor with an optional clock hook. */
  constructor(options: Readonly<{ now?: () => Date }> = {}) {
    this.#now = options.now ?? (() => new Date());
  }

  /** Process a trigger event by invoking the definition handler directly. */
  async process<TDefinition extends ProcessableTriggerDefinition>(
    event: TriggerEvent,
    definition: TDefinition,
  ): Promise<TriggerProcessResult> {
    if (this.#stopped) {
      throw new Error('Inline trigger processor is stopped.');
    }
    this.processed.push(event);
    const actions = await Reflect.apply(definition.handler, undefined, [
      event,
      { triggerId: event.triggerId, now: this.#now },
    ]);
    if (!Array.isArray(actions)) {
      throw new TypeError('Inline trigger handler must return an array of actions.');
    }
    const deferred = actions.some(
      (action) =>
        typeof action === 'object' && action !== null && 'kind' in action &&
        action.kind === 'defer',
    );
    return {
      event,
      status: deferred ? 'deferred' : 'completed',
      actionsDispatched: actions.length,
    };
  }

  /** Stop the inline processor. */
  stop(_options?: TriggerProcessorStopOptions): Promise<void> {
    this.#stopped = true;
    return Promise.resolve();
  }
}
