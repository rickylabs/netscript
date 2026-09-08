import { join, toFileUrl } from '@std/path';
import { GUARDED_PLUGIN_PROBE_SOURCE } from './guarded-plugin-probe-source.ts';

const [projectRoot, repoRoot] = Deno.args;
if (!projectRoot || !repoRoot) {
  throw new Error('Generated project and source repository are required.');
}
const localMarker = join(projectRoot, 'packages/cli/deno.json');
try {
  await Deno.stat(localMarker);
} catch (error) {
  if (error instanceof Deno.errors.NotFound) Deno.exit(78);
  throw error;
}
async function run(args: string[], cwd = repoRoot): Promise<void> {
  const result = await new Deno.Command(Deno.execPath(), {
    args,
    cwd,
    stdout: 'inherit',
    stderr: 'inherit',
  }).output();
  if (!result.success) throw new Error('Generated guarded plugin command failed: ' + result.code);
}
await run([
  'run',
  '-A',
  join(repoRoot, 'packages/cli/bin/netscript.ts'),
  'plugin',
  'new',
  'guarded-fixture',
  '--project-root',
  projectRoot,
  '--force',
]);
await run([
  'run',
  '-A',
  join(repoRoot, 'packages/cli/bin/netscript-dev.ts'),
  'generate',
  'plugins',
  '--project-root',
  projectRoot,
]);
const probe = join(projectRoot, 'guarded-plugin-auth-probe.ts');
await Deno.writeTextFile(
  probe,
  GUARDED_PLUGIN_PROBE_SOURCE.replaceAll(
    '__AUTH_SOURCE__',
    toFileUrl(join(repoRoot, 'plugins/auth/services/src')).href,
  ),
);
await run([
  'run',
  '--allow-read',
  '--allow-run',
  join(repoRoot, '.llm/tools/run-deno-check.ts'),
  '--cwd',
  projectRoot,
  '--root',
  join(projectRoot, 'packages/plugin-guarded-fixture-core'),
  '--root',
  join(projectRoot, 'plugins/guarded-fixture'),
  '--root',
  probe,
  '--ext',
  'ts',
]);
await run(
  ['run', '-A', '--unstable-kv', '--config', join(projectRoot, 'deno.json'), probe],
  projectRoot,
);
