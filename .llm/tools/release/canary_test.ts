import { assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@^1';
import {
  type CanaryVersionDependencies,
  createCanaryRefs,
  deriveCanaryVersion,
  parseArgs,
  readRegistryVersions,
} from './canary.ts';

Deno.test('canary version takes the maximum registry N across all members including yanked versions', async () => {
  const versions = new Map<string, readonly string[]>([
    ['@netscript/a', ['0.0.1-canary.1', '0.0.1-canary.7']],
    ['@netscript/b', ['0.0.1-canary.3', '0.0.1-canary.9']],
  ]);
  const result = await deriveCanaryVersion('/repo', '0.0.1', dependencies(versions));
  assertEquals(result, '0.0.1-canary.10');
});

Deno.test('canary version uses tags as a secondary collision guard and tolerates new packages', async () => {
  const deps = dependencies(new Map([['@netscript/a', ['0.0.2-canary.2']]]));
  deps.readRegistryVersions = (name) =>
    Promise.resolve(name === '@netscript/new' ? null : ['0.0.2-canary.2']);
  deps.listTags = () => Promise.resolve(['v0.0.2-canary.4']);
  const result = await deriveCanaryVersion('/repo', '0.0.2', deps);
  assertEquals(result, '0.0.2-canary.5');
});

Deno.test('canary parser accepts only a stable target and task separator', () => {
  assertEquals(parseArgs(['--', '0.0.2', '--dry-run', '--root', '/repo']), {
    targetVersion: '0.0.2',
    dryRun: true,
    root: '/repo',
  });
  assertThrows(() => parseArgs(['0.0.2-beta.1']), Error, 'stable semantic version');
  assertThrows(() => parseArgs(['0.0.2+build.1']), Error, 'stable semantic version');
});

Deno.test('canary ref creation pushes only an ephemeral branch and provenance tag', async () => {
  const commands: string[] = [];
  await createCanaryRefs('/repo', '0.0.2-canary.5', ['/repo/deno.json'], (command, args) => {
    commands.push(`${command} ${args.join(' ')}`);
    return Promise.resolve({ code: 0, stdout: '', stderr: '' });
  });
  assertEquals(commands, [
    'git checkout -b release/canary-0.0.2-canary.5',
    'git add /repo/deno.json',
    'git commit -m chore(release): cut 0.0.2-canary.5',
    'git tag -a v0.0.2-canary.5 -m NetScript canary 0.0.2-canary.5',
    'git push origin HEAD:refs/heads/release/canary-0.0.2-canary.5',
    'git push origin refs/tags/v0.0.2-canary.5',
  ]);
  assertEquals(commands.some((command) => /pull|pr/i.test(command)), false);
});

Deno.test('canary version fails closed when registry discovery fails', async () => {
  const deps = dependencies(new Map());
  deps.readRegistryVersions = () => Promise.reject(new Error('HTTP 503'));
  await assertRejects(() => deriveCanaryVersion('/repo', '0.0.2', deps), Error, 'HTTP 503');
});

Deno.test('JSR registry discovery treats only 404 as a new package', async () => {
  const missing = await readRegistryVersions(
    '@netscript/new',
    () => Promise.resolve(new Response(null, { status: 404 })),
  );
  assertEquals(missing, null);

  await assertRejects(
    () =>
      readRegistryVersions(
        '@netscript/a',
        () => Promise.resolve(new Response('unavailable', { status: 503 })),
      ),
    Error,
    'HTTP 503',
  );
});

Deno.test('JSR registry discovery retains yanked version keys and rejects malformed metadata', async () => {
  const versions = await readRegistryVersions(
    '@netscript/a',
    () =>
      Promise.resolve(
        Response.json({
          versions: {
            '0.0.2-canary.1': {},
            '0.0.2-canary.2': { yanked: true },
          },
        }),
      ),
  );
  assertEquals(versions, ['0.0.2-canary.1', '0.0.2-canary.2']);

  await assertRejects(
    () =>
      readRegistryVersions(
        '@netscript/a',
        () => Promise.resolve(Response.json({ latest: '0.0.2' })),
      ),
    Error,
    'missing a versions object',
  );
});

function dependencies(
  versions: Map<string, readonly string[]>,
): CanaryVersionDependencies & {
  readRegistryVersions: CanaryVersionDependencies['readRegistryVersions'];
  listTags: CanaryVersionDependencies['listTags'];
} {
  return {
    discoverMembers: () =>
      Promise.resolve([
        { path: 'packages/a', name: '@netscript/a' },
        { path: 'packages/new', name: '@netscript/new' },
        { path: 'plugins/b', name: '@netscript/b' },
      ]),
    readRegistryVersions: (name) => Promise.resolve(versions.get(name) ?? null),
    listTags: () => Promise.resolve([]),
  };
}
