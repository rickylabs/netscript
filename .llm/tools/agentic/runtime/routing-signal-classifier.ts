/** Structured-first classification of provider routing failures. */

import type { DiagnosticCode, RuntimeDiagnostic } from './contract.ts';

export const ROUTING_REASON_CATEGORIES = [
  'quota',
  'plan_limit',
  'session_limit',
  'rate_limit',
  'provider_outage',
] as const;
export type RoutingReasonCategory = typeof ROUTING_REASON_CATEGORIES[number];

export interface RoutingSignal {
  readonly reason: RoutingReasonCategory;
  readonly source: 'structured' | 'version_pinned_text';
  readonly diagnosticCode?: DiagnosticCode;
  readonly resetAt?: string;
}

export interface RoutingSignalInput {
  readonly diagnostic?: RuntimeDiagnostic;
  readonly resetAt?: string;
  readonly tool?: 'claude' | 'codex' | 'antigravity';
  readonly version?: string;
  readonly text?: string;
}

const STRUCTURED_REASONS: Readonly<Partial<Record<DiagnosticCode, RoutingReasonCategory>>> = {
  quota_exhausted: 'quota',
  rate_limited: 'rate_limit',
  provider_unavailable: 'provider_outage',
};

interface PinnedTextRule {
  readonly tool: NonNullable<RoutingSignalInput['tool']>;
  readonly version: string;
  readonly pattern: RegExp;
  readonly reason: RoutingReasonCategory;
}

const PINNED_TEXT_RULES: readonly PinnedTextRule[] = [
  { tool: 'claude', version: '1.0.33', pattern: /usage limit reached/i, reason: 'plan_limit' },
  { tool: 'codex', version: '0.91.0', pattern: /session limit reached/i, reason: 'session_limit' },
  { tool: 'antigravity', version: '1.5.1', pattern: /quota exhausted/i, reason: 'quota' },
];

/** Classifies structured diagnostics before exact tool/version compatibility text. */
export function classifyRoutingSignal(input: RoutingSignalInput): RoutingSignal | null {
  if (input.diagnostic) {
    const reason = STRUCTURED_REASONS[input.diagnostic.code];
    if (reason) {
      return {
        reason,
        source: 'structured',
        diagnosticCode: input.diagnostic.code,
        ...(input.resetAt ? { resetAt: input.resetAt } : {}),
      };
    }
  }
  if (!input.tool || !input.version || !input.text) return null;
  const rule = PINNED_TEXT_RULES.find((candidate) =>
    candidate.tool === input.tool && candidate.version === input.version &&
    candidate.pattern.test(input.text ?? '')
  );
  return rule
    ? {
      reason: rule.reason,
      source: 'version_pinned_text',
      ...(input.resetAt ? { resetAt: input.resetAt } : {}),
    }
    : null;
}
