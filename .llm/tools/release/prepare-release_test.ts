import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { prepareRelease, type PrepareReleaseDependencies } from './prepare-release.ts';

Deno.test('shared release preparation runs the stable gate sequence in order', async () => {
  const calls: string[] = [];
  const dependencies: PrepareReleaseDependencies = {
    bump: (_root, version) => {
      calls.push(`bump:${version}`);
      return Promise.resolve({
        oldVersion: '0.0.1-beta.10',
        newVersion: version,
        files: ['/repo/deno.json'],
      });
    },
    findResidue: (_root, version) => {
      calls.push(`residue:${version}`);
      return Promise.resolve([]);
    },
    runCommand: (command, args) => {
      calls.push(`${command} ${args.join(' ')}`);
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };

  const result = await prepareRelease('/repo', '0.0.1-canary.1', 'release:canary', dependencies);
  assertEquals(result.newVersion, '0.0.1-canary.1');
  assertEquals(calls, [
    'bump:0.0.1-canary.1',
    'residue:0.0.1-beta.10',
    'deno task publish:readiness',
    'deno task publish:dry-run',
    'deno ci --prod',
  ]);
});

Deno.test('shared release preparation fails before gates when residue remains', async () => {
  let gateRan = false;
  await assertRejects(
    () =>
      prepareRelease('/repo', '0.0.1-canary.1', 'release:canary', {
        bump: (_root, version) =>
          Promise.resolve({
            oldVersion: '0.0.1-beta.10',
            newVersion: version,
            files: ['/repo/deno.json'],
          }),
        findResidue: () => Promise.resolve(['packages/example/deno.json']),
        runCommand: () => {
          gateRan = true;
          return Promise.resolve({ code: 0, stdout: '', stderr: '' });
        },
      }),
    Error,
    'Version residue remains',
  );
  assertEquals(gateRan, false);
});
