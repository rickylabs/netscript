/** Data-only Codex launch/resume planning over checked-in safety primitives. */

import {
  evaluateGitSafety,
  type GitInfo,
  parseThreadInfo,
  parseTurnComplete,
  validateHandoffContract,
} from '../../agentic-lib.ts';
import type { RouteIdentity, RuntimeCommand, RuntimeDiagnostic } from '../contract.ts';
import type { AgentCommandPlan, AgentProcessRequest } from '../ports.ts';
import { childEnvironmentPolicyForProfile, resolveProviderProfile } from '../provider-profiles.ts';
import type { CodexProfileReference } from './codex-profile-adapter.ts';
import { validateProviderRoute } from './provider-adapter.ts';

export const CODEX_LAUNCH_WRAPPER = '.llm/tools/agentic/launch-codex-slice.ts';
export const CODEX_RESUME_WRAPPER = '.llm/tools/agentic/codex-resume.ts';
export const AGENT_COMMAND_TIMEOUT_MS = 30_000;
export const MAX_AGENT_CAPTURE_BYTES: number = 64 * 1024;

type CodexCommand = Extract<RuntimeCommand, { kind: 'launch' | 'resume' }>;

export interface CodexPlanningInput {
  readonly command: CodexCommand;
  readonly git: GitInfo;
  readonly expectedBranch: string;
  readonly nativeExt4: boolean;
  readonly credentialKeyNames?: readonly string[];
  readonly handoff?: CodexHandoffInspection;
  readonly turn?: CodexTurnObservation;
  readonly profile?: CodexProfileReference;
}

export interface CodexHandoffInspection {
  readonly ok: boolean;
  readonly useHarness: boolean;
  readonly skillChapter: boolean;
  readonly bytes: number;
}

export interface CodexTurnObservation {
  readonly idle: boolean;
}

export interface CodexLaunchObservation {
  readonly sessionId: string | null;
  readonly model: string | null;
  readonly worktree: string | null;
  readonly exited: number | null;
  readonly diagnostics: readonly RuntimeDiagnostic[];
}

function diagnostic(
  code: RuntimeDiagnostic['code'],
  category: RuntimeDiagnostic['category'],
  message: string,
): RuntimeDiagnostic {
  return { code, category, retryable: false, message };
}

function request(arguments_: readonly string[], cwd: string): AgentProcessRequest {
  return {
    executable: 'deno',
    arguments: arguments_,
    cwd,
    timeoutMs: AGENT_COMMAND_TIMEOUT_MS,
    maxCaptureBytes: MAX_AGENT_CAPTURE_BYTES,
  };
}

/** Reduces handoff file content to a value-free contract summary. */
export function inspectCodexHandoff(content: string): CodexHandoffInspection {
  const check = validateHandoffContract(content);
  return {
    ok: check.ok,
    useHarness: check.useHarness,
    skillChapter: check.skillChapter,
    bytes: check.bytes,
  };
}

/** Reduces a bounded rollout tail to the idle fact required by resume planning. */
export function inspectCodexTurn(tail: string): CodexTurnObservation {
  return { idle: parseTurnComplete(tail.slice(-MAX_AGENT_CAPTURE_BYTES)).turnComplete };
}

