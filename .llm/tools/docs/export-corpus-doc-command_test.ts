import { assertEquals, assertThrows } from '@std/assert';
import { exportCorpusDocCommand } from './export-corpus-doc-command.ts';
import { parseExportCorpusOptions } from './export-corpus-git-read.ts';

const options = {
  lockfile: '/synthetic/repository/deno.lock',
  cacheDir: '/synthetic/cache',
  importHosts: ['jsr.io', 'registry.npmjs.org'],
  compilerFlags: '--max-old-space-size=1152',
};
Deno.test('locked documentation composes supported exact child flags and never copies caller auth environment', () => {
  let environmentReads = 0;
  const neverRead = () => {
    environmentReads++;
    return { SYNTHETIC_AUTH_TOKEN: 'never-copy-fixture' };
  };
  const plan = exportCorpusDocCommand(
    '/synthetic/repository',
    ['first.ts', 'second.ts'],
    options,
    neverRead,
  );
  assertEquals(plan.args, [
    'doc',
    '--json',
    '--lock',
    options.lockfile,
    '--frozen-lockfile',
    '--allow-import=jsr.io,registry.npmjs.org',
    '--node-modules-dir=none',
    'first.ts',
    'second.ts',
  ]);
  assertEquals(plan.env, {
    DENO_DIR: '/synthetic/cache',
    HOME: '/synthetic/cache/home',
    USERPROFILE: '/synthetic/cache/home',
    NO_COLOR: '1',
    DENO_V8_FLAGS: '--max-old-space-size=1152',
  });
  assertEquals(
    Object.keys(plan.env).some((key) => /token|auth|proxy|session|force_color/i.test(key)),
    false,
  );
  assertEquals(plan.args.includes('--cached-only'), false);
  assertEquals(environmentReads, 0);
});
Deno.test('strict documentation refuses incomplete locks, private hosts, cache overrides and arbitrary compiler flags', () => {
  const ordinary = () => ({});
  for (
    const invalid of [
      { ...options, lockfile: '/elsewhere/deno.lock' },
      { ...options, cacheDir: '/synthetic/repository' },
      { ...options, cacheDir: 'relative-cache' },
      { ...options, importHosts: ['localhost'] },
      { ...options, importHosts: ['service.internal'] },
      { ...options, importHosts: ['127.0.0.1'] },
      { ...options, importHosts: ['https://jsr.io'] },
      { ...options, importHosts: ['jsr.io', 'jsr.io'] },
      { ...options, compilerFlags: '--allow-natives-syntax' },
      { cacheDir: '/synthetic/cache' },
      { lockfile: options.lockfile },
    ]
  ) {
    assertThrows(() =>
      exportCorpusDocCommand('/synthetic/repository', ['first.ts'], invalid, ordinary)
    );
  }
});
Deno.test('ordinary documentation command and colour-normalized environment remain unchanged', () => {
  const env = { NO_COLOR: '1', EXAMPLE: 'unchanged' };
  assertEquals(exportCorpusDocCommand('/synthetic/repository', ['first.ts'], {}, () => env), {
    args: ['doc', '--json', 'first.ts'],
    env,
  });
});
Deno.test('documented strict CLI flags map to typed policy without accepting unsupported native cached-only', () => {
  assertEquals(
    parseExportCorpusOptions([
      '--doc-lockfile',
      options.lockfile,
      '--doc-cache-dir',
      options.cacheDir,
      '--doc-import-hosts',
      'jsr.io,registry.npmjs.org',
    ]),
    {
      check: false,
      allowDirty: false,
      gitReadWrapper: undefined,
      docLockfile: options.lockfile,
      docCacheDir: options.cacheDir,
      docImportHosts: options.importHosts,
    },
  );
  assertThrows(() => parseExportCorpusOptions(['--cached-only']));
  assertThrows(() => parseExportCorpusOptions(['--doc-lockfile']));
});
