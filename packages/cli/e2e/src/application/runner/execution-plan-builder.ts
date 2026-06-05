import type { GateId } from '../../domain/cli-surface.ts';
import type { GateDefinition } from '../../domain/gate-definition.ts';
import type { SuiteDefinition } from '../../domain/suite-definition.ts';

/** Select the gate sequence for a run or a targeted gate invocation. */
export function buildExecutionPlan(
  suite: SuiteDefinition,
  gateId?: GateId,
): readonly GateDefinition[] {
  if (!gateId) return suite.gates;
  const gate = suite.gates.find((item) => item.id === gateId);
  if (!gate) {
    throw new Error(`Unknown gate "${gateId}" for suite "${suite.id}".`);
  }
  return [gate];
}
