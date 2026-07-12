/** Data-only Claude static-smoke planning with explicit owner-only live boundaries. */

import type { RuntimeCommand, RuntimeDiagnostic } from '../contract.ts';
import type { AgentCommandPlan, AgentProcessRequest } from '../ports.ts';
import { childEnvironmentPolicyForProfile, resolveProviderProfile } from '../provider-profiles.ts';
import { AGENT_COMMAND_TIMEOUT_MS, MAX_AGENT_CAPTURE_BYTES } from './codex-adapter.ts';
import { validateProviderRoute } from './provider-adapter.ts';

export const CLAUDE_SMOKE_WRAPPER = '.llm/tools/agentic/claude/claude-remote-smoke.ts';
export const CLAUDE_PRINT_WRAPPER = '.llm/tools/agentic/claude/claude-print.ts';

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

function staticRequest(
  path: string,
  cwd: string,
  model: string,
  environment: import('../ports.ts').ChildEnvironmentPolicy,
): AgentProcessRequest {
  return {
    executable: 'deno',
    arguments: [
      'run',
      '--no-lock',
      '--allow-read',
      '--allow-run',
      CLAUDE_SMOKE_WRAPPER,
      '--model',
      model,
      '--prompt',
      path,
      '--timeout-ms',
      String(AGENT_COMMAND_TIMEOUT_MS),
    ],
    cwd,
    timeoutMs: AGENT_COMMAND_TIMEOUT_MS,
    maxCaptureBytes: MAX_AGENT_CAPTURE_BYTES,
    environment,
  };
}

function printRequest(
  command: Extract<ClaudeCommand, { kind: 'launch' | 'resume' }>,
  environment: import('../ports.ts').ChildEnvironmentPolicy,
): AgentProcessRequest {
  return {
    executable: 'deno',
    arguments: [
      'run',
      '--no-lock',
      '--allow-read',
      '--allow-run',
      CLAUDE_PRINT_WRAPPER,
      '--model',
      command.route.model,
      '--effort',
      command.route.effort,
      '--prompt',
      command.content.path,
      ...(command.kind === 'resume' ? ['--resume', command.session.sessionId] : []),
    ],
    cwd: command.route.worktree,
    timeoutMs: AGENT_COMMAND_TIMEOUT_MS,
    maxCaptureBytes: MAX_AGENT_CAPTURE_BYTES,
    environment,
  };
}

/** Builds bounded Claude smoke or isolated gateway launch/resume requests. */
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
  const profile = resolveProviderProfile(command.route);
  if (command.route.agent !== 'claude') {
    diagnostics.push(
      diagnostic('route_conflict', 'policy', 'Claude adapter requires a Claude route'),
    );
  }
  let request: AgentProcessRequest | null = null;
  const customRoute = profile?.endpointKind === 'custom' || profile?.endpointKind === 'openrouter';
  if (command.kind === 'smoke') {
    if (command.level === 'live') {
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
    } else if (!diagnostics.length && profile) {
      request = staticRequest(
        command.content.path,
        command.route.worktree,
        command.route.model,
        childEnvironmentPolicyForProfile(profile, command.route),
      );
    }
  } else if (!customRoute || command.route.mobileRequired) {
    diagnostics.push(diagnostic(
      'capability_unsupported',
      'capability',
      customRoute
        ? 'Claude gateway print sessions do not provide native mobile remote control'
        : 'native Claude launch/resume requires the remote-control session adapter',
    ));
  } else if (!command.content.path.trim()) {
    diagnostics.push(
      diagnostic('invalid_state_file', 'input', 'Claude content file reference is missing'),
    );
  } else if (!diagnostics.length && profile) {
    request = printRequest(
      command,
      childEnvironmentPolicyForProfile(profile, command.route),
    );
  }
  return {
    agent: 'claude',
    operation: command.kind,
    route: command.route,
    ...('content' in command && command.content ? { content: command.content } : {}),
    request,
    providerCompatibility: {
      remoteControl: customRoute ? 'unavailable' : 'available',
      experimentalNonAnthropicModel: customRoute && !command.route.model.startsWith('anthropic/'),
    },
    diagnostics,
  };
}
