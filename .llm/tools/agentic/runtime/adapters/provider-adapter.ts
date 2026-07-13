/** Value-free provider and route validation for lifecycle command planning. */

import {
  AGENT_KINDS,
  EFFORTS,
  PROVIDER_KINDS,
  type RouteIdentity,
  type RuntimeDiagnostic,
} from '../contract.ts';
import type { SessionIdentity } from '../contract.ts';
import { PROVIDER_CREDENTIAL_KEYS, resolveProviderProfile } from '../provider-profiles.ts';

export const PROVIDER_AGENT_PAIRS = {
  anthropic: 'claude',
  openai: 'codex',
  google: 'antigravity',
} as const;

export const CONFLICTING_CREDENTIAL_KEYS: Readonly<
  Record<(typeof AGENT_KINDS)[number], readonly string[]>
> = {
  claude: PROVIDER_CREDENTIAL_KEYS,
  codex: PROVIDER_CREDENTIAL_KEYS,
  antigravity: [],
  opencode: [],
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
  if (route.provider === 'custom') {
    try {
      const baseUrl = new URL(route.baseUrl ?? '');
      if (
        baseUrl.protocol !== 'https:' || baseUrl.username || baseUrl.password || baseUrl.search ||
        baseUrl.hash
      ) throw new Error('unsafe URL');
    } catch {
      diagnostics.push(diagnostic(
        'unsupported_route',
        'provider',
        'custom Claude route requires a credential-free HTTPS base URL',
      ));
    }
  }
  if (!input.nativeExt4 || !route.worktree?.startsWith('/home/')) {
    diagnostics.push(
      diagnostic('non_native_worktree', 'policy', 'route worktree is not native ext4'),
    );
  }
  const profile = resolveProviderProfile(route);
  const nativeAgent = (PROVIDER_AGENT_PAIRS as Partial<Record<string, string>>)[route.provider];
  if (profile && (profile.agent !== route.agent || profile.provider !== route.provider)) {
    diagnostics.push(diagnostic(
      'route_conflict',
      'policy',
      'route identity conflicts with the selected provider profile',
    ));
  } else if (nativeAgent && nativeAgent !== route.agent) {
    diagnostics.push(
      diagnostic('route_conflict', 'policy', 'agent and provider identities conflict'),
    );
  } else if (!profile && nativeAgent !== route.agent) {
    diagnostics.push(diagnostic(
      'unsupported_route',
      'provider',
      'provider route requires a supported explicit profile',
    ));
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
  const allowed = profile?.clearKeys ??
    (CONFLICTING_CREDENTIAL_KEYS as Partial<Record<string, readonly string[]>>)[route.agent] ?? [];
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
