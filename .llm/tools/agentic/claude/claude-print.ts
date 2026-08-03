/** Runs one bounded Claude print-mode agent turn from a content file. */

import { type Effort, EFFORTS } from '../runtime/contract.ts';
import {
  EVALUATOR_MODEL_GUARD_EXIT_CODE,
  startEvaluatorModelGuard,
} from './evaluator-model-guard.ts';

interface Options {
  readonly model: string;
  readonly effort: Effort;
  readonly prompt: string;
  readonly resume?: string;
  readonly enforceOpenEvaluatorModels: boolean;
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

if (import.meta.main) {
  try {
    const options = parse(Deno.args);
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
    let exitCode: number;
    try {
      process = new Deno.Command('claude', {
        args: claudePrintArguments(options, prompt, requestingSession),
        stdin: 'null',
        stdout: 'inherit',
        stderr: 'inherit',
        ...(guard ? { env: { ANTHROPIC_BASE_URL: guard.baseUrl } } : {}),
      }).spawn();
      const status = await process.status;
      exitCode = guard?.violation() ? EVALUATOR_MODEL_GUARD_EXIT_CODE : status.code;
    } finally {
      if (forcedKill !== undefined) clearTimeout(forcedKill);
      await guard?.close();
    }
    Deno.exit(exitCode);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(2);
  }
}
