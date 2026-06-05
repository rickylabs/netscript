import type { SuiteDefinition } from '../../../domain/suite-definition.ts';
import type { SuiteBuilderState } from './suite-builder-state.ts';
import { validateSuiteState } from './suite-builder-validation.ts';

/** Materialize an immutable suite definition from builder state. */
export function createSuiteDefinition(state: SuiteBuilderState): SuiteDefinition {
  validateSuiteState(state);
  return Object.freeze({
    id: state.id,
    title: state.title,
    description: state.description,
    defaultOptions: Object.freeze({ ...state.options }),
    gates: Object.freeze([...state.gates]),
  });
}
