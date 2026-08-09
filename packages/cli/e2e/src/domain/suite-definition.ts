import type { GateId, SuiteId } from './cli-surface.ts';
import type { GateDefinition } from './gate-definition.ts';
import type { RunOptions } from './run-context.ts';

/** An executable gate intentionally excluded from a suite until its owning issue is resolved. */
export interface DeferredGate {
  readonly id: GateId;
  readonly issue: `#${number}`;
  readonly reason: string;
}

/** Materialized E2E suite definition. */
export interface SuiteDefinition {
  readonly id: SuiteId;
  readonly title: string;
  readonly description: string;
  readonly defaultOptions: RunOptions;
  readonly gates: readonly GateDefinition[];
  readonly deferredGates?: readonly DeferredGate[];
}
