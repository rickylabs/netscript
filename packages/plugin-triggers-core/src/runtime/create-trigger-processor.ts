import { TriggerProcessor, type TriggerProcessorOptions } from './trigger-processor.ts';

/** Create a trigger processor runtime from explicit dependencies. */
export function createTriggerProcessor(options: TriggerProcessorOptions): TriggerProcessor {
  return new TriggerProcessor(options);
}
