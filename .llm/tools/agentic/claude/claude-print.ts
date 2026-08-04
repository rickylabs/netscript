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

/** The subset of a spawned child this runner uses, so tests can substitute a fake. */
export interface ClaudePrintChild {
  readonly status: Promise<Deno.CommandStatus>;
  readonly stdout?: ReadableStream<Uint8Array>;
  kill(signal?: Deno.Signal): void;
}

/** Spawn seam matching `Deno.Command(...).spawn()` for the options this runner sets. */
export type ClaudePrintSpawn = (
  executable: string,
  options: {
    readonly args: readonly string[];
    readonly env: Readonly<Record<string, string>>;
    readonly clearEnv: boolean;
    readonly stdin: 'null';
    readonly stdout: 'inherit' | 'piped';
    readonly stderr: 'inherit';
  },
) => ClaudePrintChild;

/** Child-process shaping applied by wrappers that own credentials or output capture. */
export interface ClaudePrintRunOptions {
  /**
   * Child environment. With `clearEnv`, this must be the COMPLETE environment
   * (a credential-owning caller builds it from the canonical provider policy);
   * otherwise it is merged over the inherited parent environment.
   */
  readonly env?: Readonly<Record<string, string>>;
  /** Replaces rather than merges the parent environment, isolating rival credentials. */
  readonly clearEnv?: boolean;
  /** When set, stdout is written to both this process's stdout and the file. */
  readonly teePath?: string;
  /** Spawn seam; defaults to `Deno.Command`. */
  readonly spawn?: ClaudePrintSpawn;
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

/** Streams child stdout to this process and to the already-open tee file. */
async function teeStdout(
  stdout: ReadableStream<Uint8Array>,
  file: Deno.FsFile,
): Promise<void> {
  for await (const chunk of stdout) {
    await Deno.stdout.write(chunk);
    await file.write(chunk);
  }
}

/**
 * Terminates a child that outlived a launcher failure and awaits its status, so
 * an in-flight paid request can never be abandoned behind a launcher exception.
 */
async function terminateChild(child: ClaudePrintChild): Promise<void> {
  let escalation: ReturnType<typeof setTimeout> | undefined;
  try {
    child.kill('SIGTERM');
    escalation = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch {
        // The child honored SIGTERM before escalation was required.
      }
    }, 1_000);
  } catch {
    // The child may already have exited.
  }
  try {
    await child.status;
  } catch {
    // A status that cannot be awaited still leaves nothing to reap.
  } finally {
    if (escalation !== undefined) clearTimeout(escalation);
  }
}

function defaultSpawn(
  executable: string,
  options: Parameters<ClaudePrintSpawn>[1],
): ClaudePrintChild {
  return new Deno.Command(executable, {
    args: [...options.args],
    env: options.env,
    clearEnv: options.clearEnv,
    stdin: options.stdin,
    stdout: options.stdout,
    stderr: options.stderr,
  }).spawn();
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
  // Opened BEFORE the spawn: an unwritable destination must fail the launcher
  // while no paid request can yet be in flight.
  const teeFile = run.teePath
    ? await Deno.open(run.teePath, { write: true, create: true, truncate: true })
    : null;
  try {
    let child: ClaudePrintChild | null = null;
    let forcedKill: ReturnType<typeof setTimeout> | undefined;
    const guard = options.enforceOpenEvaluatorModels
      ? startEvaluatorModelGuard(requestingSession, (violation) => {
        console.error(
          `evaluator model request denied: model=${violation.model} requesting_session=${violation.requestingSession}`,
        );
        try {
          child?.kill('SIGTERM');
          forcedKill ??= setTimeout(() => {
            try {
              child?.kill('SIGKILL');
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
      // The guard's base URL is applied last so a caller environment can never
      // route the child around the open-model policy.
      const env = { ...run.env, ...(guard ? { ANTHROPIC_BASE_URL: guard.baseUrl } : {}) };
      child = (run.spawn ?? defaultSpawn)('claude', {
        args: claudePrintArguments(options, prompt, requestingSession),
        env,
        clearEnv: run.clearEnv ?? false,
        stdin: 'null',
        stdout: teeFile ? 'piped' : 'inherit',
        stderr: 'inherit',
      });
      try {
        if (teeFile && child.stdout) await teeStdout(child.stdout, teeFile);
        const status = await child.status;
        return guard?.violation() ? EVALUATOR_MODEL_GUARD_EXIT_CODE : status.code;
      } catch (error) {
        // Any post-spawn failure (tee write, stream error) must still reap the
        // child rather than report launcher failure over a live paid turn.
        await terminateChild(child);
        throw error;
      }
    } finally {
      if (forcedKill !== undefined) clearTimeout(forcedKill);
      await guard?.close();
    }
  } finally {
    teeFile?.close();
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
