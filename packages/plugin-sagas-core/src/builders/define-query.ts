import type { QueryDefinition } from '../domain/mod.ts';
import { SagasError } from '../domain/mod.ts';

/** Define a synchronous read-only query for a running saga instance. */
export function defineQuery<TResult = unknown, TName extends string = string>(
  name: TName,
): QueryDefinition<TResult, TName> {
  if (name.trim().length === 0) {
    throw SagasError.validationFailed('Query name must not be empty.');
  }
  return Object.freeze({ name: name.trim() as TName });
}
