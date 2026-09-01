/**
 * Runs one bounded Claude print turn over the OpenRouter Anthropic-skin gateway.
 *
 * This is the first-class entry point for the `claude-openrouter` transport: it
 * removes the three manual steps the raw wrapper required (sourcing the
 * credential file, mapping `OPENROUTER_API_KEY` into the child as
 * `ANTHROPIC_AUTH_TOKEN`, and opting into the evaluator model guard). The guard
 * is not optional here — this route is open-models-only, so a closed model id
 * fails with the existing guard error and exit code.
 *
 * Because this is a credential-owning, paid-provider boundary it does NOT define
 * its own environment rules: it materializes the canonical `claude-openrouter`
 * provider profile (rival credential clearing plus an isolated
 * `CLAUDE_CONFIG_DIR`) and spawns the child with a replaced environment.
 */

import { type Effort, EFFORTS } from '../runtime/contract.ts';
import { OPENROUTER_ENV_RELATIVE_PATH } from '../config/versions.ts';
import {
  childEnvironmentPolicyForProfile,
  getProviderProfile,
} from '../runtime/provider-profiles.ts';
import {
  applyChildEnvironmentPolicy,
  type EnvironmentReader,
} from '../runtime/adapters/child-process-environment-adapter.ts';
import { parseOpenRouterApiKey } from '../opencode/opencode-run.ts';
import { type Options, runClaudePrint } from './claude-print.ts';
import { normalizeTaskArguments } from '../lib/task-arguments.ts';

export interface OpenRouterRunOptions {
  readonly model: string;
  readonly effort: Effort;
  readonly prompt: string;
  readonly resume?: string;
  readonly output?: string;
}

type Environment = Readonly<Record<string, string | undefined>>;

const FLAGS = ['--model', '--effort', '--prompt', '--resume', '--output'] as const;
type Flag = typeof FLAGS[number];

const USAGE = 'Usage: claude-openrouter --model <openrouter-id> --effort <level> --prompt <file> ' +
  '[--resume <session>] [--output <file>]';

/**
 * Parses the launcher argv strictly. Unknown, duplicate, and value-less flags
 * are rejected rather than ignored, so a typo fails before any request can
 * spend OpenRouter credit.
 */
export function parseOpenRouterRunArguments(args: readonly string[]): OpenRouterRunOptions {
  args = normalizeTaskArguments(args);
  const seen = new Map<Flag, string>();
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (!FLAGS.includes(flag as Flag)) {
      throw new Error(`Unknown argument: ${flag}. ${USAGE}`);
    }
    if (seen.has(flag as Flag)) {
      throw new Error(`Duplicate argument: ${flag}. ${USAGE}`);
    }
    const value = args[++index];
    if (!value?.trim() || FLAGS.includes(value as Flag)) {
      throw new Error(`${flag} requires a value. ${USAGE}`);
    }
    seen.set(flag as Flag, value);
  }

  const model = seen.get('--model');
  const effort = seen.get('--effort');
  const prompt = seen.get('--prompt');
  const resume = seen.get('--resume');
  const output = seen.get('--output');
  if (!model || !effort || !EFFORTS.includes(effort as Effort) || !prompt) {
    throw new Error(USAGE);
  }
  return {
    model,
    effort: effort as Effort,
    prompt,
    ...(resume ? { resume } : {}),
    ...(output ? { output } : {}),
  };
}

/** The route options handed to the print runner; the guard is never optional here. */
export function claudePrintOptionsFor(options: OpenRouterRunOptions): Options {
  return {
    model: options.model,
    effort: options.effort,
    prompt: options.prompt,
    ...(options.resume ? { resume: options.resume } : {}),
    enforceOpenEvaluatorModels: true,
  };
}

/** Resolves `OPENROUTER_API_KEY` without ever logging or returning it in a message. */
export async function resolveOpenRouterApiKey(
  env: Environment,
  readTextFile: (path: string) => Promise<string>,
): Promise<string> {
  const exported = env.OPENROUTER_API_KEY?.trim();
  if (exported) return exported;

  const home = env.HOME?.trim();
  if (!home) {
    throw new Error('OPENROUTER_API_KEY is missing and HOME is unavailable');
  }
  const path = `${home.replace(/\/$/, '')}/${OPENROUTER_ENV_RELATIVE_PATH}`;
  let source: string;
  try {
    source = await readTextFile(path);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`OPENROUTER_API_KEY is missing and ${path} could not be read: ${detail}`);
  }
  const key = parseOpenRouterApiKey(source);
  if (!key) throw new Error(`OPENROUTER_API_KEY is missing from ${path}`);
  return key;
}

/**
 * Builds the COMPLETE child environment from the canonical `claude-openrouter`
 * profile. The resolved credential is overlaid on the reader so the profile's
 * own late binding maps it to `ANTHROPIC_AUTH_TOKEN`; every rival provider key
 * and inherited route variable is cleared, and `CLAUDE_CONFIG_DIR` is isolated
 * so a cached native Claude login cannot override the gateway. The parent
 * environment map is never mutated.
 */
export async function openRouterClaudeEnvironment(
  env: Environment = Deno.env.toObject(),
  readTextFile: (path: string) => Promise<string> = Deno.readTextFile,
  worktree: string = Deno.cwd(),
): Promise<Record<string, string>> {
  const key = await resolveOpenRouterApiKey(env, readTextFile);
  const profile = getProviderProfile('claude-openrouter');
  const parent = Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
  const reader: EnvironmentReader = {
    get: (name) => name === profile.credentialSourceKey ? key : parent[name],
    toObject: () => ({ ...parent }),
  };
  const policy = childEnvironmentPolicyForProfile(profile, {
    agent: profile.agent,
    provider: profile.provider,
    profileId: profile.id,
    model: 'unused-by-environment-policy',
    effort: 'high',
    worktree,
    mobileRequired: false,
  });
  const childEnv = applyChildEnvironmentPolicy(policy, reader);
  if (!childEnv) {
    throw new Error('the OpenRouter credential could not be bound to the child environment');
  }
  return childEnv;
}

if (import.meta.main) {
  try {
    const options = parseOpenRouterRunArguments(Deno.args);
    const exitCode = await runClaudePrint(claudePrintOptionsFor(options), {
      env: await openRouterClaudeEnvironment(),
      clearEnv: true,
      ...(options.output ? { teePath: options.output } : {}),
    });
    Deno.exit(exitCode);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(2);
  }
}
