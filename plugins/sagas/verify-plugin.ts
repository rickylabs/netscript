/**
 * Manifest verification for `@netscript/plugin-sagas`.
 *
 * @module
 */

import { type InspectionReport, inspectPlugin } from '@netscript/plugin';
import { sagasPlugin } from './mod.ts';

export type { InspectionReport } from '@netscript/plugin';

/** Result returned by the sagas plugin verifier. */
export interface SagasPluginVerificationResult {
  /** Whether the manifest satisfied the expected plugin contract. */
  readonly ok: boolean;
  /** Plugin inspector report for the manifest. */
  readonly inspection: InspectionReport;
  /** Human-readable verification findings. */
  readonly findings: readonly string[];
}

/** Verify that the sagas plugin manifest exposes the expected contribution axes. */
export function verifySagasPlugin(): SagasPluginVerificationResult {
  const findings: string[] = [];
  const inspection = inspectPlugin(sagasPlugin);

  if (sagasPlugin.name !== '@netscript/plugin-sagas') {
    findings.push(`expected plugin name @netscript/plugin-sagas, got ${sagasPlugin.name}`);
  }

  if (sagasPlugin.version !== '0.1.0') {
    findings.push(`expected version 0.1.0, got ${sagasPlugin.version}`);
  }

  if (!sagasPlugin.dependencies?.workers) {
    findings.push('expected workers plugin dependency');
  }
  if (!sagasPlugin.dependencies?.streams) {
    findings.push('expected streams plugin dependency');
  }

  if (
    sagasPlugin.contributions.services?.some((service) => service.name === 'sagas-api') !== true
  ) {
    findings.push('expected a sagas-api service contribution');
  }

  if (
    sagasPlugin.contributions.databaseSchemas?.some((schema) =>
      schema.path === './database/sagas.prisma' && schema.engine === 'postgres'
    ) !== true
  ) {
    findings.push('expected the sagas Prisma database schema contribution');
  }

  if (
    sagasPlugin.contributions.contractVersions?.some((contract) =>
      contract.version === 'v1' && contract.loader === './contracts/v1/mod.ts'
    ) !== true
  ) {
    findings.push('expected the sagas v1 contract contribution');
  }

  if (
    sagasPlugin.contributions.runtimeConfigTopics?.some((topic) => topic.name === 'sagas') !== true
  ) {
    findings.push('expected the sagas runtime config topic contribution');
  }

  if (sagasPlugin.contributions.aspire !== './src/aspire/mod.ts') {
    findings.push('expected the sagas Aspire contribution module');
  }

  return {
    ok: findings.length === 0,
    inspection,
    findings,
  };
}

if (import.meta.main) {
  const result = verifySagasPlugin();
  console.log(JSON.stringify(result, null, 2));
  Deno.exitCode = result.ok ? 0 : 1;
}
