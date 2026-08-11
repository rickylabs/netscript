import type { PluginSuiteState } from '../../builders/scaffold/plugin-suite-state.ts';
import { DATABASE, type DatabaseEngine } from '../../../domain/extension-axes.ts';
import { GATE } from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import {
  createBehaviorPluginHealthGates,
  createBehaviorPluginUnhealthyGates,
  createPluginRegistryGenerationGates,
} from './behavior-plugins-health-gate.ts';
import {
  createDatabaseGates,
  createGeneratedCheckGates,
  createProjectBoundaryGates,
} from './database-gates.ts';
import { createGeneratedPluginCheckGates } from './generated-plugins-check-gate.ts';
import { createGeneratedQualityGates } from './generated-quality-gate.ts';
import { createOtelGates } from './otel-gates.ts';
import { createPluginContractGates } from './plugin-contract-gates.ts';
import { createCleanupGates, createRuntimeGates } from './runtime-gates.ts';
import { createPreflightGates, createScaffoldGates } from './scaffold-gates.ts';
import { createServiceEnvironmentGates } from './service-env/service-env-gates.ts';
import { createUiAiGates } from './ui-ai-gates.ts';

/** Build the scaffold capability gate list. */
export function createScaffoldCapabilityGates(
  state: PluginSuiteState,
  database: DatabaseEngine = DATABASE.POSTGRES,
): readonly GateDefinition[] {
  const databaseGates = createDatabaseGates();
  const offlineDatabaseGates = databaseGates.filter((gate) =>
    gate.id === GATE.DATABASE_LIST || gate.id === GATE.DATABASE_CODEGEN
  );
  const residentDatabaseGates = databaseGates.filter((gate) =>
    !offlineDatabaseGates.includes(gate)
  );
  const runtimeGates = createRuntimeGates(database);
  const startIndex = runtimeGates.findIndex((gate) => gate.id === GATE.RUNTIME_ASPIRE_START);
  if (startIndex < 0) throw new Error('runtime gates must include Aspire start');

  return [
    ...createPreflightGates(),
    ...createScaffoldGates(state),
    ...createPluginContractGates(),
    ...createUiAiGates(),
    ...offlineDatabaseGates,
    ...createGeneratedCheckGates(),
    ...createProjectBoundaryGates(),
    ...createBehaviorPluginUnhealthyGates(),
    ...createGeneratedPluginCheckGates(),
    ...createPluginRegistryGenerationGates(),
    ...createGeneratedQualityGates(),
    ...runtimeGates.slice(0, startIndex + 1),
    ...residentDatabaseGates,
    ...runtimeGates.slice(startIndex + 1),
    ...createBehaviorPluginHealthGates(),
    ...createOtelGates(),
    // Registration only — the suite gate lists in `capability-suites.ts` decide
    // where the fixture and the verification run relative to AppHost start.
    ...createServiceEnvironmentGates(),
    ...createCleanupGates(),
  ];
}
