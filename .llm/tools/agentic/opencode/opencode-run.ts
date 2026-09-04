/** Runs one bounded, non-interactive OpenCode turn. */

import { OPENCODE_TOOL } from '../config/versions.ts';
import { COPILOT_LAUNCH_CREDIT_CAPS } from '../config/subscriptions.ts';
import { compareLaunchIdentity } from '../runtime/launch-route-identity.ts';
export { parseOpenRouterApiKey } from '../lib/openrouter-credential.ts';
import {
  environmentWithOpenCodeCredential,
  openCodeCredentialProviderForModel,
} from '../lib/provider-credential.ts';
import { dirname, resolve } from 'node:path';
import { prepareOpenCodeProjectEnvironment } from './opencode-project-config.ts';
import { preflightCopilotCatalog, preflightOpenCodeMcp } from './opencode-preflight.ts';
import { normalizeTaskArguments } from '../lib/task-arguments.ts';
import {
  evaluateSubscriptionExpense,
  type ExpenseDecision,
  parseExpenseUsageSnapshot,
} from '../runtime/subscription-expense.ts';
import { fetchOpenCodeGoUsageSnapshot, reserveCopilotCredits } from '../runtime/provider-usage.ts';
import {
  assertOwnerMatrixOverride,
  assertPrivilegedTierAuthorization,
  assertWorkloadEffortAllowed,
  assertWorkloadModelAllowed,
  DELEGATION_ROLES,
  type DelegationRole,
  LOGICAL_MODEL_IDS,
  type LogicalModelId,
  type OwnerMatrixOverride,
  ownerMatrixOverrideWorklogEntry,
  type PrivilegedTierAuthorization,
  WORKLOAD_TIERS,
  type WorkloadTier,
} from '../runtime/delegation-matrix.ts';
import { type Effort, EFFORTS } from '../runtime/contract.ts';

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
  readonly maxAiCredits?: number;
  readonly workloadTier?: WorkloadTier;
  readonly workloadRole?: DelegationRole;
  readonly privilegedTierAuthorization?: PrivilegedTierAuthorization;
  readonly ownerMatrixOverride?: OwnerMatrixOverride;
}

export interface OpenCodeRunResult {
  readonly code: number;
  readonly stdout?: string;
}

