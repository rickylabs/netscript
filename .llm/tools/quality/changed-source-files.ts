#!/usr/bin/env -S deno run --allow-run
/** Source paths whose changes belong to the pull-request quality scan. */
export async function collectChangedSourceFiles(
  repoRoot: string,
  base: string,
  head: string,
): Promise<string[]> {
  const output = await new Deno.Command('git', {
    cwd: repoRoot,
    args: [
      'diff',
      '--name-only',
      '--diff-filter=ACMR',
      `${base}...${head}`,
      '--',
      'packages',
      'plugins',
      '.llm/tools',
    ],
  }).output();
  if (!output.success) {
    throw new Error(new TextDecoder().decode(output.stderr).trim());
  }
  return new TextDecoder().decode(output.stdout).split(/\r?\n/).filter(Boolean).sort();
}

if (import.meta.main) {
  const [base, head] = Deno.args;
  if (!base || !head) {
    console.error('usage: changed-source-files.ts <base> <head>');
    Deno.exit(2);
  }
  const files = await collectChangedSourceFiles(Deno.cwd(), base, head);
  if (files.length === 0) {
    console.error('not scanned: no changed source files matched packages, plugins, or .llm/tools');
    Deno.exit(2);
  }
  console.log(files.join('\n'));
}
