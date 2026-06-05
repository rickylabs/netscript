import type { SignalDefinition } from '../domain/mod.ts';
import { SagasError } from '../domain/mod.ts';

/** Define a signal that can be sent to a running saga instance. */
export function defineSignal<TPayload = unknown, TName extends string = string>(
  name: TName,
): SignalDefinition<TPayload, TName> {
  if (name.trim().length === 0) {
    throw SagasError.validationFailed('Signal name must not be empty.');
  }
  return Object.freeze({ name: name.trim() as TName });
}
