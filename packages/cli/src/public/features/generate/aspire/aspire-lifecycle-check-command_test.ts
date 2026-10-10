import { assertEquals } from '@std/assert';
import { dirname, fromFileUrl, join, resolve, toFileUrl } from '@std/path';

const REPO_ROOT = resolve(dirname(fromFileUrl(import.meta.url)), '../../../../../../..');
const CLI = Deno.env.get('NETSCRIPT_ASPIRE_CHECK_CLI') ??
  join(REPO_ROOT, 'packages/cli/bin/netscript.ts');

async function invoke(...args: string[]) {
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['run', '--no-lock', '-A', CLI, ...args],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
  return new TextDecoder().decode(result.stdout);
}

async function withInitializedProject(run: (root: string) => Promise<void>) {
  const parent = await Deno.makeTempDir();
  const root = join(parent, 'surface-demo');
  try {
    await invoke(
      'init',
      'surface-demo',
      '--path',
      parent,
      '--ci',
      '--db',
      'none',
      '--no-git',
      '--editor',
      'none',
      '--yes',
    );
    // Resolve the authored config against the checkout without depending on a published release.
    // No Aspire output is regenerated or altered by this test setup.
    const path = join(root, 'deno.json');
    const config = JSON.parse(await Deno.readTextFile(path));
    config.imports['@netscript/config'] = toFileUrl(join(REPO_ROOT, 'packages/config/mod.ts')).href;
    await Deno.writeTextFile(path, JSON.stringify(config));
    await run(root);
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
}

async function assertCurrent(root: string) {
  const report = JSON.parse(
    await invoke(
      'generate',
      'aspire',
      '--project-root',
      root,
      '--check',
      '--format',
      'json',
    ),
  );
  assertEquals(report.status, 'current');
  assertEquals(report.outputs.length, 14);
  assertEquals(report.drift, []);
}

Deno.test('public init leaves the Aspire surface current without regeneration', async () => {
  await withInitializedProject(assertCurrent);
});

Deno.test('public db add and remove leave the Aspire surface current', async () => {
  await withInitializedProject(async (root) => {
    // Isolate database mutation from any init drift in the negative control.
    await invoke('generate', 'aspire', '--project-root', root);
    await invoke('db', 'add', 'sqlite', '--project-root', root);
    await assertCurrent(root);
    await invoke('db', 'remove', 'sqlite', '--project-root', root);
    await assertCurrent(root);
  });
});

Deno.test('public service remove leaves the Aspire surface current', async () => {
  await withInitializedProject(async (root) => {
    await invoke('service', 'add', '--name', 'temporary', '--project-root', root);
    await assertCurrent(root);
    await invoke('service', 'remove', 'temporary', '--project-root', root);
    await assertCurrent(root);
  });
});
