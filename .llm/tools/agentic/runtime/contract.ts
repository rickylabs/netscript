export const RUNTIME_SCHEMA_VERSION = '1.0' as const;
// deno-fmt-ignore
export const RUNTIME_COMMANDS = [
  'doctor', 'bootstrap', 'configure', 'launch', 'resume', 'smoke', 'fallback', 'restore',
  'status', 'repair-codex-remote', 'rollback',
] as const;
export type RuntimeCommandKind = typeof RUNTIME_COMMANDS[number];
export const RUNTIME_MODES = ['inspect', 'plan', 'apply'] as const;
export type RuntimeMode = typeof RUNTIME_MODES[number];
// deno-fmt-ignore
export const LEGAL_COMMAND_MODES: Readonly<
  Record<RuntimeCommandKind, readonly RuntimeMode[]>
> = {
  doctor: ['inspect'], bootstrap: ['plan', 'apply'], configure: ['plan', 'apply'],
  launch: ['plan', 'apply'], resume: ['plan', 'apply'], smoke: ['plan', 'apply'],
  fallback: ['plan', 'apply'], restore: ['plan', 'apply'], status: ['inspect'],
  'repair-codex-remote': ['plan', 'apply'], rollback: ['plan', 'apply'],
};
export type RuntimeCommandMode<K extends RuntimeCommandKind> = K extends 'doctor' | 'status'
  ? 'inspect'
  : 'plan' | 'apply';
export const AGENT_KINDS = ['claude', 'codex', 'antigravity'] as const;
export type AgentKind = typeof AGENT_KINDS[number];
export const PROVIDER_KINDS = ['anthropic', 'openai', 'google', 'openrouter', 'custom'] as const;
export type ProviderKind = typeof PROVIDER_KINDS[number];
export const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
export type Effort = typeof EFFORTS[number];
// deno-fmt-ignore
export const OBSERVED_FOUNDATION_COMPONENTS = [
  'node', 'npm', 'deno', 'git', 'codex', 'codex-app-server', 'claude', 'antigravity',
  'antigravity-auth', 'antigravity-install-ownership', 'legacy-gemini-ownership', 'dotnet',
  'aspire', 'docker', 'state-claude', 'state-codex', 'state-antigravity', 'state-netscript-agentic',
] as const;
export type ObservedFoundationComponentId = typeof OBSERVED_FOUNDATION_COMPONENTS[number];
export const INSTALLABLE_FOUNDATION_COMPONENTS = ['node', 'claude', 'antigravity'] as const;
export type InstallableFoundationComponentId = typeof INSTALLABLE_FOUNDATION_COMPONENTS[number];
export const STATE_DIRECTORY_IDS = ['claude', 'codex', 'antigravity', 'netscript-agentic'] as const;
export type StateDirectoryId = typeof STATE_DIRECTORY_IDS[number];
// deno-fmt-ignore
export const RUNTIME_STATUSES = [
  'succeeded', 'no_change', 'planned', 'degraded', 'blocked', 'failed', 'rolled_back',
  'partially_rolled_back',
] as const;
export type RuntimeStatus = typeof RUNTIME_STATUSES[number];
// deno-fmt-ignore
export const FAILURE_CATEGORIES = [
  'input', 'policy', 'authentication', 'compatibility', 'safety', 'provider', 'transport',
  'execution', 'state', 'rollback', 'capability', 'internal',
] as const;
export type FailureCategory = typeof FAILURE_CATEGORIES[number];
// deno-fmt-ignore
export const DIAGNOSTIC_CODES = [
  'invalid_command', 'missing_identity', 'invalid_state_file', 'invalid_checkpoint', 'route_conflict',
  'non_native_worktree', 'turn_boundary_required', 'credential_argument_forbidden', 'auth_required',
  'auth_conflict', 'component_missing', 'component_outdated', 'version_skew', 'unparseable_version',
  'unsafe_worktree', 'ownership_conflict', 'active_session', 'duplicate_sender_risk', 'unowned_resource',
  'quota_exhausted', 'rate_limited', 'provider_unavailable', 'unsupported_route', 'network_unavailable',
  'timeout', 'mobile_disconnected', 'process_failed', 'probe_failed', 'state_write_failed', 'action_failed',
  'state_missing', 'state_corrupt', 'schema_unsupported', 'checkpoint_incomplete', 'rollback_refused',
  'compensation_failed', 'partially_rolled_back', 'capability_deferred', 'capability_unsupported',
  'unexpected_error',
] as const;
export type DiagnosticCode = typeof DIAGNOSTIC_CODES[number];
export const ACTION_EFFECTS = ['none', 'write', 'process', 'network', 'session'] as const;
export type ActionEffect = typeof ACTION_EFFECTS[number];
// deno-fmt-ignore
export const ACTION_KINDS = [
  'install_component', 'create_state_directory', 'configure_auth_route', 'persist_desired_state',
  'launch_session', 'resume_session', 'smoke_session', 'switch_route', 'restore_route',
  'rollback_checkpoint', 'blocked_intent',
] as const;
export type RuntimeActionKind = typeof ACTION_KINDS[number];
// deno-fmt-ignore
export const ADAPTER_KINDS = [
  'foundation', 'state', 'provider', 'claude', 'codex', 'antigravity', 'mobile-control',
] as const;
export type AdapterKind = typeof ADAPTER_KINDS[number];

