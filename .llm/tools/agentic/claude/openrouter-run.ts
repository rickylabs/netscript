/**
 * Runs one bounded Claude print turn over the OpenRouter Anthropic-skin gateway.
 *
 * This is the first-class entry point for the `claude-openrouter` transport: it
 * removes the three manual steps the raw wrapper required (sourcing the
 * credential file, mapping `OPENROUTER_API_KEY` into the child as
 * `ANTHROPIC_AUTH_TOKEN`, and opting into the evaluator model guard). The guard
 * is not optional here — this route is open-models-only, so a closed model id
 * fails with the existing guard error and exit code.
 */

import { type Effort, EFFORTS } from '../runtime/contract.ts';
import { OPENROUTER_ENV_RELATIVE_PATH } from '../config/versions.ts';
import { parseOpenRouterApiKey } from '../opencode/opencode-run.ts';
import { runClaudePrint } from './claude-print.ts';

export interface OpenRouterRunOptions {
  readonly model: string;
  readonly effort: Effort;
  readonly prompt: string;
  readonly resume?: string;
  readonly output?: string;
}

type Environment = Readonly<Record<string, string | undefined>>;

function value(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

/** Parses the launcher argv; every flag is explicit so misuse fails loudly. */
export function parseOpenRouterRunArguments(args: readonly string[]): OpenRouterRunOptions {
  const model = value(args, '--model');
  const effort = value(args, '--effort');
  const prompt = value(args, '--prompt');
  const resume = value(args, '--resume');
  const output = value(args, '--output');
  if (!model?.trim() || !effort || !EFFORTS.includes(effort as Effort) || !prompt?.trim()) {
    throw new Error(
      'Usage: claude-openrouter --model <openrouter-id> --effort <level> --prompt <file> ' +
        '[--resume <session>] [--output <file>]',
    );
  }
  return {
    model,
    effort: effort as Effort,
    prompt,
    ...(resume ? { resume } : {}),
    ...(output ? { output } : {}),
  };
}

/**
 * Resolves the child credential environment without ever logging the key. An
 * already-exported `OPENROUTER_API_KEY` wins; otherwise only that assignment is
 * read from the canonical credential file. `ANTHROPIC_API_KEY` is explicitly
 * emptied so a cached native Claude login cannot silently override the gateway.
 */
export async function openRouterClaudeEnvironment(
  env: Environment = Deno.env.toObject(),
  readTextFile: (path: string) => Promise<string> = Deno.readTextFile,
): Promise<Record<string, string>> {
  const exported = env.OPENROUTER_API_KEY?.trim();
  if (exported) return { ANTHROPIC_AUTH_TOKEN: exported, ANTHROPIC_API_KEY: '' };

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
  return { ANTHROPIC_AUTH_TOKEN: key, ANTHROPIC_API_KEY: '' };
}

if (import.meta.main) {
  try {
    const options = parseOpenRouterRunArguments(Deno.args);
    const exitCode = await runClaudePrint(
      {
        model: options.model,
        effort: options.effort,
        prompt: options.prompt,
        ...(options.resume ? { resume: options.resume } : {}),
        enforceOpenEvaluatorModels: true,
      },
      {
        env: await openRouterClaudeEnvironment(),
        ...(options.output ? { teePath: options.output } : {}),
      },
    );
    Deno.exit(exitCode);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(2);
  }
}
