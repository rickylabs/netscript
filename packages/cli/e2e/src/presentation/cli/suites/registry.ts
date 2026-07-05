import { DEPLOY, DEPLOY_TITLE, SCAFFOLD, SCAFFOLD_TITLE } from '../../../domain/cli-surface.ts';
import type { GateId, SuiteId } from '../../../domain/cli-surface.ts';
import type { RunOptions } from '../../../domain/run-context.ts';
import type { SuiteDefinition } from '../../../domain/suite-definition.ts';
import {
  createScaffoldCapabilitySuite,
  scaffoldCapabilitySuites,
} from '../../../../suites/scaffold/capability-suites.ts';
import { createDeployTargetsSuite } from '../../../../suites/deploy/deploy-targets-suite.ts';
import { createTrueUserlandInstallSuite } from '../../../../suites/scaffold/true-userland-install-suite.ts';

/** Built-in suite descriptor. */
export interface BuiltInSuite {
  readonly id: SuiteId;
  readonly title: string;
  create(overrides?: Partial<RunOptions>): SuiteDefinition;
}

const scaffoldBuiltInSuites: readonly BuiltInSuite[] = scaffoldCapabilitySuites.map((
  capability,
) => ({
  id: capability.id,
  title: capability.title,
  create: (overrides?: Partial<RunOptions>) => createScaffoldCapabilitySuite(capability, overrides),
}));

/** Registry of built-in suites. */
export const builtInSuites: readonly BuiltInSuite[] = [
  ...scaffoldBuiltInSuites,
  {
    id: SCAFFOLD.USERLAND_INSTALL,
    title: SCAFFOLD_TITLE.USERLAND_INSTALL,
    create: createTrueUserlandInstallSuite,
  },
  {
    id: DEPLOY.TARGETS,
    title: DEPLOY_TITLE.TARGETS,
    create: createDeployTargetsSuite,
  },
];

/** Resolve a suite by id. */
export function resolveSuite(id: string, overrides: Partial<RunOptions> = {}): SuiteDefinition {
  const found = builtInSuites.find((suite) => suite.id === id);
  if (!found) {
    throw new Error(`Unknown suite "${id}".`);
  }
  const suite = found.create(overrides);
  return { ...suite, defaultOptions: { ...suite.defaultOptions, ...overrides } };
}

/** Resolve and type a gate id from a materialized suite. */
export function resolveGateId(suite: SuiteDefinition, id: string): GateId {
  const found = suite.gates.find((gate) => gate.id === id);
  if (!found) {
    throw new Error(`Unknown gate "${id}" for suite "${suite.id}".`);
  }
  return found.id;
}
