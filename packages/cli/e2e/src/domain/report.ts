import type { Evidence } from './evidence.ts';
import type { GateId, SuiteId } from './cli-surface.ts';
import type { GateVerdict } from './gate-definition.ts';

/** Result for a single gate or step. */
export interface StepResult {
  readonly id: GateId;
  readonly title: string;
  readonly verdict: GateVerdict;
  readonly durationMs: number;
  readonly critical: boolean;
  readonly evidence: readonly Evidence[];
  readonly error?: string;
}

/** Final suite report. */
export interface RunReport {
  readonly ok: boolean;
  readonly suiteId: SuiteId;
  readonly projectRoot: string;
  readonly startedAt: string;
  readonly durationMs: number;
  readonly steps: readonly StepResult[];
  readonly summary: {
    readonly passed: number;
    readonly failed: number;
    readonly skipped: number;
  };
}
