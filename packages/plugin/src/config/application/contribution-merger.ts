import { PluginValidationError } from '../../domain/mod.ts';
import { SINGLETON_CONTRIBUTION_KEYS } from '../domain/contribution-identity.ts';
import type { PluginContributions } from '../domain/plugin-contributions.ts';

/**
 * Merge plugin contribution groups without mutating inputs.
 *
 * Collection axes concatenate. Single-valued axes (`aspire`, `doctor`) hold one module per plugin,
 * so setting one on both sides is a collision and throws rather than silently keeping the last.
 * Merge a whole root composition with `validatePluginComposition`, which keeps those axes per plugin.
 *
 * @throws {PluginValidationError} When both groups set the same single-valued axis.
 */
export function mergeContributions(
  left: PluginContributions = {},
  right: PluginContributions = {},
): PluginContributions {
  assertNoSingletonCollision(left, right);
  return {
    services: [...(left.services ?? []), ...(right.services ?? [])],
    sdkClients: [...(left.sdkClients ?? []), ...(right.sdkClients ?? [])],
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
    doctor: right.doctor ?? left.doctor,
  };
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
