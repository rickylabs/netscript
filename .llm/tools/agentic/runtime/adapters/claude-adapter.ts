/** Data-only Claude static-smoke planning with explicit owner-only live boundaries. */

import type { RuntimeCommand, RuntimeDiagnostic } from '../contract.ts';
import type { AgentCommandPlan, AgentProcessRequest } from '../ports.ts';
import { AGENT_COMMAND_TIMEOUT_MS, MAX_AGENT_CAPTURE_BYTES } from './codex-adapter.ts';
import { validateProviderRoute } from './provider-adapter.ts';

export const CLAUDE_SMOKE_WRAPPER = '.llm/tools/agentic/claude-remote-smoke.ts';

type ClaudeCommand = Extract<RuntimeCommand, { kind: 'launch' | 'resume' | 'smoke' }>;

export interface ClaudePlanningInput {
  readonly command: ClaudeCommand;
  readonly nativeExt4: boolean;
  readonly credentialKeyNames?: readonly string[];
}

function diagnostic(
  code: RuntimeDiagnostic['code'],
  category: RuntimeDiagnostic['category'],
  message: string,
): RuntimeDiagnostic {
  return { code, category, retryable: false, message };
}

function staticRequest(path: string, cwd: string): AgentProcessRequest {
  return {
    executable: 'deno',
    arguments: [
      'run',
      '--no-lock',
      '--allow-read',
      '--allow-run',
      CLAUDE_SMOKE_WRAPPER,
      '--prompt',
      path,
      '--timeout-ms',
      String(AGENT_COMMAND_TIMEOUT_MS),
    ],
    cwd,
    timeoutMs: AGENT_COMMAND_TIMEOUT_MS,
    maxCaptureBytes: MAX_AGENT_CAPTURE_BYTES,
  };
}

/** Builds the bounded Claude static smoke or an explicit unsupported lifecycle result. */
export function planClaudeCommand(input: ClaudePlanningInput): AgentCommandPlan {
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
  if (command.route.agent !== 'claude') {
    diagnostics.push(
      diagnostic('route_conflict', 'policy', 'Claude adapter requires a Claude route'),
    );
  }
  let request: AgentProcessRequest | null = null;
  if (command.kind !== 'smoke') {
    diagnostics.push(diagnostic(
      'capability_unsupported',
      'capability',
      'Claude launch and resume are not implemented by the S3 static-smoke adapter',
    ));
  } else if (command.level === 'live') {
    diagnostics.push(diagnostic(
      'capability_unsupported',
      'capability',
      'Claude interactive login and mobile canaries require explicit owner execution',
    ));
  } else if (!command.content?.path.trim()) {
    diagnostics.push(
      diagnostic(
        'invalid_state_file',
        'input',
        'Claude static smoke requires a content file reference',
      ),
    );
  } else if (!diagnostics.length) {
    request = staticRequest(command.content.path, command.route.worktree);
  }
  return {
    agent: 'claude',
    operation: command.kind,
    route: command.route,
    ...('content' in command && command.content ? { content: command.content } : {}),
    request,
    diagnostics,
  };
}