export interface OpenCodeRunDependencies {
  readonly repositoryIdentity?: (cwd: string) => Promise<{ branch: string; head: string }>;
  readonly listModels?: (binary: string, options: Deno.CommandOptions) => Promise<string>;
  readonly reserveCopilot?: typeof reserveCopilotCredits;
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

async function repositoryIdentity(cwd: string): Promise<{ branch: string; head: string }> {
  const read = async (args: string[]): Promise<string> => {
    const result = await new Deno.Command('git', { args, cwd, stdout: 'piped', stderr: 'null' })
      .output();
    if (!result.success) throw new Error('Copilot launch requires a Git branch and exact head');
    return new TextDecoder().decode(result.stdout).trim();
  };
  return {
    branch: await read(['symbolic-ref', '--short', 'HEAD']),
    head: await read(['rev-parse', 'HEAD']),
  };
}

/**
 * Builds the OpenCode argv. The message deliberately comes immediately after
 * `run`: OpenCode's `-f` flag accepts an array and otherwise swallows a trailing
 * positional message as another filename.
 */
export function opencodeRunArguments(options: OpenCodeRunOptions): string[] {
  const copilot = openCodeCredentialProviderForModel(options.model) === 'github_copilot';
  return [
    'run',
    options.message,
    '-m',
    options.model,
    ...(!copilot || options.variant !== 'provider_default' ? ['--variant', options.variant] : []),
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
  if (!options.workloadTier) {
    throw new Error(`paid ${provider} route requires --workload-tier`);
  }
  if (!options.workloadRole) {
    throw new Error(`paid ${provider} route requires --workload-role`);
  }
  if (options.ownerMatrixOverride) {
    assertOwnerMatrixOverride(
      options.workloadTier,
      options.workloadRole,
      options.ownerMatrixOverride,
    );
    const cwd = resolve(options.cwd ?? Deno.cwd());
    const worklog = await (dependencies.readTextFile ?? Deno.readTextFile)(
      resolve(cwd, options.ownerMatrixOverride.worklogPath),
    );
    const expected = ownerMatrixOverrideWorklogEntry(
      options.workloadTier,
      options.workloadRole,
      options.ownerMatrixOverride,
    );
    if (!worklog.includes(expected)) {
      throw new Error('owner matrix override is missing its exact harness worklog entry');
    }
  } else {
    assertPrivilegedTierAuthorization(options.workloadTier, options.privilegedTierAuthorization);
  }
  assertWorkloadModelAllowed(
    options.workloadTier,
    options.workloadRole,
    options.model,
    options.ownerMatrixOverride,
  );
  if (options.variant !== 'provider_default' && !EFFORTS.includes(options.variant as Effort)) {
    throw new Error('OpenCode variant must be provider_default or a declared effort');
  }
  assertWorkloadEffortAllowed(
    options.workloadTier,
    options.workloadRole,
    options.model,
    options.variant as Effort | 'provider_default',
    provider === 'github_copilot' ? undefined : OPENCODE_TOOL.defaultVariant,
    options.ownerMatrixOverride,
  );
  if (provider === 'github_copilot') {
    if (options.usageSnapshotPath) {
      throw new Error('Copilot requires its operational ledger, not --usage-snapshot');
    }
    const decision = await (dependencies.reserveCopilot ?? reserveCopilotCredits)({
      cap: options.maxAiCredits ?? COPILOT_LAUNCH_CREDIT_CAPS[options.workloadTier],
      now: (dependencies.now ?? (() => new Date().toISOString()))(),
      worktree: resolve(options.cwd ?? Deno.cwd()),
      env: dependencies.env,
    });
    if (!decision.allowed) throw new Error(`expense guard blocked ${provider}: ${decision.reason}`);
    return decision;
  }
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
  const args = opencodeRunArguments(options);
  const copilot = openCodeCredentialProviderForModel(options.model) === 'github_copilot';
  if (copilot && !options.receiptPath) throw new Error('Copilot launch requires --receipt');
  const gitIdentity = copilot
    ? await (dependencies.repositoryIdentity ?? repositoryIdentity)(cwd)
    : undefined;
  if (copilot && options.requiredMcp?.length) {
    throw new Error(
      'Copilot inference-based MCP preflight needs a separate authorized reservation',
    );
  }
  const attestation = copilot
    ? await preflightCopilotCatalog(options.model, {
      cwd,
      variant: options.variant,
      env: processEnv,
      now: dependencies.now,
      listModels: dependencies.listModels,
    })
    : undefined;
  if (attestation && (!attestation.present || !attestation.variantPresent)) {
    throw new Error(
      'Copilot catalog model or variant absent; mark github_copilot transport unavailable',
    );
  }
  const expense = await preflightOpenCodeExpense(options, dependencies);
  if (options.receiptPath) {
    await Deno.mkdir(dirname(resolve(cwd, options.receiptPath)), { recursive: true });
    if (attestation) {
      const identity = compareLaunchIdentity({
        provider: 'github_copilot',
        transport: 'github_copilot',
        model: options.model,
        effort: options.variant,
      }, {
        provider: 'github_copilot',
        model: null,
        effort: null,
        transport: 'github_copilot',
        catalog: attestation,
      });
      await Deno.writeTextFile(
        resolve(cwd, options.receiptPath),
        JSON.stringify({
          kind: 'copilot_launch',
          identity,
          expense,
          observationSource: 'connector_catalog',
          requestedCreditCap: options.maxAiCredits ??
            (options.workloadTier ? COPILOT_LAUNCH_CREDIT_CAPS[options.workloadTier] : null),
          providerEnforcedCap: false,
          cwd,
          ...gitIdentity,
          session: options.session ?? null,
          ownerMatrixOverride: options.ownerMatrixOverride ?? null,
        }) + '\n',
        { append: true, mode: 0o600 },
      );
    }
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
    args,
    cwd,
    env,
    clearEnv: true,
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
  let maxAiCredits: number | undefined;
  let workloadTier: WorkloadTier | undefined;
  let workloadRole: DelegationRole | undefined;
  let privilegedAuthorizer: PrivilegedTierAuthorization['authorizer'] | undefined;
  let privilegedRationale: string | undefined;
  let overrideModel: LogicalModelId | undefined;
  let overrideEffort: Effort | 'provider_default' | undefined;
  let overrideRationale: string | undefined;
  let overrideWorklog: string | undefined;
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
    } else if (argument === '--max-ai-credits') {
      maxAiCredits = Number(requiredValue(args, index++, argument));
      if (!Number.isSafeInteger(maxAiCredits) || maxAiCredits <= 0) {
        throw new Error('--max-ai-credits must be a positive integer');
      }
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
    } else if (argument === '--owner-override-model') {
      const value = requiredValue(args, index++, argument);
      if (!LOGICAL_MODEL_IDS.includes(value as LogicalModelId)) {
        throw new Error('--owner-override-model must be a declared logical model');
      }
      overrideModel = value as LogicalModelId;
    } else if (argument === '--owner-override-effort') {
      const value = requiredValue(args, index++, argument);
      if (value !== 'provider_default' && !EFFORTS.includes(value as Effort)) {
        throw new Error('--owner-override-effort must be provider_default or a declared effort');
      }
      overrideEffort = value as Effort | 'provider_default';
    } else if (argument === '--owner-override-rationale') {
      overrideRationale = requiredValue(args, index++, argument);
    } else if (argument === '--owner-override-worklog') {
      overrideWorklog = requiredValue(args, index++, argument);
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
        '[--owner-override-model <logical-model> --owner-override-effort <effort> ' +
        '--owner-override-rationale <text> --owner-override-worklog <path>] ' +
        '[--format default|json] [--capture]',
    );
  }
  if (
    (privilegedAuthorizer && !privilegedRationale) || (!privilegedAuthorizer && privilegedRationale)
  ) {
    throw new Error('--privileged-authorizer and --privileged-rationale must be supplied together');
  }
  const overrideValues = [overrideModel, overrideEffort, overrideRationale, overrideWorklog];
  if (
    overrideValues.some((value) => value !== undefined) &&
    overrideValues.some((value) => value === undefined)
  ) {
    throw new Error('all --owner-override-* arguments must be supplied together');
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
    ...(maxAiCredits !== undefined ? { maxAiCredits } : {}),
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
    ...(overrideModel && overrideEffort && overrideRationale && overrideWorklog
      ? {
        ownerMatrixOverride: {
          authorizer: 'owner',
          rationale: overrideRationale,
          worklogPath: overrideWorklog,
          route: { model: overrideModel, effort: overrideEffort },
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
