import { createSuiteBuilder, type SuiteBuilder } from './suite/suite-builder.ts';

/**
 * Start a fluent CLI E2E suite definition.
 *
 * @returns A suite builder ready for workspace, scaffold, and reporting steps.
 *
 * @example
 * ```ts
 * const suite = defineCliE2eSuite()
 *   .withWorkspace((workspace) => workspace.withRepoRoot('.'))
 *   .withScaffold((scaffold) => scaffold.withOfficialPluginSuite())
 *   .build();
 * ```
 */
export function defineCliE2eSuite(): SuiteBuilder {
  return createSuiteBuilder();
}
