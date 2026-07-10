/** Value-free provider and route validation for lifecycle command planning. */

import {
  AGENT_KINDS,
  EFFORTS,
  PROVIDER_KINDS,
  type RouteIdentity,
  type RuntimeDiagnostic,
} from '../contract.ts';
import type { SessionIdentity } from '../contract.ts';

export const PROVIDER_AGENT_PAIRS = {
  anthropic: 'claude',
  openai: 'codex',
  google: 'gemini',
} as const;

export const CONFLICTING_CREDENTIAL_KEYS = {
  claude: ['ANTHROPIC_API_KEY'],
  codex: ['OPENAI_API_KEY'],
  gemini: [
    'GEMINI_API_KEY',
    'GOOGLE_API_KEY',
    'GOOGLE_CLOUD_PROJECT',
    'GOOGLE_CLOUD_LOCATION',
    'GOOGLE_GENAI_USE_VERTEXAI',
  ],
} as const;

export interface ProviderValidationInput {
  readonly route: RouteIdentity;
  readonly nativeExt4: boolean;
  readonly session?: SessionIdentity;
  readonly requireSession: boolean;
  readonly credentialKeyNames?: readonly string[];
}

export interface ProviderValidationResult {
  readonly ok: boolean;
  readonly diagnostics: readonly RuntimeDiagnostic[];
  readonly conflictingKeyNames: readonly string[];
}

function diagnostic(
  code: RuntimeDiagnostic['code'],
  category: RuntimeDiagnostic['category'],
  message: string,
  ownerIssue?: RuntimeDiagnostic['ownerIssue'],
): RuntimeDiagnostic {
  return { code, category, retryable: false, message, ownerIssue };
}

/** Validates caller identity and allowlisted credential-key presence without reading values. */
export function validateProviderRoute(input: ProviderValidationInput): ProviderValidationResult {
  const { route, session } = input;
  const diagnostics: RuntimeDiagnostic[] = [];
  const runtimeRoute = route as unknown as Record<string, unknown>;
  if (
    !AGENT_KINDS.includes(route.agent) || !PROVIDER_KINDS.includes(route.provider) ||
    !route.model?.trim() || !EFFORTS.includes(route.effort) || !route.worktree?.trim() ||
    typeof runtimeRoute.mobileRequired !== 'boolean'
  ) {
    diagnostics.push(diagnostic('missing_identity', 'input', 'route identity is incomplete'));
  }
  if (!input.nativeExt4 || !route.worktree?.startsWith('/home/')) {
    diagnostics.push(
      diagnostic('non_native_worktree', 'policy', 'route worktree is not native ext4'),
    );
  }
  if (route.provider === 'openrouter' || route.provider === 'custom') {
    diagnostics.push(diagnostic(
      'capability_deferred',
      'capability',
      'provider route profiles are deferred to issue #577',
      577,
    ));
  } else if (PROVIDER_AGENT_PAIRS[route.provider] !== route.agent) {
    diagnostics.push(
      diagnostic('route_conflict', 'policy', 'agent and provider identities conflict'),
    );
  }
  if (input.requireSession && (!session?.sessionId?.trim() || !runtimeRoute.sessionId)) {
    diagnostics.push(
      diagnostic('missing_identity', 'input', 'resume requires an explicit session identity'),
    );
  } else if (
    session && (
      session.agent !== route.agent || session.worktree !== route.worktree ||
      (route.sessionId !== undefined && route.sessionId !== session.sessionId)
    )
  ) {
    diagnostics.push(
      diagnostic('route_conflict', 'policy', 'route and session identities conflict'),
    );
  }
  const allowed = (CONFLICTING_CREDENTIAL_KEYS as Partial<Record<string, readonly string[]>>)[
    route.agent
  ] ?? [];
  const conflictingKeyNames = (input.credentialKeyNames ?? []).filter((key) =>
    allowed.includes(key)
  );
  if (conflictingKeyNames.length) {
    diagnostics.push(diagnostic(
      'auth_conflict',
      'authentication',
      'allowlisted credential key presence conflicts with the requested provider route',
    ));
  }
  return { ok: diagnostics.length === 0, diagnostics, conflictingKeyNames };
}
