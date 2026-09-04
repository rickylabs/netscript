/** Runs one bounded, non-interactive OpenCode turn. */

import { OPENCODE_TOOL } from '../config/versions.ts';
export { parseOpenRouterApiKey } from '../lib/openrouter-credential.ts';
import {
  environmentWithOpenCodeCredential,
  openCodeCredentialProviderForModel,
} from '../lib/provider-credential.ts';
import { dirname, resolve } from 'node:path';
import { prepareOpenCodeProjectEnvironment } from './opencode-project-config.ts';
import { preflightOpenCodeMcp } from './opencode-preflight.ts';
import { normalizeTaskArguments } from '../lib/task-arguments.ts';
import {
  evaluateSubscriptionExpense,
  type ExpenseDecision,
  parseExpenseUsageSnapshot,
} from '../runtime/subscription-expense.ts';
import { fetchOpenCodeGoUsageSnapshot } from '../runtime/provider-usage.ts';
import {
  assertPrivilegedTierAuthorization,
  assertWorkloadModelAllowed,
  DELEGATION_ROLES,
  type DelegationRole,
  type PrivilegedTierAuthorization,
  WORKLOAD_TIERS,
  type WorkloadTier,
} from '../runtime/delegation-matrix.ts';

export type OpenCodeOutputFormat = 'default' | 'json';

export interface OpenCodeRunOptions {
  readonly message: string;
  readonly model: string;
  readonly variant: string;
  readonly files?: readonly string[];
  readonly format?: OpenCodeOutputFormat;
  readonly session?: string;
  readonly cwd?: string;
  readonly requiredMcp?: readonly string[];
  readonly receiptPath?: string;
  readonly usageSnapshotPath?: string;
  readonly estimatedCostUsd?: number;
  readonly workloadTier?: WorkloadTier;
  readonly workloadRole?: DelegationRole;
  readonly privilegedTierAuthorization?: PrivilegedTierAuthorization;
}

export interface OpenCodeRunResult {
  readonly code: number;
  readonly stdout?: string;
}

export interface OpenCodeRunDependencies {
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly fetch?: typeof fetch;
  readonly readTextFile?: (path: string) => Promise<string>;
  readonly now?: () => string;
  readonly stat?: (path: string) => Promise<Pick<Deno.FileInfo, 'mode'>>;
  readonly spawn?: (
    binary: string,
    options: Deno.CommandOptions,
  ) => Deno.ChildProcess;
}

interface CliOptions extends OpenCodeRunOptions {
  readonly capture: boolean;
}

type Environment = Readonly<Record<string, string | undefined>>;

/**
 * Builds the OpenCode argv. The message deliberately comes immediately after
 * `run`: OpenCode's `-f` flag accepts an array and otherwise swallows a trailing
 * positional message as another filename.
 */
export function opencodeRunArguments(options: OpenCodeRunOptions): string[] {
  return [
    'run',
    options.message,
    '-m',
    options.model,
    '--variant',
    options.variant,
    ...(options.session ? ['--session', options.session] : []),
    ...(options.files ?? []).flatMap((file) => ['-f', file]),
    ...(options.format === 'json' ? ['--format', 'json'] : []),
  ];
}

/** Resolves an explicit override before delegating PATH lookup to Deno.Command. */
export function resolveOpenCodeBinary(env: Environment): string {
  return env.OPENCODE_BIN?.trim() || OPENCODE_TOOL.binary;
}

/** Returns a child environment with only the selected provider credential. */
export async function openCodeChildEnvironment(
  env: Environment = Deno.env.toObject(),
  readTextFile: (path: string) => Promise<string> = Deno.readTextFile,
  options: {
    readonly cwd?: string;
    readonly receiptPath?: string;
    readonly model?: string;
    readonly stat?: (path: string) => Promise<Pick<Deno.FileInfo, 'mode'>>;
  } = {},
): Promise<Record<string, string>> {
  const inherited = Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
  const credentialed = options.model
    ? await environmentWithOpenCodeCredential(
      options.model,
      env,
      readTextFile,
      options.stat ?? Deno.stat,
    )
    : inherited;
  return await prepareOpenCodeProjectEnvironment(credentialed, {
    cwd: resolve(options.cwd ?? Deno.cwd()),
    receiptPath: options.receiptPath,
  });
}

