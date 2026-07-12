/** Runs one bounded Claude print-mode agent turn from a content file. */

import { type Effort, EFFORTS } from '../runtime/contract.ts';

interface Options {
  readonly model: string;
  readonly effort: Effort;
  readonly prompt: string;
  readonly resume?: string;
}

function value(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

/** Builds the non-interactive Claude argv shared by launch and same-session resume. */
export function claudePrintArguments(options: Options, prompt: string): string[] {
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
    ...(options.resume ? ['--resume', options.resume] : []),
    prompt,
  ];
}

function parse(args: readonly string[]): Options {
  const model = value(args, '--model');
  const effort = value(args, '--effort');
  const prompt = value(args, '--prompt');
  const resume = value(args, '--resume');
  if (!model?.trim() || !effort || !EFFORTS.includes(effort as Effort) || !prompt?.trim()) {
    throw new Error(
      'Usage: claude-print --model <id> --effort <level> --prompt <file> [--resume <session>]',
    );
  }
  return { model, effort: effort as Effort, prompt, ...(resume ? { resume } : {}) };
}

if (import.meta.main) {
  try {
    const options = parse(Deno.args);
    const prompt = await Deno.readTextFile(options.prompt);
    if (!prompt.trim()) throw new Error('Claude content file is empty');
    const status = await new Deno.Command('claude', {
      args: claudePrintArguments(options, prompt),
      stdin: 'null',
      stdout: 'inherit',
      stderr: 'inherit',
    }).spawn().status;
    Deno.exit(status.code);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(2);
  }
}
