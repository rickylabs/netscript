/**
 * run-publish-dry-run.ts — run the workspace publish in dry-run mode.
 *
 * Thin wrapper over `publishWorkspace({ mode: 'dry-run' })`; invoked by the
 * `publish:dry-run` task and the release/publish flow. Perms: matches the
 * publish-workspace surface (--allow-read --allow-run --allow-env, plus network
 * as the underlying `deno publish --dry-run` requires).
 *
 * Usage:
 *   deno run -A .llm/tools/release/run-publish-dry-run.ts
 */

import { publishMemberDryRun, publishWorkspace } from './publish-workspace.ts';

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    console.log(
      [
        'run-publish-dry-run.ts — run the workspace publish in dry-run mode',
        '',
        'Usage:',
        '  deno run -A .llm/tools/release/run-publish-dry-run.ts [--root <path> --member <path>]',
        '',
        'Without flags, runs the workspace dry-run. With --member, runs that package dry-run.',
      ].join('\n'),
    );
    Deno.exit(0);
  }
  const root = readFlag(Deno.args, '--root') ?? Deno.cwd();
  const member = readFlag(Deno.args, '--member');
  if (member) {
    await publishMemberDryRun(root, member);
  } else {
    await publishWorkspace({ mode: 'dry-run', root });
  }
}

function readFlag(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index < 0) {
    return undefined;
  }
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}
