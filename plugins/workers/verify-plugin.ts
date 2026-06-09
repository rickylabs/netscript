/**
 * Manifest verification for `@netscript/plugin-workers`.
 *
 * @module
 */

import { type InspectionReport, inspectPlugin } from '@netscript/plugin';
import { workersPlugin } from './mod.ts';

/** Result returned by the workers plugin verifier. */
export interface WorkersPluginVerificationResult {
  /** Whether the manifest satisfied the expected plugin contract. */
  readonly ok: boolean;
  /** Plugin inspector report for the manifest. */
  readonly inspection: InspectionReport;
  /** Human-readable verification findings. */
  readonly findings: readonly string[];
}

/** Verify that the workers plugin manifest exposes the expected contribution axes. */
export function verifyWorkersPlugin(): WorkersPluginVerificationResult {
  const findings: string[] = [];
  const inspection = inspectPlugin(workersPlugin);

  if (workersPlugin.name !== '@netscript/plugin-workers') {
    findings.push(`expected plugin name @netscript/plugin-workers, got ${workersPlugin.name}`);
  }

  if (workersPlugin.version !== '0.0.1-alpha.0') {
    findings.push(`expected version 0.0.1-alpha.0, got ${workersPlugin.version}`);
  }

  if (!workersPlugin.dependencies?.streams) {
    findings.push('expected streams plugin dependency');
  }

  if (
    workersPlugin.contributions.services?.some((service) => service.name === 'workers-api') !== true
  ) {
    findings.push('expected a workers-api service contribution');
  }

  const processors = workersPlugin.contributions.backgroundProcessors ?? [];
  for (const name of ['workers-combined', 'workers-worker', 'workers-scheduler']) {
    if (processors.some((processor) => processor.name === name) !== true) {
      findings.push(`expected ${name} background processor contribution`);
    }
  }

  const topics = workersPlugin.contributions.streamTopics ?? [];
  for (const name of ['workers.jobs', 'workers.tasks', 'workers.workflows']) {
    if (topics.some((topic) => topic.name === name) !== true) {
      findings.push(`expected ${name} stream topic contribution`);
    }
  }

  if (
    workersPlugin.contributions.databaseSchemas?.some((schema) =>
      schema.path === './database/workers.prisma' && schema.engine === 'postgres'
    ) !== true
  ) {
    findings.push('expected the workers Prisma database schema contribution');
  }

  if (
    workersPlugin.contributions.contractVersions?.some((contract) =>
      contract.version === 'v1' && contract.loader === './contracts/v1/mod.ts'
    ) !== true
  ) {
    findings.push('expected the workers v1 contract contribution');
  }

  if (
    workersPlugin.contributions.runtimeConfigTopics?.some((topic) => topic.name === 'workers') !==
      true
  ) {
    findings.push('expected the workers runtime config topic contribution');
  }

  if (
    workersPlugin.contributions.e2e?.some((gate) =>
      gate.name === 'workers-health' && gate.command === 'deno task workers:e2e'
    ) !== true
  ) {
    findings.push('expected the workers-health E2E contribution');
  }

  if (workersPlugin.contributions.aspire !== './src/aspire/mod.ts') {
    findings.push('expected the workers Aspire contribution module');
  }

  return {
    ok: findings.length === 0,
    inspection,
    findings,
  };
}

if (import.meta.main) {
  const result = verifyWorkersPlugin();
  console.log(JSON.stringify(result, null, 2));
  Deno.exitCode = result.ok ? 0 : 1;
}
