import type { SuiteId } from './cli-surface.ts';
import type { GateDefinition } from './gate-definition.ts';
import type { RunOptions } from './run-context.ts';

/** Materialized E2E suite definition. */
export interface SuiteDefinition {
  readonly id: SuiteId;
  readonly title: string;
  readonly description: string;
  readonly defaultOptions: RunOptions;
  readonly gates: readonly GateDefinition[];
}