/** Proves allowance before any paid OpenCode process is spawned. */
export async function preflightOpenCodeExpense(
  options: OpenCodeRunOptions,
  dependencies: OpenCodeRunDependencies = {},
): Promise<ExpenseDecision | null> {
  const provider = openCodeCredentialProviderForModel(options.model);
  if (!provider) return null;
  if (provider === 'github_copilot') {
    throw new Error('Copilot launch requires catalog attestation and credit reservation');
  }
  if (!options.workloadTier) {
    throw new Error(`paid ${provider} route requires --workload-tier`);
  }
  if (!options.workloadRole) {
    throw new Error(`paid ${provider} route requires --workload-role`);
  }
  assertPrivilegedTierAuthorization(options.workloadTier, options.privilegedTierAuthorization);
  assertWorkloadModelAllowed(options.workloadTier, options.workloadRole, options.model);
  if (options.estimatedCostUsd === undefined) {
    throw new Error(
      `paid ${provider} route requires --estimated-cost-usd`,
    );
  }
  let snapshot;
  if (provider === 'opencode_go') {
    if (options.usageSnapshotPath) {
      throw new Error('OpenCode Go does not accept --usage-snapshot; live usage is required');
    }
    snapshot = await fetchOpenCodeGoUsageSnapshot(options.model, {
      env: dependencies.env,
      fetch: dependencies.fetch,
      readTextFile: dependencies.readTextFile,
      stat: dependencies.stat,
      now: dependencies.now,
    });
  } else {
    if (!options.usageSnapshotPath) {
      throw new Error(`paid ${provider} route requires --usage-snapshot`);
    }
    const cwd = resolve(options.cwd ?? Deno.cwd());
    const source = await (dependencies.readTextFile ?? Deno.readTextFile)(
      resolve(cwd, options.usageSnapshotPath),
    );
    snapshot = parseExpenseUsageSnapshot(source);
  }
  const decision = evaluateSubscriptionExpense({
    provider,
    model: options.model,
    estimatedCostUsd: options.estimatedCostUsd,
    snapshot,
    now: (dependencies.now ?? (() => new Date().toISOString()))(),
  });
  if (!decision.allowed) {
    throw new Error(`expense guard blocked ${provider}: ${decision.reason}`);
  }
  return decision;
}

/** Executes OpenCode with either inherited output or captured stdout. */
export async function runOpenCode(
  options: OpenCodeRunOptions,
  capture = false,
  dependencies: OpenCodeRunDependencies = {},
): Promise<OpenCodeRunResult> {
  const processEnv = dependencies.env ?? Deno.env.toObject();
  const cwd = resolve(options.cwd ?? Deno.cwd());
  await preflightOpenCodeExpense(options, dependencies);
  if (options.receiptPath) {
    await Deno.mkdir(dirname(resolve(cwd, options.receiptPath)), { recursive: true });
  }
  const env = await openCodeChildEnvironment(
    processEnv,
    dependencies.readTextFile ?? Deno.readTextFile,
    {
      cwd,
      receiptPath: options.receiptPath,
      model: options.model,
      stat: dependencies.stat,
    },
  );
  if (options.requiredMcp?.length) {
    if (!options.receiptPath) {
      throw new Error('--receipt is required when --require-mcp is used');
    }
    await preflightOpenCodeMcp({
      cwd,
      requiredServers: options.requiredMcp,
      model: options.model,
      variant: options.variant,
      env,
      receiptPath: options.receiptPath,
    });
  }
  const binary = resolveOpenCodeBinary(processEnv);
  const commandOptions: Deno.CommandOptions = {
    args: opencodeRunArguments(options),
    cwd,
    env,
    stdin: 'null',
    stdout: capture ? 'piped' : 'inherit',
    stderr: 'inherit',
  };
  const child = dependencies.spawn
    ? dependencies.spawn(binary, commandOptions)
    : new Deno.Command(binary, commandOptions).spawn();
  const stdout = capture ? new Response(child.stdout).text() : undefined;
  const status = await child.status;
  return {
    code: status.code,
    ...(stdout ? { stdout: await stdout } : {}),
  };
}

function requiredValue(args: readonly string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value?.trim()) throw new Error(`${flag} requires a value`);
  return value;
}

