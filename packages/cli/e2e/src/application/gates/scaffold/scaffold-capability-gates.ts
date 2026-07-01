import type { PluginSuiteState } from '../../builders/scaffold/plugin-suite-state.ts';
import { DATABASE, type DatabaseEngine } from '../../../domain/extension-axes.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import { createBehaviorPluginHealthGates } from './behavior-plugins-health-gate.ts';
import { createDatabaseGates, createGeneratedCheckGates } from './database-gates.ts';
import { createGeneratedPluginCheckGates } from './generated-plugins-check-gate.ts';
import { createOtelGates } from './otel-gates.ts';
import { createCleanupGates, createRuntimeGates } from './runtime-gates.ts';
import { createPreflightGates, createScaffoldGates } from './scaffold-gates.ts';

/** Build the scaffold capability gate list. */
export function createScaffoldCapabilityGates(
  state: PluginSuiteState,
  database: DatabaseEngine = DATABASE.POSTGRES,
): readonly GateDefinition[] {
  return [
    ...createPreflightGates(),
    ...createScaffoldGates(state),
    ...createDatabaseGates(),
    ...createGeneratedCheckGates(),
    ...createGeneratedPluginCheckGates(),
    ...createRuntimeGates(database),
    ...createBehaviorPluginHealthGates(),
    ...createOtelGates(),
    ...createCleanupGates(),
  ];
}
