/** Structured, non-secret provider compatibility canary contracts and evaluation. */

import type { RouteIdentity, RuntimeDiagnostic } from './contract.ts';
import {
  matchOpenRouterPreset,
  type OpenRouterIncompatibility,
  resolveProviderProfile,
} from './provider-profiles.ts';

export const PROVIDER_CANARY_CAPABILITIES = ['tools', 'reasoning', 'streaming'] as const;
export type ProviderCanaryCapability = typeof PROVIDER_CANARY_CAPABILITIES[number];
export type ProviderCapabilityStatus = 'supported' | 'unsupported' | 'unknown' | 'not_applicable';
export type ProviderCanaryStatus = 'passed' | 'blocked' | 'failed';
export type ProviderIncompatibility = OpenRouterIncompatibility;

export interface ProviderCanaryObservation {
  readonly credential: 'available' | 'absent';
  readonly exitCode: number | null;
  readonly timedOut: boolean;
  readonly malformed: boolean;
  readonly incompatibility: ProviderIncompatibility | null;
  readonly eventCounts: Readonly<Record<ProviderCanaryCapability, number>>;
}

export interface ProviderCompatibilityEvidence {
  readonly profileId: import('./provider-profiles.ts').ProviderProfileId;
  readonly agent: RouteIdentity['agent'];
  readonly provider: RouteIdentity['provider'];
  readonly model: string;
  readonly effort: RouteIdentity['effort'];
  readonly credential: ProviderCanaryObservation['credential'];
  readonly remoteControl: 'available' | 'unavailable' | 'not_applicable';
  readonly experimentalNonAnthropicModel: boolean;
  readonly capabilities: Readonly<Record<ProviderCanaryCapability, ProviderCapabilityStatus>>;
  readonly eventCounts: Readonly<Record<ProviderCanaryCapability, number>>;
  readonly incompatibility: ProviderIncompatibility | null;
  readonly incompatibilitySource: 'declared' | 'observed' | null;
}

export interface ProviderCanaryResult {
  readonly status: ProviderCanaryStatus;
  readonly fanOutEligible: boolean;
  readonly evidence: ProviderCompatibilityEvidence | null;
  readonly diagnostics: readonly RuntimeDiagnostic[];
  readonly process: Readonly<{ exitCode: number | null; timedOut: boolean }>;
}

function diagnostic(
  code: RuntimeDiagnostic['code'],
  category: RuntimeDiagnostic['category'],
  message: string,
): RuntimeDiagnostic {
  return { code, category, retryable: false, message };
}

/** Evaluates safe event counts; unknown or unsupported required behavior always blocks fan-out. */
export function evaluateProviderCanary(
  route: RouteIdentity,
  observation: ProviderCanaryObservation,
): ProviderCanaryResult {
  const profile = resolveProviderProfile(route);
  if (!profile) {
    return {
      status: 'blocked',
      fanOutEligible: false,
      evidence: null,
      diagnostics: [diagnostic(
        'unsupported_route',
        'provider',
        'provider canary requires a supported explicit profile',
      )],
      process: { exitCode: observation.exitCode, timedOut: observation.timedOut },
    };
  }
  const customClaude = profile.endpointKind !== 'native' && profile.agent === 'claude';
  const declaredIncompatibility = matchOpenRouterPreset(route)?.incompatibility ?? null;
  const incompatibility = observation.incompatibility ?? declaredIncompatibility;
  const incompatibilitySource = observation.incompatibility
    ? 'observed'
    : declaredIncompatibility
    ? 'declared'
    : null;
  const capabilities = Object.fromEntries(PROVIDER_CANARY_CAPABILITIES.map((capability) => [
    capability,
    observation.malformed || observation.exitCode === null
      ? 'unknown'
      : observation.eventCounts[capability] > 0
      ? 'supported'
      : 'unsupported',
  ])) as Readonly<Record<ProviderCanaryCapability, ProviderCapabilityStatus>>;
  const evidence: ProviderCompatibilityEvidence = {
    profileId: profile.id,
    agent: route.agent,
    provider: route.provider,
    model: route.model,
    effort: route.effort,
    credential: observation.credential,
    remoteControl: route.agent === 'codex'
      ? 'not_applicable'
      : customClaude
      ? 'unavailable'
      : 'available',
    experimentalNonAnthropicModel: customClaude && !route.model.startsWith('anthropic/'),
    capabilities,
    eventCounts: observation.eventCounts,
    incompatibility,
    incompatibilitySource,
  };
  const diagnostics: RuntimeDiagnostic[] = [];
  if (observation.credential === 'absent') {
    diagnostics.push(diagnostic(
      'auth_required',
      'authentication',
      'selected provider credential is absent from the child environment',
    ));
  }
  if (observation.timedOut) {
    diagnostics.push(diagnostic('timeout', 'execution', 'provider canary timed out'));
  } else if (observation.exitCode !== null && observation.exitCode !== 0) {
    diagnostics.push(diagnostic('process_failed', 'execution', 'provider canary process failed'));
  } else if (observation.malformed) {
    diagnostics.push(diagnostic(
      'capability_unsupported',
      'compatibility',
      'provider canary returned no parseable structured events',
    ));
  }
  if (incompatibility === 'codex-native-namespace-tool') {
    diagnostics.push(diagnostic(
      'capability_unsupported',
      'compatibility',
      'Codex Responses native namespace tools are unsupported by the selected OpenRouter endpoint',
    ));
  }
  for (const capability of PROVIDER_CANARY_CAPABILITIES) {
    if (capabilities[capability] !== 'supported') {
      diagnostics.push(diagnostic(
        'capability_unsupported',
        'compatibility',
        `${capability} compatibility is ${capabilities[capability]}; fan-out is blocked`,
      ));
    }
  }
  const processFailed = observation.timedOut ||
    (observation.exitCode !== null && observation.exitCode !== 0);
  const fanOutEligible = observation.credential === 'available' && !processFailed &&
    !observation.malformed && !incompatibility &&
    PROVIDER_CANARY_CAPABILITIES.every((capability) => capabilities[capability] === 'supported');
  return {
    status: fanOutEligible ? 'passed' : processFailed ? 'failed' : 'blocked',
    fanOutEligible,
    evidence,
    diagnostics,
    process: { exitCode: observation.exitCode, timedOut: observation.timedOut },
  };
}
