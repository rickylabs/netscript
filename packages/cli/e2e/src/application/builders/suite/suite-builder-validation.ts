import type { SuiteBuilderState } from './suite-builder-state.ts';

/** Validate that a suite has enough structure to execute. */
export function validateSuiteState(state: SuiteBuilderState): void {
  if (state.id.trim().length === 0) {
    throw new Error('Suite id is required.');
  }
  if (state.gates.length === 0) {
    throw new Error(`Suite "${state.id}" must define at least one gate.`);
  }
}
