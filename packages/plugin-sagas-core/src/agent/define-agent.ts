import { defineSaga, type SagaBuilder } from '../builders/mod.ts';

/** Reserved agent-authoring entrypoint for future AI-agent saga integrations. */
export function defineAgent<TId extends string>(
  id: TId,
): SagaBuilder<TId, 'initial', never, never> {
  return defineSaga(id);
}
