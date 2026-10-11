import { matchedNoFiles } from '../run-deno-check.ts';

/** Reject an excluded or empty generated-file check. */
export function assertCheckMatched(output: string): void {
  if (matchedNoFiles(output)) {
    throw new Error('Generated type-check matched no files: No matching files found');
  }
}

/** Preserve type errors for negative assertions, but never accept an empty check. */
export async function checkGeneratedFiles(options: {
  readonly args: readonly string[];
  readonly cwd?: string;
}): Promise<Deno.CommandOutput> {
  if (
    options.args[0] !== 'check' &&
    !(options.args[0] === 'task' && options.args[1] === 'check')
  ) {
    throw new Error('Generated type-check requires deno check or deno task check');
  }
  const result = await new Deno.Command(Deno.execPath(), {
    args: [...options.args],
    cwd: options.cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  assertCheckMatched(decoder.decode(result.stdout) + decoder.decode(result.stderr));
  return result;
}
