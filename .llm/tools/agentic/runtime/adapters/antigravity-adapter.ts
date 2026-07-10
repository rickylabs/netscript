/** Antigravity observation, bounded evidence acquisition, and command planning. */

import {
  type AntigravityCapability,
  type AntigravityEvidenceResult,
  classifyAntigravityEvidence,
} from '../antigravity-evidence.ts';
import type { CapabilityState, RuntimeCommand, RuntimeDiagnostic } from '../contract.ts';
import type { AgentCommandPlan, AgentProcessRequest } from '../ports.ts';
import { PROVIDER_CREDENTIAL_KEYS, PROVIDER_ROUTE_KEYS } from '../provider-profiles.ts';
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
export const ANTIGRAVITY_CANARY_TIMEOUT_MS = 30_000 as const;
export const ANTIGRAVITY_MAX_CAPTURE_BYTES: number = 64 * 1024;
export const ANTIGRAVITY_EVIDENCE_PROBES = [
  'headless',
  'web-citations',
  'agents-instructions',
  'gemini-instructions',
] as const;
export type AntigravityEvidenceProbe = typeof ANTIGRAVITY_EVIDENCE_PROBES[number];
export interface AntigravityEvidenceRequest {
  readonly cwd: string;
  readonly probe: AntigravityEvidenceProbe;
  readonly timeoutMs?: number;
  readonly model?: string;
  readonly agent?: string;
  readonly project?: string;
  readonly ownerAcceptedCapabilities?: readonly AntigravityCapability[];
}
interface AntigravityCommandOutput {
  readonly code: number;
  readonly stdout: Uint8Array;
  readonly stderr: Uint8Array;
}
export interface AntigravityCommandOptions {
  readonly cwd: string;
  readonly args: string[];
  readonly env: Readonly<Record<string, string>>;
  readonly clearEnv: true;
  readonly stdin: 'null';
  readonly stdout: 'piped';
  readonly stderr: 'piped';
  readonly signal: AbortSignal;
}
export type AntigravityCommandFactory = (
  executable: string,
  options: AntigravityCommandOptions,
) => { output(): Promise<AntigravityCommandOutput> };
export interface AntigravityEnvironmentReader {
  toObject(): Record<string, string>;
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

function defaultCommandFactory(
  executable: string,
  options: AntigravityCommandOptions,
): { output(): Promise<AntigravityCommandOutput> } {
  return new Deno.Command(executable, options);
}

function prompt(probe: AntigravityEvidenceProbe): string {
  if (probe === 'headless') {
    return 'Read-only canary. Reply with exactly AGY_HEADLESS_CANARY_OK. Do not use tools or modify files.';
  }
  if (probe === 'web-citations') {
    return 'Read-only canary. Fetch one official Deno documentation page and return one HTTPS citation. Do not modify files.';
  }
  if (probe === 'agents-instructions') {
    return 'Read-only canary. Follow the repository AGENTS.md and reply with AGENTS_INSTRUCTION_OK. Do not modify files.';
  }
  return 'Read-only canary. Follow the repository GEMINI.md and reply with GEMINI_INSTRUCTION_OK. Do not modify files.';
}

function expectedMarker(probe: AntigravityEvidenceProbe): string | undefined {
  return probe === 'headless' ? 'AGY_HEADLESS_CANARY_OK' : undefined;
}

function environment(reader: AntigravityEnvironmentReader): Record<string, string> {
  const child = { ...reader.toObject() };
  for (const key of [...PROVIDER_CREDENTIAL_KEYS, ...PROVIDER_ROUTE_KEYS]) delete child[key];
  return child;
}

/** Runs one fixed, bounded, read-only Antigravity probe and returns classified evidence only. */
export class AntigravityEvidenceAdapter {
  readonly #environment: AntigravityEnvironmentReader;
  readonly #commands: AntigravityCommandFactory;

  constructor(
    environmentReader: AntigravityEnvironmentReader = { toObject: () => Deno.env.toObject() },
    commands: AntigravityCommandFactory = defaultCommandFactory,
  ) {
    this.#environment = environmentReader;
    this.#commands = commands;
  }

  async run(request: AntigravityEvidenceRequest): Promise<AntigravityEvidenceResult> {
    const timeoutMs = Math.max(
      1,
      Math.min(request.timeoutMs ?? ANTIGRAVITY_CANARY_TIMEOUT_MS, 60_000),
    );
    const args = [
      '--print',
      '--print-timeout',
      `${timeoutMs}ms`,
      '--sandbox',
      ...(request.model ? ['--model', request.model] : []),
      ...(request.agent ? ['--agent', request.agent] : []),
      ...(request.project ? ['--project', request.project] : []),
      prompt(request.probe),
    ];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const output = await this.#commands('agy', {
        cwd: request.cwd,
        args,
        env: environment(this.#environment),
        clearEnv: true,
        stdin: 'null',
        stdout: 'piped',
        stderr: 'piped',
        signal: controller.signal,
      }).output();
      return classifyAntigravityEvidence({
        exitCode: output.code,
        timedOut: false,
        stdout: new TextDecoder().decode(output.stdout.slice(0, ANTIGRAVITY_MAX_CAPTURE_BYTES)),
        stderr: new TextDecoder().decode(output.stderr.slice(0, ANTIGRAVITY_MAX_CAPTURE_BYTES)),
        expectedMarker: expectedMarker(request.probe),
        expectedInstructionMarker: request.probe === 'agents-instructions'
          ? 'AGENTS'
          : request.probe === 'gemini-instructions'
          ? 'GEMINI'
          : undefined,
        ownerAcceptedCapabilities: request.ownerAcceptedCapabilities,
      });
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'AbortError';
      return classifyAntigravityEvidence({
        exitCode: 1,
        timedOut,
        stdout: '',
        stderr: timedOut ? 'timeout' : '',
        expectedMarker: expectedMarker(request.probe),
        ownerAcceptedCapabilities: request.ownerAcceptedCapabilities,
      });
    } finally {
      clearTimeout(timer);
    }
  }
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
