import type { SuiteDefinition } from '../../../domain/suite-definition.ts';
import { SCAFFOLD, SCAFFOLD_TITLE } from '../../../domain/cli-surface.ts';
import type { SuiteId } from '../../../domain/cli-surface.ts';
import {
  createScaffoldSuiteBuilder,
  type ScaffoldSuiteBuilder,
} from '../scaffold/scaffold-suite-builder.ts';
import { createReportingBuilder, type ReportingBuilder } from '../reporting/reporting-builder.ts';
import { defaultRunOptions } from '../workspace/suite-builder-options.ts';
import { createWorkspaceBuilder, type WorkspaceBuilder } from '../workspace/workspace-builder.ts';
import type { SuiteBuilderState } from './suite-builder-state.ts';
import { createSuiteDefinition } from './suite-definition-factory.ts';

/** Root fluent builder for CLI E2E suites. */
export interface SuiteBuilder {
  withId(id: SuiteId): SuiteBuilder;
  withTitle(title: string): SuiteBuilder;
  withWorkspace(configure: (builder: WorkspaceBuilder) => WorkspaceBuilder): SuiteBuilder;
  withScaffold(configure: (builder: ScaffoldSuiteBuilder) => ScaffoldSuiteBuilder): SuiteBuilder;
  withReporting(configure: (builder: ReportingBuilder) => ReportingBuilder): SuiteBuilder;
  build(): SuiteDefinition;
}

/** Create a root suite builder. */
export function createSuiteBuilder(): SuiteBuilder {
  const state: SuiteBuilderState = {
    id: SCAFFOLD.PLUGIN,
    title: SCAFFOLD_TITLE.PLUGIN,
    description: 'Generated project scaffold, official plugins, DB, Aspire, and behavior gates.',
    options: defaultRunOptions(),
    gates: [],
  };
  return {
    withId(id) {
      state.id = id;
      return this;
    },
    withTitle(title) {
      state.title = title;
      return this;
    },
    withWorkspace(configure) {
      state.options = configure(createWorkspaceBuilder(state.options)).buildOptions();
      return this;
    },
    withScaffold(configure) {
      const builder = configure(createScaffoldSuiteBuilder(state.options.database));
      state.gates.push(...builder.buildGates());
      return this;
    },
    withReporting(configure) {
      state.options = {
        ...state.options,
        ...configure(createReportingBuilder(state.options)).buildOptions(),
      };
      return this;
    },
    build() {
      return createSuiteDefinition(state);
    },
  };
}
