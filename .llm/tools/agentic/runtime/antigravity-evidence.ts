/** Finite, secret-safe evidence contracts for bounded Antigravity capability probes. */
import type { RuntimeDiagnostic } from './contract.ts';
export const ANTIGRAVITY_EVIDENCE_SCHEMA_VERSION = '1.0' as const;
export const ANTIGRAVITY_CAPABILITIES = [
  'headless',
  'model_flag',
  'agent_flag',
  'project_flag',
  'conversation_flag',
  'sandbox',
  'structured_output',
  'web_search_fetch',
  'citation_persistence',
  'agents_instructions',
  'gemini_instructions',
  'legacy_state',
] as const;
export type AntigravityCapability = typeof ANTIGRAVITY_CAPABILITIES[number];
export const ANTIGRAVITY_CAPABILITY_STATUSES = [
  'supported',
  'unsupported',
  'unknown',
  'deferred',
  'owner_accepted_working',
] as const;
export type AntigravityCapabilityStatus = typeof ANTIGRAVITY_CAPABILITY_STATUSES[number];
export const ANTIGRAVITY_EVIDENCE_STATUSES = ['passed', 'blocked', 'failed', 'deferred'] as const;
export type AntigravityEvidenceStatus = typeof ANTIGRAVITY_EVIDENCE_STATUSES[number];
export const ANTIGRAVITY_FAILURE_SIGNALS = [
  'authentication',
  'provider_unavailable',
  'timeout',
  'quota',
  'rate_limited',
  'malformed',
  'unsupported',
] as const;
export type AntigravityFailureSignal = typeof ANTIGRAVITY_FAILURE_SIGNALS[number];
export interface AntigravityEvidenceObservation {
  readonly exitCode: number | null;
  readonly timedOut: boolean;
  readonly stdout: string;
  readonly stderr: string;
  readonly expectedMarker?: string;
  readonly expectedInstructionMarker?: 'AGENTS' | 'GEMINI';
  readonly staticCapabilities?: readonly AntigravityCapability[];
  readonly ownerAcceptedCapabilities?: readonly AntigravityCapability[];
}
export interface AntigravityCitationEvidence {
  readonly url: string;
  readonly persisted: true;
}

export interface AntigravityEvidence {
  readonly schemaVersion: typeof ANTIGRAVITY_EVIDENCE_SCHEMA_VERSION;
  readonly capabilities: Readonly<Record<AntigravityCapability, AntigravityCapabilityStatus>>;
  readonly failureSignals: readonly AntigravityFailureSignal[];
  readonly citations: readonly AntigravityCitationEvidence[];
  readonly process: Readonly<{ exitCode: number | null; timedOut: boolean }>;
  readonly rawOutputRetained: false;
  readonly ownerAcceptanceApplied: boolean;
}
export interface AntigravityEvidenceResult {
  readonly status: AntigravityEvidenceStatus;
  readonly evidence: AntigravityEvidence;
  readonly diagnostics: readonly RuntimeDiagnostic[];
  readonly aggregationEligible: boolean;
}

function diagnostic(
  code: RuntimeDiagnostic['code'],
  category: RuntimeDiagnostic['category'],
  message: string,
  ownerIssue?: RuntimeDiagnostic['ownerIssue'],
): RuntimeDiagnostic {
  return { code, category, retryable: false, message, ownerIssue };
}

function classifyFailureSignals(combined: string, timedOut: boolean): AntigravityFailureSignal[] {
  const signals = new Set<AntigravityFailureSignal>();
  if (/auth|sign[ -]?in|login|credential|oauth/i.test(combined)) signals.add('authentication');
  if (/quota|resource[_ -]?exhausted/i.test(combined)) signals.add('quota');
  if (/rate limit|too many requests|\b429\b/i.test(combined)) signals.add('rate_limited');
  if (/server|service unavailable|bad gateway|\b5\d\d\b/i.test(combined)) {
    signals.add('provider_unavailable');
  }
  if (timedOut || /timed? ?out|timeout|deadline/i.test(combined)) signals.add('timeout');
  return [...signals];
}