function parse(args: readonly string[]): CliOptions {
  args = normalizeTaskArguments(args);
  let message: string | undefined;
  let model: string | undefined;
  let variant: string = OPENCODE_TOOL.defaultVariant;
  let format: OpenCodeOutputFormat = 'default';
  let capture = false;
  const files: string[] = [];
  let session: string | undefined;
  let cwd: string | undefined;
  let receiptPath: string | undefined;
  let usageSnapshotPath: string | undefined;
  let estimatedCostUsd: number | undefined;
  let workloadTier: WorkloadTier | undefined;
  let workloadRole: DelegationRole | undefined;
  let privilegedAuthorizer: PrivilegedTierAuthorization['authorizer'] | undefined;
  let privilegedRationale: string | undefined;
  const requiredMcp: string[] = [];

  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--message') message = requiredValue(args, index++, argument);
    else if (argument === '-m' || argument === '--model') {
      model = requiredValue(args, index++, argument);
    } else if (argument === '--variant') variant = requiredValue(args, index++, argument);
    else if (argument === '-f' || argument === '--file') {
      files.push(requiredValue(args, index++, argument));
    } else if (argument === '--format') {
      const value = requiredValue(args, index++, argument);
      if (value !== 'default' && value !== 'json') {
        throw new Error('--format must be default or json');
      }
      format = value;
    } else if (argument === '--capture') capture = true;
    else if (argument === '-s' || argument === '--session') {
      session = requiredValue(args, index++, argument);
    } else if (argument === '--cwd' || argument === '--dir') {
      cwd = requiredValue(args, index++, argument);
    } else if (argument === '--require-mcp') {
      requiredMcp.push(requiredValue(args, index++, argument));
    } else if (argument === '--receipt') {
      receiptPath = requiredValue(args, index++, argument);
    } else if (argument === '--usage-snapshot') {
      usageSnapshotPath = requiredValue(args, index++, argument);
    } else if (argument === '--estimated-cost-usd') {
      const value = Number(requiredValue(args, index++, argument));
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error('--estimated-cost-usd must be a positive number');
      }
      estimatedCostUsd = value;
    } else if (argument === '--workload-tier') {
      const value = requiredValue(args, index++, argument);
      if (!WORKLOAD_TIERS.includes(value as WorkloadTier)) {
        throw new Error(
          '--workload-tier must be simple, straightforward, feature, complex, or architecture',
        );
      }
      workloadTier = value as WorkloadTier;
    } else if (argument === '--workload-role') {
      const value = requiredValue(args, index++, argument);
      if (!DELEGATION_ROLES.includes(value as DelegationRole)) {
        throw new Error('--workload-role is not a declared delegation role');
      }
      workloadRole = value as DelegationRole;
    } else if (argument === '--privileged-authorizer') {
      const value = requiredValue(args, index++, argument);
      if (value !== 'owner' && value !== 'milestone_coordinator') {
        throw new Error('--privileged-authorizer must be owner or milestone_coordinator');
      }
      privilegedAuthorizer = value;
    } else if (argument === '--privileged-rationale') {
      privilegedRationale = requiredValue(args, index++, argument);
    } else if (!argument.startsWith('-') && !message) message = argument;
    else throw new Error(`Unknown or duplicate argument: ${argument}`);
  }

  if (!message?.trim() || !model?.trim() || !variant.trim()) {
    throw new Error(
      'Usage: opencode-run <message>|--message <text> --model <provider/model> ' +
        '[--variant <effort>] [-s <session>] [--cwd <project>] [-f <path> ...] ' +
        '[--require-mcp <server> ...] [--receipt <jsonl>] ' +
        '[--usage-snapshot <json>] [--estimated-cost-usd <amount>] ' +
        '[--workload-tier <tier> --workload-role <role> ' +
        '--privileged-authorizer <authority> ' +
        '--privileged-rationale <text>] ' +
        '[--format default|json] [--capture]',
    );
  }
  if (
    (privilegedAuthorizer && !privilegedRationale) || (!privilegedAuthorizer && privilegedRationale)
  ) {
    throw new Error('--privileged-authorizer and --privileged-rationale must be supplied together');
  }
  return {
    message,
    model,
    variant,
    files,
    format,
    capture,
    ...(session ? { session } : {}),
    ...(cwd ? { cwd } : {}),
    ...(requiredMcp.length ? { requiredMcp } : {}),
    ...(receiptPath ? { receiptPath } : {}),
    ...(usageSnapshotPath ? { usageSnapshotPath } : {}),
    ...(estimatedCostUsd !== undefined ? { estimatedCostUsd } : {}),
    ...(workloadTier ? { workloadTier } : {}),
    ...(workloadRole ? { workloadRole } : {}),
    ...(privilegedAuthorizer && privilegedRationale
      ? {
        privilegedTierAuthorization: {
          authorizer: privilegedAuthorizer,
          rationale: privilegedRationale,
        },
      }
      : {}),
  };
}

if (import.meta.main) {
  try {
    const options = parse(Deno.args);
    const result = await runOpenCode(options, options.capture);
    if (result.stdout !== undefined) {
      await Deno.stdout.write(new TextEncoder().encode(result.stdout));
    }
    Deno.exit(result.code);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(2);
  }
}
