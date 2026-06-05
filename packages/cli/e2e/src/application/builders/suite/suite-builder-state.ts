import type { RunOptions } from '../../../domain/run-context.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import type { SuiteId } from '../../../domain/cli-surface.ts';

/** Mutable accumulator owned by the suite builder closure. */
export interface SuiteBuilderState {
  id: SuiteId;
  title: string;
  description: string;
  options: RunOptions;
  gates: GateDefinition[];
}