function safeCitations(stdout: string): AntigravityCitationEvidence[] {
  const urls = stdout.match(/https:\/\/[^\s)\]]+/g) ?? [];
  const safe = new Set<string>();
  for (const candidate of urls) {
    try {
      const url = new URL(candidate.replace(/[.,;:!?]+$/, ''));
      if (url.protocol !== 'https:' || url.username || url.password) continue;
      url.search = '';
      url.hash = '';
      safe.add(url.toString());
    } catch {
      // Unparseable provider text is not citation evidence.
    }
  }
  return [...safe].map((url) => ({ url, persisted: true }));
}

/** Classifies transient bounded output into evidence that never retains raw provider text. */
export function classifyAntigravityEvidence(
  observation: AntigravityEvidenceObservation,
): AntigravityEvidenceResult {
  const combined = `${observation.stdout}\n${observation.stderr}`;
  const failureSignals = classifyFailureSignals(combined, observation.timedOut);
  const citations = safeCitations(observation.stdout);
  const capabilities = Object.fromEntries(
    ANTIGRAVITY_CAPABILITIES.map((capability) => [capability, 'unknown']),
  ) as Record<AntigravityCapability, AntigravityCapabilityStatus>;
  for (const capability of observation.staticCapabilities ?? []) {
    capabilities[capability] = 'supported';
  }
  capabilities.structured_output = 'unsupported';
  if (observation.expectedMarker) {
    capabilities.headless = observation.exitCode === 0 &&
        observation.stdout.trim() === observation.expectedMarker
      ? 'supported'
      : 'unsupported';
  }
  if (citations.length > 0) {
    capabilities.web_search_fetch = 'supported';
    capabilities.citation_persistence = 'supported';
  }
  if (observation.expectedInstructionMarker === 'AGENTS') {
    capabilities.agents_instructions = observation.stdout.includes('AGENTS_INSTRUCTION_OK')
      ? 'supported'
      : 'unsupported';
  } else if (observation.expectedInstructionMarker === 'GEMINI') {
    capabilities.gemini_instructions = observation.stdout.includes('GEMINI_INSTRUCTION_OK')
      ? 'supported'
      : 'unsupported';
  }
  for (const capability of observation.ownerAcceptedCapabilities ?? []) {
    if (capabilities[capability] !== 'supported') {
      capabilities[capability] = 'owner_accepted_working';
    }
  }
  const diagnostics: RuntimeDiagnostic[] = [];
  if (failureSignals.includes('authentication')) {
    diagnostics.push(diagnostic(
      'auth_required',
      'authentication',
      'Antigravity requires owner Google Sign-In',
    ));
  }
  if (failureSignals.includes('quota')) {
    diagnostics.push(
      diagnostic('quota_exhausted', 'provider', 'Antigravity reported quota exhaustion'),
    );
  }
  if (failureSignals.includes('rate_limited')) {
    diagnostics.push(
      diagnostic('rate_limited', 'provider', 'Antigravity reported rate limiting'),
    );
  }
  if (failureSignals.includes('timeout')) {
    diagnostics.push(diagnostic('timeout', 'execution', 'Antigravity evidence probe timed out'));
  }
  if (failureSignals.includes('provider_unavailable')) {
    diagnostics.push(
      diagnostic('provider_unavailable', 'provider', 'Antigravity provider was unavailable'),
    );
  }
  if (observation.exitCode !== null && observation.exitCode !== 0 && diagnostics.length === 0) {
    diagnostics.push(
      diagnostic('process_failed', 'execution', 'Antigravity evidence probe failed'),
    );
  }
  const failed = observation.timedOut ||
    (observation.exitCode !== null && observation.exitCode !== 0);
  const blocked = diagnostics.some((entry) =>
    entry.code === 'auth_required' || entry.code === 'quota_exhausted' ||
    entry.code === 'rate_limited'
  );
  const status: AntigravityEvidenceStatus = failed ? (blocked ? 'blocked' : 'failed') : 'passed';
  return {
    status,
    evidence: {
      schemaVersion: ANTIGRAVITY_EVIDENCE_SCHEMA_VERSION,
      capabilities,
      failureSignals,
      citations,
      process: { exitCode: observation.exitCode, timedOut: observation.timedOut },
      rawOutputRetained: false,
      ownerAcceptanceApplied: (observation.ownerAcceptedCapabilities?.length ?? 0) > 0,
    },
    diagnostics,
    aggregationEligible: status === 'passed' &&
      capabilities.web_search_fetch === 'supported' &&
      capabilities.citation_persistence === 'supported',
  };
}