/** Builds a validated Codex wrapper invocation without executing or sending it. */
export function planCodexCommand(input: CodexPlanningInput): AgentCommandPlan {
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
  const profile = resolveProviderProfile(command.route);
  if (command.route.agent !== 'codex') {
    diagnostics.push(
      diagnostic('route_conflict', 'policy', 'Codex adapter requires a Codex route'),
    );
  }
  if (!command.content.path.trim()) {
    diagnostics.push(
      diagnostic('invalid_state_file', 'input', 'content file reference is missing'),
    );
  }
  if (!input.expectedBranch.trim()) {
    diagnostics.push(
      diagnostic('missing_identity', 'input', 'expected worktree branch is missing'),
    );
  }
  if (!input.git.head.trim()) {
    diagnostics.push(
      diagnostic('missing_identity', 'input', 'inspected git HEAD is missing'),
    );
  }
  if (profile?.endpointKind === 'openrouter' && !input.profile) {
    diagnostics.push(diagnostic(
      'state_missing',
      'state',
      'Codex OpenRouter route requires a materialized named profile',
    ));
  }
  const safety = evaluateGitSafety(input.git, { branch: input.expectedBranch });
  if (!safety.ok || input.git.dirty !== 0) {
    diagnostics.push(diagnostic(
      'unsafe_worktree',
      'safety',
      'worktree is missing, dirty, has an upstream, or is on the wrong branch',
    ));
  }
  let processRequest: AgentProcessRequest | null = null;
  if (command.kind === 'launch') {
    if (command.route.sessionId) {
      diagnostics.push(
        diagnostic('active_session', 'safety', 'launch route already names a session'),
      );
    }
    if (!input.handoff?.ok) {
      diagnostics.push(
        diagnostic('invalid_state_file', 'input', 'handoff file contract is invalid'),
      );
    }
    if (!diagnostics.length) {
      processRequest = request([
        'run',
        '--no-lock',
        '--allow-read',
        '--allow-write',
        '--allow-run',
        CODEX_LAUNCH_WRAPPER,
        ...(input.profile
          ? ['--profile', input.profile.name, '--profile-home', input.profile.home]
          : []),
        '--brief',
        command.content.path,
        '--worktree',
        command.route.worktree,
        '--branch',
        input.expectedBranch,
        '--expect-base',
        input.git.head,
      ], command.route.worktree);
    }
  } else {
    if (!input.turn?.idle) {
      diagnostics.push(
        diagnostic('active_session', 'safety', 'Codex thread is not at an idle boundary'),
      );
    }
    if (!diagnostics.length) {
      processRequest = request([
        'run',
        '--no-lock',
        '--allow-read',
        '--allow-run',
        CODEX_RESUME_WRAPPER,
        ...(input.profile
          ? ['--profile', input.profile.name, '--profile-home', input.profile.home]
          : []),
        '--thread-id',
        command.session.sessionId,
        '--message-file',
        command.content.path,
        '--worktree',
        command.route.worktree,
      ], command.route.worktree);
    }
  }
  return {
    agent: 'codex',
    operation: command.kind,
    route: command.route,
    content: command.content,
    request: processRequest && profile
      ? {
        ...processRequest,
        environment: childEnvironmentPolicyForProfile(
          profile,
          command.route,
          input.profile?.home,
        ),
      }
      : processRequest,
    providerCompatibility: {
      remoteControl: 'not_applicable',
      experimentalNonAnthropicModel: false,
    },
    diagnostics,
  };
}

/** Parses bounded launch output and verifies the complete returned route identity. */
export function observeCodexLaunch(log: string, expected: RouteIdentity): CodexLaunchObservation {
  const thread = parseThreadInfo(log.slice(-MAX_AGENT_CAPTURE_BYTES));
  const diagnostics: RuntimeDiagnostic[] = [];
  if (!thread.threadId) {
    diagnostics.push(diagnostic('missing_identity', 'input', 'launch returned no thread identity'));
  }
  if (!thread.cwd) {
    diagnostics.push(
      diagnostic('missing_identity', 'input', 'launch returned no worktree identity'),
    );
  } else if (thread.cwd !== expected.worktree) {
    diagnostics.push(
      diagnostic('route_conflict', 'policy', 'launch returned a different worktree identity'),
    );
  }
  if (!thread.model) {
    diagnostics.push(diagnostic('missing_identity', 'input', 'launch returned no model identity'));
  } else if (thread.model !== expected.model) {
    diagnostics.push(
      diagnostic('route_conflict', 'policy', 'launch returned a different model identity'),
    );
  }
  if (thread.exited !== null && thread.exited !== 0) {
    diagnostics.push(diagnostic('process_failed', 'execution', 'Codex launch process failed'));
  }
  return {
    sessionId: thread.threadId,
    model: thread.model,
    worktree: thread.cwd,
    exited: thread.exited,
    diagnostics,
  };
}
