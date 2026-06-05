import type { PluginContributions } from '../domain/plugin-contributions.ts';

/** Merge plugin contribution groups without mutating inputs. */
export function mergeContributions(
  left: PluginContributions = {},
  right: PluginContributions = {},
): PluginContributions {
  return {
    services: [...(left.services ?? []), ...(right.services ?? [])],
    backgroundProcessors: [
      ...(left.backgroundProcessors ?? []),
      ...(right.backgroundProcessors ?? []),
    ],
    streamTopics: [...(left.streamTopics ?? []), ...(right.streamTopics ?? [])],
    databaseSchemas: [...(left.databaseSchemas ?? []), ...(right.databaseSchemas ?? [])],
    runtimeConfigTopics: [
      ...(left.runtimeConfigTopics ?? []),
      ...(right.runtimeConfigTopics ?? []),
    ],
    contractVersions: [...(left.contractVersions ?? []), ...(right.contractVersions ?? [])],
    e2e: [...(left.e2e ?? []), ...(right.e2e ?? [])],
    telemetry: [...(left.telemetry ?? []), ...(right.telemetry ?? [])],
    migrations: [...(left.migrations ?? []), ...(right.migrations ?? [])],
    aspire: right.aspire ?? left.aspire,
  };
}
