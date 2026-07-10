/** Gemini observation normalization and explicit live-evidence deferral. */

import type { CapabilityState, RuntimeCommand, RuntimeDiagnostic } from '../contract.ts';
import type { AgentCommandPlan, AgentProcessRequest } from '../ports.ts';
import type { ObservedAuthState, ObservedComponentState } from '../state.ts';
import { AGENT_COMMAND_TIMEOUT_MS, MAX_AGENT_CAPTURE_BYTES } from './codex-adapter.ts';
import { CONFLICTING_CREDENTIAL_KEYS, validateProviderRoute } from './provider-adapter.ts';

type GeminiCommand = Extract<RuntimeCommand, { kind: 'launch' | 'resume' | 'smoke' }>;

export interface GeminiObservationInput {
  readonly version: string | null;
  readonly authStatus: 'ready' | 'auth_required' | 'auth_conflict';
  readonly credentialKeyNames?: readonly string[];
}

export interface GeminiObservation {
  readonly components: readonly ObservedComponentState[];
  readonly auth: ObservedAuthState;
  readonly capability: CapabilityState;
}

export interface GeminiPlanningInput {
  readonly command: GeminiCommand;
  readonly nativeExt4: boolean;
  readonly credentialKeyNames?: readonly string[];
}

function diagnostic(
  code: RuntimeDiagnostic['code'],
  category: RuntimeDiagnostic['category'],
  message: string,
  ownerIssue?: RuntimeDiagnostic['ownerIssue'],
): RuntimeDiagnostic {
  return { code, category, retryable: false, message, ownerIssue };
}

/** Normalizes installed/auth facts without reading provider credential values. */
export function normalizeGeminiObservation(input: GeminiObservationInput): GeminiObservation {
  const allowed = CONFLICTING_CREDENTIAL_KEYS.gemini as readonly string[];
  const conflictKeys = (input.credentialKeyNames ?? []).filter((key) => allowed.includes(key));
  const authStatus = conflictKeys.length ? 'auth_conflict' : input.authStatus;
  return {
    components: [{
      component: 'gemini',
      version: input.version,
      status: input.version ? 'ready' : 'missing',
    }, {
      component: 'gemini-auth-policy',
      version: null,
      status: authStatus,
    }],
    auth: {
      agent: 'gemini',
      route: 'google-subscription',
      status: authStatus,
      conflictKeys,
    },
    capability: authStatus === 'ready' && input.version
      ? 'available'
      : authStatus === 'auth_conflict'
      ? 'blocked'
      : 'degraded',
  };
}

function staticRequest(cwd: string): AgentProcessRequest {
  return {
    executable: 'gemini',
    arguments: ['--version'],
    cwd,
    timeoutMs: AGENT_COMMAND_TIMEOUT_MS,
    maxCaptureBytes: MAX_AGENT_CAPTURE_BYTES,
  };
}

/** Plans only a bounded static probe; live Gemini evidence remains issue 578. */
export function planGeminiCommand(input: GeminiPlanningInput): AgentCommandPlan {
  const { command } = input;
  const session = command.kind === 'resume' ? command.session : undefined;
  const provider = validateProviderRoute({
    route: command.route,
    nativeExt4: input.nativeExt4,
    session,
    requireSession: command.kind === 'resume',
    credentialKeyNames: input.credentialKeyNames,
  });
  const diagnostics = [...provider.diagnostics];
  if (command.route.agent !== 'gemini') {
    diagnostics.push(
      diagnostic('route_conflict', 'policy', 'Gemini adapter requires a Gemini route'),
    );
  }
  let request: AgentProcessRequest | null = null;
  if (command.kind !== 'smoke') {
    diagnostics.push(diagnostic(
      'capability_unsupported',
      'capability',
      'Gemini launch and resume are not implemented by the S3 observation adapter',
    ));
  } else if (command.level === 'live') {
    diagnostics.push(diagnostic(
      'capability_deferred',
      'capability',
      'Gemini grounded live evidence is deferred to issue #578',
      578,
    ));
  } else if (!diagnostics.length) {
    request = staticRequest(command.route.worktree);
  }
  return {
    agent: 'gemini',
    operation: command.kind,
    route: command.route,
    ...('content' in command && command.content ? { content: command.content } : {}),
    request,
    diagnostics,
  };
}
