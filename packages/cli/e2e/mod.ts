/**
 * Programmatic surface for NetScript CLI capability smoke suites.
 *
 * @example
 * ```ts
 * import { defineCliE2eSuite, SCAFFOLD } from '@netscript/cli-e2e';
 *
 * const suite = defineCliE2eSuite()
 *   .withId(SCAFFOLD.PLUGIN)
 *   .withWorkspace((workspace) => workspace.withRepoRoot('.'))
 *   .withScaffold((scaffold) => scaffold.withOfficialPluginSuite())
 *   .build();
 * ```
 *
 * @module
 */

export { defineCliE2eSuite } from './src/application/builders/define-cli-e2e-suite.ts';
export { createDefaultRunner } from './src/create-default-runner.ts';
export { createSuiteRunner } from './src/application/runner/suite-runner.ts';
export type { CommandExecutor } from './src/ports/command-executor.ts';
export type { DockerResourceCleaner } from './src/ports/docker-resource-cleaner.ts';
export type { HttpClient } from './src/ports/http-client.ts';
export type { Reporter } from './src/ports/reporter.ts';
export {
  ASPIRE_RESOURCE,
  GATE,
  GATE_PHASE,
  SCAFFOLD,
  SCAFFOLD_TITLE,
} from './src/domain/cli-surface.ts';
export {
  DATABASE,
  DEPLOY_TARGET,
  PACKAGE_SOURCE,
  PLUGIN,
  REPORT_FORMAT,
  RUNTIME,
} from './src/domain/extension-axes.ts';
export type { AspireResource, GateId, GatePhase, SuiteId } from './src/domain/cli-surface.ts';
export type { Evidence } from './src/domain/evidence.ts';
export type { GateDefinition, GateResult, GateVerdict } from './src/domain/gate-definition.ts';
export type { RunOptions, RunRequest } from './src/domain/run-context.ts';
export type { RunReport, StepResult } from './src/domain/report.ts';
export type { SuiteDefinition } from './src/domain/suite-definition.ts';
export type { SmokeProject } from './src/domain/smoke-project.ts';
