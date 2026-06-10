/**
 * Manifest verification for `@netscript/plugin-streams`.
 *
 * @module
 */

import { type InspectionReport, inspectPlugin } from '@netscript/plugin';
import { streamsPlugin } from './mod.ts';

/** Result returned by the streams plugin verifier. */
export interface StreamsPluginVerificationResult {
  /** Whether the manifest satisfied the expected plugin contract. */
  readonly ok: boolean;
  /** Plugin inspector report for the manifest. */
  readonly inspection: InspectionReport;
  /** Human-readable verification findings. */
  readonly findings: readonly string[];
}

/** Verify that the streams plugin manifest exposes the expected contribution axes. */
export function verifyStreamsPlugin(): StreamsPluginVerificationResult {
  const findings: string[] = [];
  const inspection = inspectPlugin(streamsPlugin);

  if (streamsPlugin.name !== '@netscript/plugin-streams') {
    findings.push(`expected plugin name @netscript/plugin-streams, got ${streamsPlugin.name}`);
  }

  if (streamsPlugin.version !== '0.0.1-alpha.0') {
    findings.push(`expected version 0.0.1-alpha.0, got ${streamsPlugin.version}`);
  }

  if (
    streamsPlugin.contributions.services?.some((service) => service.name === 'streams') !== true
  ) {
    findings.push('expected a streams service contribution');
  }

  if (
    streamsPlugin.contributions.telemetry?.some((telemetry) => telemetry.name === 'streams') !==
      true
  ) {
    findings.push('expected a streams telemetry contribution');
  }

  if (streamsPlugin.contributions.e2e?.some((gate) => gate.name === 'streams-health') !== true) {
    findings.push('expected a streams-health E2E contribution');
  }

  if (streamsPlugin.contributions.aspire !== './src/aspire/mod.ts') {
    findings.push('expected the streams Aspire contribution module');
  }

  if (typeof streamsPlugin.defineTopic !== 'function') {
    findings.push('expected defineTopic helper');
  }
  if (typeof streamsPlugin.defineProducer !== 'function') {
    findings.push('expected defineProducer helper');
  }
  if (typeof streamsPlugin.defineConsumer !== 'function') {
    findings.push('expected defineConsumer helper');
  }

  return {
    ok: findings.length === 0,
    inspection,
    findings,
  };
}

if (import.meta.main) {
  const result = verifyStreamsPlugin();
  console.log(JSON.stringify(result, null, 2));
  Deno.exitCode = result.ok ? 0 : 1;
}
