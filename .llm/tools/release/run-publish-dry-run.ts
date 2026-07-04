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

import { publishWorkspace } from './publish-workspace.ts';

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    console.log(
      [
        'run-publish-dry-run.ts — run the workspace publish in dry-run mode',
        '',
        'Usage:',
        '  deno run -A .llm/tools/release/run-publish-dry-run.ts',
        '',
        'Takes no flags (other than --help). Runs publishWorkspace in dry-run mode.',
      ].join('\n'),
    );
    Deno.exit(0);
  }
  await publishWorkspace({ mode: 'dry-run' });
}
