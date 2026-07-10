/** Read-only provider canaries with private bounded process-output reduction. */

import type { RouteIdentity } from '../contract.ts';
import type { AgentProcessRequest, ChildEnvironmentPolicy } from '../ports.ts';
import {
  evaluateProviderCanary,
  type ProviderCanaryObservation,
  type ProviderCanaryResult,
} from '../provider-canary.ts';
import { childEnvironmentPolicyForProfile, resolveProviderProfile } from '../provider-profiles.ts';
import type { EnvironmentReader } from './child-process-environment-adapter.ts';
import type { CodexProfileReference } from './codex-profile-adapter.ts';

const CANARY_PROMPT = [
  'Read-only compatibility canary.',
  'Use one read-only tool to report the current working directory.',
  'Then reply with exactly PROVIDER_CANARY_OK.',
  'Do not edit files or start another agent.',
].join(' ');
const CANARY_TIMEOUT_MS = 30_000;
const CANARY_CAPTURE_BYTES = 64 * 1024;

interface CanaryCommandOutput {
  readonly code: number;
  readonly stdout: Uint8Array;
  readonly stderr: Uint8Array;
}
export interface CanaryCommandOptions {
  readonly cwd: string;
  readonly args: string[];
  readonly env: Readonly<Record<string, string>>;
  readonly clearEnv: true;
  readonly stdin: 'null';
  readonly stdout: 'piped';
  readonly stderr: 'piped';
  readonly signal: AbortSignal;
}
export type CanaryCommandFactory = (
  executable: string,
  options: CanaryCommandOptions,
) => { output(): Promise<CanaryCommandOutput> };

function defaultCommandFactory(executable: string, options: CanaryCommandOptions): {
  output(): Promise<CanaryCommandOutput>;
} {
  return new Deno.Command(executable, options);
}

function materializeEnvironment(
  policy: ChildEnvironmentPolicy,
  reader: EnvironmentReader,
): Record<string, string> | null {
  const environment = { ...reader.toObject() };
  for (const key of policy.clearKeys) delete environment[key];
  for (const key of policy.emptyKeys ?? []) environment[key] = '';
  for (const fixed of policy.fixedValues ?? []) environment[fixed.targetKey] = fixed.value;
  for (const binding of policy.bindings) {
    if (
      policy.clearKeys.includes(binding.targetKey) || policy.emptyKeys?.includes(binding.targetKey)
    ) {
      return null;
    }
    const value = reader.get(binding.sourceKey);
    if (!value) return null;
    environment[binding.targetKey] = value;
  }
  return environment;
}

function includesCapability(value: unknown, capability: 'tools' | 'reasoning'): boolean {
  const encoded = JSON.stringify(value).toLowerCase();
  return capability === 'tools'
    ? encoded.includes('tool_use') || encoded.includes('function_call') ||
      encoded.includes('command_execution')
    : encoded.includes('reasoning') || encoded.includes('thinking');
}

function observeOutput(
  credential: 'available' | 'absent',
  output: CanaryCommandOutput | null,
  timedOut: boolean,
): ProviderCanaryObservation {
  if (!output) {
    return {
      credential,
      exitCode: 1,
      timedOut,
      malformed: false,
      eventCounts: { tools: 0, reasoning: 0, streaming: 0 },
    };
  }
  const text = new TextDecoder().decode(output.stdout.slice(0, CANARY_CAPTURE_BYTES));
  const events = text.split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try {
      return [JSON.parse(line) as unknown];
    } catch {
      return [];
    }
  });
  return {
    credential,
    exitCode: output.code,
    timedOut,
    malformed: events.length === 0,
    eventCounts: {
      tools: events.filter((event) => includesCapability(event, 'tools')).length,
      reasoning: events.filter((event) => includesCapability(event, 'reasoning')).length,
      streaming: events.length > 1 ? events.length : 0,
    },
  };
}

function canaryRequest(
  route: RouteIdentity,
  environment: ChildEnvironmentPolicy,
  codexProfile?: CodexProfileReference,
): AgentProcessRequest {
  if (route.agent === 'claude') {
    return {
      executable: 'claude',
      arguments: [
        '-p',
        '--model',
        route.model,
        '--permission-mode',
        'plan',
        '--output-format',
        'stream-json',
        '--verbose',
        CANARY_PROMPT,
      ],
      cwd: route.worktree,
      timeoutMs: CANARY_TIMEOUT_MS,
      maxCaptureBytes: CANARY_CAPTURE_BYTES,
      environment,
    };
  }
  return {
    executable: 'codex',
    arguments: [
      ...(codexProfile ? ['--profile', codexProfile.name] : []),
      'exec',
      '--ephemeral',
      '--sandbox',
      'read-only',
      '--json',
      CANARY_PROMPT,
    ],
    cwd: route.worktree,
    timeoutMs: CANARY_TIMEOUT_MS,
    maxCaptureBytes: CANARY_CAPTURE_BYTES,
    environment,
  };
}

/** Runs a bounded read-only canary and returns only structured compatibility evidence. */
export class ProviderCanaryAdapter {
  readonly #environment: EnvironmentReader;
  readonly #commands: CanaryCommandFactory;

  constructor(
    environment: EnvironmentReader = {
      get: (key) => Deno.env.get(key),
      toObject: () => Deno.env.toObject(),
    },
    commands: CanaryCommandFactory = defaultCommandFactory,
  ) {
    this.#environment = environment;
    this.#commands = commands;
  }

  async run(
    route: RouteIdentity,
    codexProfile?: CodexProfileReference,
  ): Promise<ProviderCanaryResult> {
    const profile = resolveProviderProfile(route);
    if (!profile) {
      return evaluateProviderCanary(route, {
        credential: 'absent',
        exitCode: null,
        timedOut: false,
        malformed: false,
        eventCounts: { tools: 0, reasoning: 0, streaming: 0 },
      });
    }
    if (profile.agent === 'codex' && profile.endpointKind === 'openrouter' && !codexProfile) {
      return evaluateProviderCanary(route, {
        credential: 'absent',
        exitCode: null,
        timedOut: false,
        malformed: false,
        eventCounts: { tools: 0, reasoning: 0, streaming: 0 },
      });
    }
    const policy = childEnvironmentPolicyForProfile(profile, route, codexProfile?.home);
    const environment = materializeEnvironment(policy, this.#environment);
    if (!environment) {
      return evaluateProviderCanary(route, {
        credential: 'absent',
        exitCode: null,
        timedOut: false,
        malformed: false,
        eventCounts: { tools: 0, reasoning: 0, streaming: 0 },
      });
    }
    const request = canaryRequest(route, policy, codexProfile);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), request.timeoutMs);
    try {
      const output = await this.#commands(request.executable, {
        cwd: request.cwd,
        args: [...request.arguments],
        env: environment,
        clearEnv: true,
        stdin: 'null',
        stdout: 'piped',
        stderr: 'piped',
        signal: controller.signal,
      }).output();
      return evaluateProviderCanary(route, observeOutput('available', output, false));
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'AbortError';
      return evaluateProviderCanary(route, observeOutput('available', null, timedOut));
    } finally {
      clearTimeout(timer);
    }
  }
}
