/** Runs one bounded Claude print-mode agent turn from a content file. */

import { type Effort, EFFORTS } from '../runtime/contract.ts';
import {
  EVALUATOR_MODEL_GUARD_EXIT_CODE,
  startEvaluatorModelGuard,
} from './evaluator-model-guard.ts';

export interface Options {
  readonly model: string;
  readonly effort: Effort;
  readonly prompt: string;
  readonly resume?: string;
  readonly enforceOpenEvaluatorModels: boolean;
}

/** Child-process shaping applied by wrappers that own credentials or output capture. */
export interface ClaudePrintRunOptions {
  /** Extra child environment (for example a late-bound gateway credential). */
  readonly env?: Readonly<Record<string, string>>;
  /** When set, stdout is written to both this process's stdout and the file. */
  readonly teePath?: string;
}

function value(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

/** Builds the non-interactive Claude argv shared by launch and same-session resume. */
export function claudePrintArguments(
  options: Options,
  prompt: string,
  requestingSession: string,
): string[] {
  return [
    '-p',
    '--model',
    options.model,
    '--effort',
    options.effort,
    '--permission-mode',
    'bypassPermissions',
    '--output-format',
    'stream-json',
    '--verbose',
    ...(options.resume
      ? ['--resume', options.resume]
      : options.enforceOpenEvaluatorModels
      ? ['--session-id', requestingSession]
      : []),
    prompt,
  ];
}

function parse(args: readonly string[]): Options {
  const model = value(args, '--model');
  const effort = value(args, '--effort');
  const prompt = value(args, '--prompt');
  const resume = value(args, '--resume');
  const enforceOpenEvaluatorModels = args.includes('--enforce-open-evaluator-models');
  if (!model?.trim() || !effort || !EFFORTS.includes(effort as Effort) || !prompt?.trim()) {
    throw new Error(
      'Usage: claude-print --model <id> --effort <level> --prompt <file> [--resume <session>]',
    );
  }
  return {
    model,
    effort: effort as Effort,
    prompt,
    ...(resume ? { resume } : {}),
    enforceOpenEvaluatorModels,
  };
}

/** Streams child stdout to this process and, when requested, to a tee file. */
async function teeStdout(
  stdout: ReadableStream<Uint8Array>,
  teePath: string,
): Promise<void> {
  const file = await Deno.open(teePath, { write: true, create: true, truncate: true });
  try {
    for await (const chunk of stdout) {
      await Deno.stdout.write(chunk);
      await file.write(chunk);
    }
  } finally {
    file.close();
  }
}

/**
 * Runs one bounded Claude print turn and resolves with the child exit code.
 * Wrappers supply credentials through `run.env`; the evaluator guard's base URL
 * always wins over caller-supplied environment so the policy cannot be bypassed.
 */
export async function runClaudePrint(
  options: Options,
  run: ClaudePrintRunOptions = {},
): Promise<number> {
  const prompt = await Deno.readTextFile(options.prompt);
  if (!prompt.trim()) throw new Error('Claude content file is empty');
  const requestingSession = options.resume ?? crypto.randomUUID();
  let process: Deno.ChildProcess | null = null;
  let forcedKill: ReturnType<typeof setTimeout> | undefined;
  const guard = options.enforceOpenEvaluatorModels
    ? startEvaluatorModelGuard(requestingSession, (violation) => {
      console.error(
        `evaluator model request denied: model=${violation.model} requesting_session=${violation.requestingSession}`,
      );
      try {
        process?.kill('SIGTERM');
        forcedKill ??= setTimeout(() => {
          try {
            process?.kill('SIGKILL');
          } catch {
            // The process honored SIGTERM before escalation was required.
          }
        }, 1_000);
      } catch {
        // The process may already have reacted to the 403 and exited.
      }
    })
    : null;
  try {
    const env = { ...run.env, ...(guard ? { ANTHROPIC_BASE_URL: guard.baseUrl } : {}) };
    process = new Deno.Command('claude', {
      args: claudePrintArguments(options, prompt, requestingSession),
      stdin: 'null',
      stdout: run.teePath ? 'piped' : 'inherit',
      stderr: 'inherit',
      ...(Object.keys(env).length > 0 ? { env } : {}),
    }).spawn();
    if (run.teePath) await teeStdout(process.stdout, run.teePath);
    const status = await process.status;
    return guard?.violation() ? EVALUATOR_MODEL_GUARD_EXIT_CODE : status.code;
  } finally {
    if (forcedKill !== undefined) clearTimeout(forcedKill);
    await guard?.close();
  }
}

if (import.meta.main) {
  try {
    Deno.exit(await runClaudePrint(parse(Deno.args)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(2);
  }
}
