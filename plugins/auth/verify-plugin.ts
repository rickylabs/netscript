/**
 * Manifest verification for `@netscript/plugin-auth`.
 *
 * @module
 */

import { type InspectionReport, inspectPlugin } from '@netscript/plugin';
import { authPlugin } from './mod.ts';

export type { InspectionReport } from '@netscript/plugin';

/** Result returned by the auth plugin verifier. */
export interface AuthPluginVerificationResult {
  /** Whether the manifest satisfied the expected plugin contract. */
  readonly ok: boolean;
  /** Plugin inspector report for the manifest. */
  readonly inspection: InspectionReport;
  /** Human-readable verification findings. */
  readonly findings: readonly string[];
}

/** Verify that the auth plugin manifest exposes the expected contribution axes. */
export function verifyAuthPlugin(): AuthPluginVerificationResult {
  const findings: string[] = [];
  const inspection = inspectPlugin(authPlugin);

  if (authPlugin.name !== '@netscript/plugin-auth') {
    findings.push(`expected plugin name @netscript/plugin-auth, got ${authPlugin.name}`);
  }

  if (authPlugin.version !== '0.1.0') {
    findings.push(`expected version 0.1.0, got ${authPlugin.version}`);
  }

  if (
    authPlugin.contributions.services?.some((service) => service.name === 'auth-api') !== true
  ) {
    findings.push('expected an auth-api service contribution');
  }

  if (
    authPlugin.contributions.contractVersions?.some((contract) =>
      contract.version === 'v1' && contract.loader === './contracts.ts'
    ) !== true
  ) {
    findings.push('expected the auth v1 contract contribution');
  }

  if (
    authPlugin.contributions.runtimeConfigTopics?.some((topic) => topic.name === 'auth') !== true
  ) {
    findings.push('expected the auth runtime config topic contribution');
  }

  return {
    ok: findings.length === 0,
    inspection,
    findings,
  };
}

if (import.meta.main) {
  const result = verifyAuthPlugin();
  console.log(JSON.stringify(result, null, 2));
  Deno.exitCode = result.ok ? 0 : 1;
}
