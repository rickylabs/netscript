import { PluginValidationError } from '../../domain/mod.ts';
import { SINGLETON_CONTRIBUTION_KEYS } from '../domain/contribution-identity.ts';
import type { BackgroundProcessorContribution } from '../domain/background-processor-contribution.ts';
import type { ContractVersionContribution } from '../domain/contract-version-contribution.ts';
import type { DbSchemaContribution } from '../domain/db-schema-contribution.ts';
import type { E2eContribution } from '../domain/e2e-contribution.ts';
import type { MigrationContribution } from '../domain/migration-contribution.ts';
import type { PluginContributions } from '../domain/plugin-contributions.ts';
import type { RuntimeConfigTopicContribution } from '../domain/runtime-config-topic-contribution.ts';
import type { SdkClientContributionReference } from '../domain/sdk-client-contribution-reference.ts';
import type { ServiceContribution } from '../domain/service-contribution.ts';
import type { StreamTopicContribution } from '../domain/stream-topic-contribution.ts';
import type { TelemetryContribution } from '../domain/telemetry-contribution.ts';

type DoctorCheck = NonNullable<NonNullable<PluginContributions['cli']>['doctorChecks']>[number];

/** Contribution groups with every collection key present and single-valued keys removed. */
export type CollectionContributions = Required<Omit<PluginContributions, 'aspire' | 'doctor'>>;

/**
 * Merge plugin contribution groups without mutating inputs.
 *
 * Collection keys (including `cli.doctorChecks`) concatenate. Single-valued keys (`aspire`,
 * `doctor`) hold one module per plugin, so setting one on both sides is a collision and throws
 * rather than silently keeping the last. Merge a whole root composition with
 * `validatePluginComposition`, which keeps those keys per plugin.
 *
 * @throws {PluginValidationError} When both groups set the same single-valued key.
 */
export function mergeContributions(
  left: PluginContributions = {},
  right: PluginContributions = {},
): PluginContributions {
  assertNoSingletonCollision(left, right);
  return {
    ...accumulateCollections([left, right]),
    aspire: right.aspire ?? left.aspire,
    doctor: right.doctor ?? left.doctor,
  };
}

/**
 * Concatenate every collection key across contribution groups in one pass.
 *
 * Each entry is appended exactly once, so the cost is linear in the total number of entries.
 */
export function accumulateCollections(
  groups: readonly PluginContributions[],
): CollectionContributions {
  const doctorChecks: DoctorCheck[] = [];
  const services: ServiceContribution[] = [];
  const sdkClients: SdkClientContributionReference[] = [];
  const backgroundProcessors: BackgroundProcessorContribution[] = [];
  const streamTopics: StreamTopicContribution[] = [];
  const databaseSchemas: DbSchemaContribution[] = [];
  const runtimeConfigTopics: RuntimeConfigTopicContribution[] = [];
  const contractVersions: ContractVersionContribution[] = [];
  const e2e: E2eContribution[] = [];
  const telemetry: TelemetryContribution[] = [];
  const migrations: MigrationContribution[] = [];

  for (const group of groups) {
    append(doctorChecks, group.cli?.doctorChecks);
    append(services, group.services);
    append(sdkClients, group.sdkClients);
    append(backgroundProcessors, group.backgroundProcessors);
    append(streamTopics, group.streamTopics);
    append(databaseSchemas, group.databaseSchemas);
    append(runtimeConfigTopics, group.runtimeConfigTopics);
    append(contractVersions, group.contractVersions);
    append(e2e, group.e2e);
    append(telemetry, group.telemetry);
    append(migrations, group.migrations);
  }

  return {
    cli: { doctorChecks },
    services,
    sdkClients,
    backgroundProcessors,
    streamTopics,
    databaseSchemas,
    runtimeConfigTopics,
    contractVersions,
    e2e,
    telemetry,
    migrations,
  };
}

function append<T>(target: T[], source: readonly T[] | undefined): void {
  if (source === undefined) return;
  for (const entry of source) target.push(entry);
}

function assertNoSingletonCollision(left: PluginContributions, right: PluginContributions): void {
  const issues = SINGLETON_CONTRIBUTION_KEYS
    .filter((axis) => left[axis] !== undefined && right[axis] !== undefined)
    .map((axis) =>
      `Contribution axis "${axis}" holds one module per plugin; merging "${
        String(left[axis])
      }" with "${String(right[axis])}" would drop one.`
    );
  if (issues.length > 0) {
    throw new PluginValidationError('Single-valued contribution axes collide.', issues);
  }
}
