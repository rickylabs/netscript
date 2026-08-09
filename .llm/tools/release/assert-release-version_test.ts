import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import {
  inspectReleaseVersionCoherence,
  runReleaseVersionAssertion,
} from './assert-release-version.ts';

async function withVersionWorkspace(
  versions: Readonly<Record<string, string>>,
  run: (root: string) => Promise<void>,
): Promise<void> {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(root, 'packages'), { recursive: true });
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({ version: versions.root, workspace: ['packages/*'] }),
    );
    for (const [name, version] of Object.entries(versions)) {
      if (name === 'root') continue;
      const member = join(root, 'packages', name);
      await Deno.mkdir(member, { recursive: true });
      await Deno.writeTextFile(join(member, 'deno.json'), JSON.stringify({ version }));
    }
    await run(root);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('release version coherence reports every coordinated manifest mismatch', async () => {
  await withVersionWorkspace(
    { root: '0.0.4', api: '0.0.4', web: '0.0.3' },
    async (root) => {
      assertEquals(await inspectReleaseVersionCoherence(root, '0.0.5'), {
        expected: '0.0.5',
        manifests: 3,
        mismatches: [
          { file: 'deno.json', actual: '0.0.4' },
          { file: 'packages/api/deno.json', actual: '0.0.4' },
          { file: 'packages/web/deno.json', actual: '0.0.3' },
        ],
      });
      assertEquals(await runReleaseVersionAssertion({ root, version: '0.0.5' }), 1);
    },
  );
});

Deno.test('release version coherence passes only when the coordinated set matches', async () => {
  await withVersionWorkspace(
    { root: '0.0.5', api: '0.0.5', web: '0.0.5' },
    async (root) => {
      assertEquals(await runReleaseVersionAssertion({ root, version: '0.0.5' }), 0);
    },
  );
});