export const CAPABILITY_STATES = ['available', 'degraded', 'blocked', 'deferred'] as const;
export type CapabilityState = typeof CAPABILITY_STATES[number];
export const DEFERRED_ISSUES = [577, 578, 579, 580, 581, 582] as const;
export type DeferredIssue = typeof DEFERRED_ISSUES[number];
export interface RouteIdentity {
  readonly agent: AgentKind;
  readonly provider: ProviderKind;
  readonly profileId?: import('./provider-profiles.ts').ProviderProfileId;
  readonly model: string;
  readonly effort: Effort;
  readonly worktree: string;
  readonly sessionId?: string;
  readonly mobileRequired: boolean;
}

export interface SessionIdentity {
  readonly agent: AgentKind;
  readonly sessionId: string;
  readonly worktree: string;
  readonly boundary: 'active' | 'idle' | 'new';
}

export interface ContentReference {
  readonly path: string;
}

export interface RuntimeCommandBase<K extends RuntimeCommandKind> {
  readonly kind: K;
  readonly commandId: string;
  readonly mode: RuntimeCommandMode<K>;
}

/** Checks the finite command/mode policy at an untyped input boundary. */
export function hasLegalRuntimeCommandMode(
  command: Readonly<{ kind: unknown; mode: unknown }>,
): command is Readonly<{ kind: RuntimeCommandKind; mode: RuntimeMode }> {
  if (typeof command.kind !== 'string' || typeof command.mode !== 'string') return false;
  if (!RUNTIME_COMMANDS.includes(command.kind as RuntimeCommandKind)) return false;
  return LEGAL_COMMAND_MODES[command.kind as RuntimeCommandKind].includes(
    command.mode as RuntimeMode,
  );
}

export type RuntimeCommand =
  | (RuntimeCommandBase<'doctor'> & { readonly agents?: readonly AgentKind[] })
  | (RuntimeCommandBase<'bootstrap'> & {
    readonly desiredVersions?: Readonly<Partial<Record<InstallableFoundationComponentId, string>>>;
  })
  | (RuntimeCommandBase<'configure'> & { readonly desiredState: ContentReference })
  | (RuntimeCommandBase<'launch'> & {
    readonly route: RouteIdentity;
    readonly content: ContentReference;
  })
  | (RuntimeCommandBase<'resume'> & {
    readonly route: RouteIdentity;
    readonly session: SessionIdentity;
    readonly content: ContentReference;
  })
  | (RuntimeCommandBase<'smoke'> & {
    readonly route: RouteIdentity;
    readonly level: 'static' | 'live';
    readonly content?: ContentReference;
  })
  | (RuntimeCommandBase<'fallback'> & {
    readonly session: SessionIdentity;
    readonly currentRoute: RouteIdentity;
    readonly targetRoute: RouteIdentity;
  })
  | (RuntimeCommandBase<'restore'> & {
    readonly session: SessionIdentity;
    readonly currentRoute: RouteIdentity;
  })
  | (RuntimeCommandBase<'status'> & {
    readonly agent?: AgentKind;
    readonly worktree?: string;
    readonly sessionId?: string;
  })
  | (RuntimeCommandBase<'repair-codex-remote'> & {
    readonly worktree: string;
    readonly sessionId?: string;
  })
  | (RuntimeCommandBase<'rollback'> & { readonly checkpointId: string });

export interface RuntimeDiagnostic {
  readonly code: DiagnosticCode;
  readonly category: FailureCategory;
  readonly retryable: boolean;
  readonly message: string;
  readonly operatorAction?: string;
  readonly ownerIssue?: DeferredIssue;
}

export interface RuntimeAction {
  readonly id: string;
  readonly kind: RuntimeActionKind;
  readonly adapter: AdapterKind;
  readonly effect: ActionEffect;
  readonly reversible: boolean;
  readonly resourceIds: readonly string[];
  readonly component?: InstallableFoundationComponentId;
  readonly targetVersion?: string;
  readonly stateDirectory?: StateDirectoryId;
  readonly route?: RouteIdentity;
  readonly sessionId?: string;
  readonly stateId?: string;
  readonly checkpointId?: string;
  readonly diagnostic?: RuntimeDiagnostic;
}

export interface ReconcilePlan {
  readonly schemaVersion: typeof RUNTIME_SCHEMA_VERSION;
  readonly commandId: string;
  readonly command: RuntimeCommandKind;
  readonly status: 'no_change' | 'planned' | 'blocked';
  readonly changed: false;
  readonly actions: readonly RuntimeAction[];
  readonly diagnostics: readonly RuntimeDiagnostic[];
}

export interface RuntimeActionResult {
  readonly id: string;
  readonly kind: RuntimeActionKind;
  readonly adapter: AdapterKind;
  readonly effect: ActionEffect;
  readonly reversible: boolean;
  readonly status: 'pending' | 'succeeded' | 'failed' | 'compensated';
}

export interface RuntimeResult {
  readonly schemaVersion: typeof RUNTIME_SCHEMA_VERSION;
  readonly commandId: string;
  readonly command: RuntimeCommandKind;
  readonly mode: RuntimeMode;
  readonly status: RuntimeStatus;
  readonly changed: boolean;
  readonly desiredSummary: import('./state.ts').DesiredStateSummary | null;
  readonly observedSummary: import('./state.ts').ObservedStateSummary;
  readonly actions: readonly RuntimeActionResult[];
  readonly diagnostics: readonly RuntimeDiagnostic[];
  readonly route?: RouteIdentity;
  readonly checkpointId?: string;
  readonly timing: Readonly<{ startedAt: string; completedAt: string; durationMs: number }>;
}
