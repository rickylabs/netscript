import { assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@^1';
import { compare, parse } from 'jsr:@std/semver@^1';
import {
  canarySuffix,
  type CanaryVersionDependencies,
  createCanaryRefs,
  deriveCanaryVersion,
  parseArgs,
  readRegistryVersions,
  validateStableTarget,
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

// #888 changed one assertion here deliberately: a prerelease target is now the *point*, because a
// canary has to encode the release it proves. What this test actually guards — the task separator
// is consumed, flags parse, and JSR-invalid targets are still refused — is unchanged.
Deno.test('canary parser accepts a stable or prerelease target and the task separator', () => {
  assertEquals(parseArgs(['--', '0.0.2', '--dry-run', '--root', '/repo']), {
    targetVersion: '0.0.2',
    dryRun: true,
    root: '/repo',
  });
  assertEquals(parseArgs(['--', '0.0.2-beta.1']).targetVersion, '0.0.2-beta.1');
  assertThrows(() => parseArgs(['0.0.2+build.1']), Error, 'build metadata');
  assertThrows(() => parseArgs(['0.0.2-beta.1.canary.1']), Error, 'already a canary');
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

// --------------------------------------------------------------------------
// #888 — a canary must encode the release it proves, and must stay ordered.
// --------------------------------------------------------------------------

Deno.test('validateStableTarget accepts a prerelease target (#888)', () => {
  validateStableTarget('0.0.1');
  validateStableTarget('0.0.1-beta.12');
  validateStableTarget('1.2.3-rc.1');
});

Deno.test('validateStableTarget still rejects what JSR cannot take', () => {
  assertThrows(() => validateStableTarget('0.0.1+build.5'), Error, 'build metadata');
  assertThrows(() => validateStableTarget('not-a-version'), Error, 'semantic version');
  assertThrows(() => validateStableTarget('0.0.1-'), Error, 'malformed prerelease');
  // Deriving from a canary would produce `...canary.1.canary.1`.
  assertThrows(() => validateStableTarget('0.0.1-beta.12.canary.1'), Error, 'already a canary');
});

Deno.test('a stable target keeps the historical hyphen shape', () => {
  assertEquals(canarySuffix('0.0.1', 1), '0.0.1-canary.1');
});

// The reason the separator differs at all. Semver compares prerelease identifiers pairwise and a
// numeric identifier always loses to a non-numeric one, so the hyphenated form parses as
// [beta, "12-canary", 1] and outranks every later beta forever.
Deno.test('a prerelease target joins with a dot so ordering survives', () => {
  const canary = canarySuffix('0.0.1-beta.12', 1);
  assertEquals(canary, '0.0.1-beta.12.canary.1');

  const above = (a: string, b: string) => compare(parse(a), parse(b)) > 0;
  // Immediately above the release it proves...
  assertEquals(above(canary, '0.0.1-beta.12'), true);
  // ...and below everything after it, which the hyphenated form gets wrong.
  assertEquals(above(canary, '0.0.1-beta.13'), false);
  assertEquals(above(canary, '0.0.1-beta.20'), false);
  assertEquals(above(canary, '0.0.1'), false);

  assertEquals(above('0.0.1-beta.12-canary.1', '0.0.1-beta.13'), true); // the shape NOT used
});

Deno.test('the next ordinal is derived per target, not shared across releases', async () => {
  const deps = dependencies(
    new Map<string, readonly string[]>([
      ['@netscript/a', ['0.0.1-beta.12.canary.1', '0.0.1-beta.12.canary.2']],
      ['@netscript/b', ['0.0.1-beta.13.canary.1']],
    ]),
  );
  assertEquals(await deriveCanaryVersion('/repo', '0.0.1-beta.12', deps), '0.0.1-beta.12.canary.3');
  assertEquals(await deriveCanaryVersion('/repo', '0.0.1-beta.14', deps), '0.0.1-beta.14.canary.1');
});
