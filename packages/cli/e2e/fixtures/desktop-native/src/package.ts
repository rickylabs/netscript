import { dirname, fromFileUrl, join } from '@std/path';

const fixtureRoot = dirname(dirname(fromFileUrl(import.meta.url)));
const rendererEntry = join(fixtureRoot, 'src', 'renderer.ts');
const rendererBundle = join(fixtureRoot, 'dist', 'renderer.js');
const desktopEntry = join(fixtureRoot, 'src', 'main.ts');

/** Place package-task flags before the desktop entrypoint so Deno parses them as CLI options. */
export function desktopCommandArgs(forwarded: readonly string[]): readonly string[] {
  return [
    'desktop',
    '--allow-all',
    '--include',
    rendererBundle,
    ...forwarded,
    desktopEntry,
  ];
}

async function run(command: readonly string[]): Promise<void> {
  const child = new Deno.Command(Deno.execPath(), {
    args: [...command],
    cwd: fixtureRoot,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn();
  const result = await child.status;
  if (!result.success) throw new Error(`Desktop fixture command exited ${result.code}.`);
}

if (import.meta.main) {
  await Deno.mkdir(dirname(rendererBundle), { recursive: true });
  try {
    await run([
      'bundle',
      '--platform',
      'browser',
      '--output',
      rendererBundle,
      rendererEntry,
    ]);
    await run(desktopCommandArgs(Deno.args));
  } finally {
    await Deno.remove(rendererBundle).catch(() => undefined);
  }
}
