import type { RuntimeDiagnostic } from './contract.ts';

export const CODEX_REMOTE_STATES = [
  'managed',
  'unmanaged',
  'stale_socket',
  'disconnected',
  'version_skew',
  'absent',
] as const;
export type CodexRemoteState = typeof CODEX_REMOTE_STATES[number];

export interface CodexAppServerProcess {
  readonly pid: number;
  readonly argv: string;
  readonly anchored: boolean;
}

export interface CodexRemoteObservation {
  readonly cliVersion: string | null;
  readonly daemonVersion: string | null;
  readonly daemonManaged: boolean;
  readonly remoteConnected: boolean;
  readonly controlSocketPresent: boolean;
  readonly controlSocketPath: string;
  readonly appServers: readonly CodexAppServerProcess[];
  readonly activeSessionIds: readonly string[];
  readonly activeChildCommands: readonly string[];
}

export interface CodexRecoveryEvidence {
  readonly schemaVersion: '1.0';
  readonly worktree: string;
  readonly before: CodexRemoteState;
  readonly after: CodexRemoteState;
  readonly terminatedPids: readonly number[];
  readonly removedControlSocket: boolean;
  readonly verifiedAt: string;
}

export interface CodexRemoteRepairPort {
  inspect(worktree: string): Promise<CodexRemoteObservation>;
  terminateAnchored(pids: readonly number[]): Promise<void>;
  removeKnownControlSocket(path: string): Promise<void>;
  restartAndPair(): Promise<void>;
  persistEvidence(evidence: CodexRecoveryEvidence): Promise<void>;
  now(): string;
}

export interface CodexRemoteRepairResult {
  readonly status: 'planned' | 'succeeded' | 'no_change' | 'blocked' | 'failed';
  readonly changed: boolean;
  readonly state: CodexRemoteState;
  readonly diagnostics: readonly RuntimeDiagnostic[];
  readonly evidence?: CodexRecoveryEvidence;
}

/** Classifies daemon, socket, connectivity, and version facts without mutation. */
export function classifyCodexRemote(observation: CodexRemoteObservation): CodexRemoteState {
  if (
    observation.cliVersion && observation.daemonVersion &&
    observation.cliVersion !== observation.daemonVersion
  ) return 'version_skew';
  if (observation.daemonManaged && observation.remoteConnected) return 'managed';
  if (!observation.appServers.length && observation.controlSocketPresent) return 'stale_socket';
  if (observation.appServers.length && !observation.daemonManaged) return 'unmanaged';
  if (observation.daemonManaged && !observation.remoteConnected) return 'disconnected';
  return 'absent';
}

function diagnostic(
  code: RuntimeDiagnostic['code'],
  category: RuntimeDiagnostic['category'],
  message: string,
): RuntimeDiagnostic {
  return { code, category, retryable: false, message };
}

function repairRefusal(observation: CodexRemoteObservation): RuntimeDiagnostic | null {
  if (observation.activeSessionIds.length || observation.activeChildCommands.length) {
    return diagnostic(
      'active_session',
      'safety',
      'Codex remote repair refused because active sessions or child commands were observed',
    );
  }
  if (observation.appServers.some((process) => !process.anchored)) {
    return diagnostic(
      'unowned_resource',
      'safety',
      'Codex remote repair refused an unanchored app-server process',
    );
  }
  return null;
}

/** Inspects, repairs through injected effects, verifies, and persists redacted evidence. */
export async function runCodexRemoteRepair(
  worktree: string,
  dryRun: boolean,
  port: CodexRemoteRepairPort,
): Promise<CodexRemoteRepairResult> {
  const before = await port.inspect(worktree);
  const state = classifyCodexRemote(before);
  if (state === 'managed') {
    return { status: 'no_change', changed: false, state, diagnostics: [] };
  }
  const refusal = repairRefusal(before);
  if (refusal) return { status: 'blocked', changed: false, state, diagnostics: [refusal] };
  const pids = before.appServers.map((process) => process.pid);
  if (dryRun) return { status: 'planned', changed: false, state, diagnostics: [] };
  try {
    if (pids.length) await port.terminateAnchored(pids);
    const removeSocket = before.controlSocketPresent &&
      ['stale_socket', 'unmanaged', 'version_skew'].includes(state);
    if (removeSocket) await port.removeKnownControlSocket(before.controlSocketPath);
    await port.restartAndPair();
    const after = await port.inspect(worktree);
    const afterState = classifyCodexRemote(after);
    if (afterState !== 'managed') {
      return {
        status: 'failed',
        changed: pids.length > 0 || removeSocket,
        state: afterState,
        diagnostics: [diagnostic(
          afterState === 'version_skew' ? 'version_skew' : 'probe_failed',
          afterState === 'version_skew' ? 'compatibility' : 'transport',
          'Codex remote repair did not verify a connected version-aligned managed daemon',
        )],
      };
    }
    const evidence: CodexRecoveryEvidence = {
      schemaVersion: '1.0',
      worktree,
      before: state,
      after: afterState,
      terminatedPids: pids,
      removedControlSocket: removeSocket,
      verifiedAt: port.now(),
    };
    await port.persistEvidence(evidence);
    return { status: 'succeeded', changed: true, state: afterState, diagnostics: [], evidence };
  } catch {
    return {
      status: 'failed',
      changed: false,
      state,
      diagnostics: [diagnostic('action_failed', 'execution', 'Codex remote repair action failed')],
    };
  }
}
