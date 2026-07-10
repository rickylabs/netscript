/** Antigravity observation normalization and explicit live-evidence deferral. */

import type { CapabilityState, RuntimeCommand, RuntimeDiagnostic } from '../contract.ts';
import type { AgentCommandPlan, AgentProcessRequest } from '../ports.ts';
import type { ObservedAuthState, ObservedComponentState } from '../state.ts';
import { AGENT_COMMAND_TIMEOUT_MS, MAX_AGENT_CAPTURE_BYTES } from './codex-adapter.ts';
import { validateProviderRoute } from './provider-adapter.ts';

type AntigravityCommand = Extract<RuntimeCommand, { kind: 'launch' | 'resume' | 'smoke' }>;
export interface AntigravityObservationInput {
  readonly version: string | null;
  readonly authStatus: 'ready' | 'auth_required' | 'auth_conflict';
}
export interface AntigravityObservation {
  readonly components: readonly ObservedComponentState[];
  readonly auth: ObservedAuthState;
  readonly capability: CapabilityState;
}
export interface AntigravityPlanningInput {
  readonly command: AntigravityCommand;
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
/** Normalizes documented install and Google Sign-In facts without credential values. */
export function normalizeAntigravityObservation(
  input: AntigravityObservationInput,
): AntigravityObservation {
  return {
    components: [{
      component: 'antigravity',
      version: input.version,
      status: input.version ? 'ready' : 'missing',
    }, {
      component: 'antigravity-auth',
      version: null,
      status: input.authStatus,
    }],
    auth: {
      agent: 'antigravity',
      route: 'google-sign-in',
      status: input.authStatus,
      conflictKeys: [],
    },
    capability: input.authStatus === 'ready' && input.version
      ? 'available'
      : input.authStatus === 'auth_conflict'
      ? 'blocked'
      : 'degraded',
  };
}
function staticRequest(cwd: string): AgentProcessRequest {
  return {
    executable: 'agy',
    arguments: ['--version'],
    cwd,
    timeoutMs: AGENT_COMMAND_TIMEOUT_MS,
    maxCaptureBytes: MAX_AGENT_CAPTURE_BYTES,
  };
}
/** Plans only the documented static version probe; live behavior remains issue #578. */
export function planAntigravityCommand(input: AntigravityPlanningInput): AgentCommandPlan {
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
  if (command.route.agent !== 'antigravity') {
    diagnostics.push(
      diagnostic('route_conflict', 'policy', 'Antigravity adapter requires an Antigravity route'),
    );
  }
  let request: AgentProcessRequest | null = null;
  if (command.kind !== 'smoke') {
    diagnostics.push(
      diagnostic(
        'capability_unsupported',
        'capability',
        'Antigravity launch and resume are not implemented by the compatibility adapter',
      ),
    );
  } else if (command.level === 'live') {
    diagnostics.push(
      diagnostic(
        'capability_deferred',
        'capability',
        'Antigravity live evidence is deferred to issue #578',
        578,
      ),
    );
  } else if (!diagnostics.length) request = staticRequest(command.route.worktree);
  return {
    agent: 'antigravity',
    operation: command.kind,
    route: command.route,
    ...('content' in command && command.content ? { content: command.content } : {}),
    request,
    diagnostics,
  };
}
