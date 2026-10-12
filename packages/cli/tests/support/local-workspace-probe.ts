import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import cliMeta from '../../deno.json' with { type: 'json' };
// The isolation test maps the ordinary module URL to this fixture adapter. A query
// keeps this delegation on the unchanged runner, which executes every real command.
import { runLockedProbe as runPublicProbe } from '../../e2e/src/application/gates/scaffold/run-locked-probe.ts?public';
import { useLocalWorkspaceImports } from './local-workspace-imports.ts';

/** Run the real probe command and localize its freshly generated test fixture. */
export async function runLockedProbe(
  args: readonly string[],
  cwd: string,
  repoRoot: string,
): Promise<void> {
  await runPublicProbe(args, cwd, repoRoot);
  const init = args.indexOf('init');
  if (init < 0) return;
  const path = args.indexOf('--path');
  assertEquals(path >= 0, true, 'The guarded probe must declare its fixture parent');
  const projectRoot = join(args[path + 1], args[init + 1]);
  const config = JSON.parse(await Deno.readTextFile(join(projectRoot, 'deno.json')));
  assertEquals(config.imports['@netscript/config'], `jsr:@netscript/config@${cliMeta.version}`);
  await useLocalWorkspaceImports(projectRoot, repoRoot);
}
