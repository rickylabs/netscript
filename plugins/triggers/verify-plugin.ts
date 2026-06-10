/**
 * Manifest verification for `@netscript/plugin-triggers`.
 *
 * @module
 */

import { type InspectionReport, inspectPlugin } from '@netscript/plugin';
import {
  TRIGGERS_API_DEFAULT_PORT,
  TRIGGERS_API_SERVICE_NAME,
  TRIGGERS_PLUGIN_ID,
  TRIGGERS_PLUGIN_VERSION,
  triggersPlugin,
} from './mod.ts';

export type { InspectionReport } from '@netscript/plugin';

/** Result returned by the triggers plugin verifier. */
export interface TriggersPluginVerificationResult {
  /** Whether the manifest satisfied the expected plugin contract. */
  readonly ok: boolean;
  /** Plugin inspector report for the manifest. */
  readonly inspection: InspectionReport;
  /** Human-readable verification findings. */
  readonly findings: readonly string[];
}

/** Verify that the triggers plugin manifest exposes the expected contribution axes. */
export function verifyTriggersPlugin(): TriggersPluginVerificationResult {
  const findings: string[] = [];
  const inspection = inspectPlugin(triggersPlugin);

  if (triggersPlugin.name !== '@netscript/plugin-triggers') {
    findings.push(`expected plugin name @netscript/plugin-triggers, got ${triggersPlugin.name}`);
  }

  if (triggersPlugin.version !== TRIGGERS_PLUGIN_VERSION) {
    findings.push(`expected version ${TRIGGERS_PLUGIN_VERSION}, got ${triggersPlugin.version}`);
  }

  for (const dependency of ['workersCore', 'streamsCore', 'sagasCore'] as const) {
    if (!triggersPlugin.dependencies?.[dependency]) {
      findings.push(`expected ${dependency} plugin dependency`);
    }
  }

  if (
    triggersPlugin.contributions.services?.some((service) =>
      service.name === TRIGGERS_API_SERVICE_NAME &&
      service.entrypoint === './services/src/main.ts' &&
      service.port === TRIGGERS_API_DEFAULT_PORT
    ) !== true
  ) {
    findings.push('expected the triggers-api service contribution');
  }

  if (
    triggersPlugin.contributions.contractVersions?.some((contract) =>
      contract.version === 'v1' && contract.loader === './contracts/v1/mod.ts'
    ) !== true
  ) {
    findings.push('expected the triggers v1 contract contribution');
  }

  if (
    triggersPlugin.contributions.runtimeConfigTopics?.some((topic) =>
      topic.name === TRIGGERS_PLUGIN_ID && topic.schemaPath === './runtime/triggers.schema.json'
    ) !== true
  ) {
    findings.push('expected the triggers runtime config topic contribution');
  }

  if (triggersPlugin.contributions.aspire !== './src/aspire/mod.ts') {
    findings.push('expected the triggers Aspire contribution module');
  }

  return {
    ok: findings.length === 0,
    inspection,
    findings,
  };
}

if (import.meta.main) {
  const result = verifyTriggersPlugin();
  console.log(JSON.stringify(result, null, 2));
  Deno.exitCode = result.ok ? 0 : 1;
}
