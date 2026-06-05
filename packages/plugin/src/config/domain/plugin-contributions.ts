import type { BackgroundProcessorContribution } from './background-processor-contribution.ts';
import type { ContractVersionContribution } from './contract-version-contribution.ts';
import type { DbSchemaContribution } from './db-schema-contribution.ts';
import type { E2eContribution } from './e2e-contribution.ts';
import type { MigrationContribution } from './migration-contribution.ts';
import type { RuntimeConfigTopicContribution } from './runtime-config-topic-contribution.ts';
import type { ServiceContribution } from './service-contribution.ts';
import type { StreamTopicContribution } from './stream-topic-contribution.ts';
import type { TelemetryContribution } from './telemetry-contribution.ts';

/** Contribution groups supported by plugin manifests. */
export interface PluginContributions {
  /** Service contributions registered by the plugin. */
  readonly services?: readonly ServiceContribution[];
  /** Background processor contributions registered by the plugin. */
  readonly backgroundProcessors?: readonly BackgroundProcessorContribution[];
  /** Stream topic contributions registered by the plugin. */
  readonly streamTopics?: readonly StreamTopicContribution[];
  /** Database schema contributions registered by the plugin. */
  readonly databaseSchemas?: readonly DbSchemaContribution[];
  /** Runtime config topic contributions registered by the plugin. */
  readonly runtimeConfigTopics?: readonly RuntimeConfigTopicContribution[];
  /** Contract version contributions registered by the plugin. */
  readonly contractVersions?: readonly ContractVersionContribution[];
  /** End-to-end test contributions registered by the plugin. */
  readonly e2e?: readonly E2eContribution[];
  /** Telemetry contributions registered by the plugin. */
  readonly telemetry?: readonly TelemetryContribution[];
  /** Migration contributions registered by the plugin. */
  readonly migrations?: readonly MigrationContribution[];
  /** Aspire contribution module reference. */
  readonly aspire?: string;
}
