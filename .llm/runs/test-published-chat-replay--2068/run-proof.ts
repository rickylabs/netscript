/** Run the copied probe outside every workspace, with a new cache and native gate wrappers. */
import { dirname, fromFileUrl, isAbsolute, join, relative, resolve } from '@std/path';

const RUN = dirname(fromFileUrl(import.meta.url));
const REPO = resolve(RUN, '../../..');
const EXPECTED_DEPS = ['jsr:@netscript/fresh@0.0.8', 'jsr:@std/assert@1.0.19'];
const SOURCES = [
  'published-chat-probe.ts',
  'http-stream-fixture.ts',
  'consumer.deno.jsonc',
  'consumer.lock.json',
];

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function inside(parent: string, child: string): boolean {
  const path = relative(parent, child);
  return path === '' || (!isAbsolute(path) && !/^\.\.(?:[\\/]|$)/.test(path));
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.lstat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

async function hash(path: string): Promise<string> {
  return await sha256(await Deno.readFile(path));
}

async function sha256(source: Uint8Array<ArrayBuffer>): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', source);
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function publishedSourceHash(path: string, specifier: string): Promise<string> {
  const source = await Deno.readTextFile(path);
  // Deno appends variable HTTP cache metadata; hash only the published body.
  const footer = /\n\/\/ denoCacheMetadata=(\{[^\n]*\})\n?$/.exec(source);
  check(footer !== null, 'Native published-source cache metadata missing');
  const metadata: unknown = JSON.parse(footer[1]);
  check(record(metadata) && metadata.url === specifier, 'Cached source URL does not match graph');
  return await sha256(new TextEncoder().encode(source.slice(0, footer.index)));
}

async function readObject(path: string): Promise<Record<string, unknown>> {
  const value: unknown = JSON.parse(await Deno.readTextFile(path));
  check(record(value), 'Expected a JSON object');
  return value;
}

function assertStandaloneLock(lock: Record<string, unknown>): void {
  check(record(lock.workspace), 'Native standalone dependency metadata is required');
  check(
    JSON.stringify(Object.keys(lock.workspace)) === '["dependencies"]',
    'Workspace members are forbidden',
  );
  check(Array.isArray(lock.workspace.dependencies), 'Standalone dependencies missing');
  check(
    JSON.stringify([...lock.workspace.dependencies].sort()) === JSON.stringify(EXPECTED_DEPS),
    'Standalone dependency metadata must match the two declared consumer imports',
  );
  const forbidden = new Set(['members', 'links', 'overrides', 'packageJson', 'patch', 'patches']);
  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      for (const entry of value) visit(entry);
      return;
    }
    if (!record(value)) return;
    for (const [key, entry] of Object.entries(value)) {
      check(!forbidden.has(key), `Unexpected lock override/link metadata: ${key}`);
      visit(entry);
    }
  }
  visit(lock);
  check(record(lock.jsr), 'JSR integrity section missing');
  const fresh = lock.jsr['@netscript/fresh@0.0.8'];
  check(
    record(fresh) && typeof fresh.integrity === 'string',
    'Exact published Fresh integrity missing',
  );
}

async function main(): Promise<void> {
  const index = Deno.args.indexOf('--output-root');
  check(
    index >= 0 && Deno.args[index + 1],
    'Usage: run-proof.ts --output-root <new external directory>',
  );
  const requested = resolve(Deno.args[index + 1]);
  const output = await exists(requested)
    ? await Deno.realPath(requested)
    : join(await Deno.realPath(dirname(requested)), requested.split(/[\\/]/).at(-1)!);
  check(!inside(await Deno.realPath(REPO), output), 'Consumer must be outside the repository');
  for (let ancestor = output;; ancestor = dirname(ancestor)) {
    for (const config of ['deno.json', 'deno.jsonc', 'package.json']) {
      check(
        !await exists(join(ancestor, config)),
        'Consumer ancestry contains a package/workspace config',
      );
    }
    if (dirname(ancestor) === ancestor) break;
  }
  if (await exists(output)) {
    for await (const _entry of Deno.readDir(output)) throw new Error('Output root must be empty');
  }
  const consumer = join(output, 'consumer');
  const cache = join(output, 'deno-dir');
  check(!await exists(cache), 'Proof cache must not exist at the start');
  const rootLockBefore = await hash(join(REPO, 'deno.lock'));
  await Deno.mkdir(consumer, { recursive: true });
  await Deno.copyFile(join(RUN, 'consumer.deno.jsonc'), join(consumer, 'deno.json'));
  await Deno.copyFile(join(RUN, 'published-chat-probe.ts'), join(consumer, 'consumer_test.ts'));
  await Deno.copyFile(
    join(RUN, 'http-stream-fixture.ts'),
    join(consumer, 'http-stream-fixture.ts'),
  );
  const sourceHashes: Record<string, string> = {};
  await Deno.copyFile(join(RUN, 'consumer.lock.json'), join(consumer, 'deno.lock'));
  for (const source of SOURCES) sourceHashes[source] = await hash(join(RUN, source));
  const copiedProbeHash = await hash(join(consumer, 'consumer_test.ts'));
  check(copiedProbeHash === sourceHashes['published-chat-probe.ts'], 'Copy changed the probe');
  const commands: Record<string, { exitCode: number; durationMs: number }> = {};
  async function command(label: string, args: string[], expected = 0): Promise<string> {
    const start = performance.now();
    const result = await new Deno.Command(Deno.execPath(), {
      args,
      cwd: consumer,
      env: { DENO_DIR: cache },
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stdout = new TextDecoder().decode(result.stdout);
    await Deno.writeTextFile(join(output, `${label}.stdout`), stdout);
    await Deno.writeFile(join(output, `${label}.stderr`), result.stderr);
    commands[label] = { exitCode: result.code, durationMs: Math.round(performance.now() - start) };
    check(result.code === expected, `${label} failed; inspect private command logs`);
    return stdout;
  }
  const config = join(consumer, 'deno.json');
  const lockPath = join(consumer, 'deno.lock');
  const lockBefore = await hash(lockPath);
  const lock = await readObject(lockPath);
  assertStandaloneLock(lock);
  await command('install', [
    'install',
    '--config',
    config,
    '--frozen',
    '--entrypoint',
    'consumer_test.ts',
  ]);
  check(await hash(lockPath) === lockBefore, 'Cold frozen install changed the consumer lock');
  await command('production-install', [
    'run',
    '--config',
    config,
    '--allow-read',
    '--allow-write',
    '--allow-net',
    '--allow-run',
    '--allow-env',
    join(REPO, '.llm/tools/deps/prod-install.ts'),
  ]);
  check(await hash(lockPath) === lockBefore, 'Frozen production install changed the consumer lock');
  const graph = JSON.parse(
    await command('graph', ['info', '--json', '--config', config, 'consumer_test.ts']),
  );
  check(record(graph) && Array.isArray(graph.modules), 'Module graph missing');
  const published: Array<{ specifier: string; sha256: string }> = [];
  const localFiles: string[] = [];
  for (const module of graph.modules) {
    check(record(module) && typeof module.specifier === 'string', 'Malformed module graph node');
    const specifier = module.specifier;
    if (specifier.startsWith('file:')) {
      const path = fromFileUrl(specifier);
      check(
        inside(consumer, path),
        'A local module outside the standalone consumer entered the graph',
      );
      localFiles.push(relative(consumer, path));
    }
    if (!specifier.includes('/@netscript/')) continue;
    check(
      specifier.startsWith('https://jsr.io/@netscript/'),
      'NetScript module is not from published JSR',
    );
    const segments = new URL(specifier).pathname.split('/');
    const name = segments[2];
    const version = segments[3];
    check(
      record(lock.jsr) && record(lock.jsr[`@netscript/${name}@${version}`]),
      'Module version is not locked',
    );
    if (name === 'fresh') check(version === '0.0.8', 'Unexpected published Fresh version');
    check(typeof module.local === 'string', 'Published source cache file is missing');
    published.push({ specifier, sha256: await publishedSourceHash(module.local, specifier) });
  }
  check(
    published.some((entry) =>
      entry.specifier.endsWith('/src/runtime/ai/create-chat-connection.ts')
    ),
    'Public writer/reader source missing',
  );
  const wrapper = (name: string) => join(REPO, `.llm/tools/run-deno-${name}.ts`);
  // The wrapper needs its repository tooling imports; every spawned gate receives
  // the isolated consumer config explicitly and inherits the consumer cwd/cache.
  const run = [
    'run',
    '--config',
    join(REPO, 'deno.json'),
    '--frozen',
    '--allow-read',
    '--allow-write',
    '--allow-run',
  ];
  await command('check', [
    ...run,
    wrapper('check'),
    '--root',
    '.',
    '--ext',
    'ts',
    '--deno-arg',
    `--config=${config}`,
  ]);
  await command('lint', [
    ...run,
    wrapper('lint'),
    '--root',
    '.',
    '--ext',
    'ts',
    '--config',
    config,
  ]);
  await command('fmt', [...run, wrapper('fmt'), '--root', '.', '--ext', 'ts', '--config', config]);
  const testArgs = [
    ...run,
    wrapper('test'),
    '--',
    '--config',
    config,
    '--allow-all',
    '--frozen',
    'consumer_test.ts',
  ];
  const positive = JSON.parse(
    await command('positive', [...testArgs, '--', '--isolated-published-probe']),
  );
  check(
    record(positive) && !positive.processFailure && positive.exitCode === 0 &&
      record(positive.summary) &&
      positive.summary.passed === 2 && positive.summary.failed === 0 &&
      positive.summary.ignored === 0 &&
      positive.summary.totalResults === 2,
    'Positive test report is not green',
  );
  const negative = JSON.parse(
    await command('negative', [
      ...testArgs,
      '--filter',
      'published native parts survive',
      '--',
      '--isolated-published-probe',
      '--drop-native',
    ], 1),
  );
  check(
    record(negative) && !negative.processFailure && negative.exitCode === 1 &&
      record(negative.summary) &&
      negative.summary.failed === 1 && negative.summary.passed === 0 &&
      negative.summary.ignored === 0 &&
      negative.summary.totalResults === 1,
    'Control must fail exactly one semantic test',
  );
  check(
    Array.isArray(negative.failures) && negative.failures.length > 0,
    'Control assertion details missing',
  );
  for (const failure of negative.failures) {
    check(
      record(failure) && typeof failure.message === 'string' &&
        failure.message.includes('AssertionError'),
      'Control failure is not a semantic assertion',
    );
    check(
      !/deadline|timeout|AbortError|ConnectionRefused|compile|type checking/i.test(failure.message),
      'Invalid negative control failure',
    );
  }
  check(
    await hash(join(consumer, 'consumer_test.ts')) === copiedProbeHash,
    'Probe changed between positive/control',
  );
  check(await hash(lockPath) === lockBefore, 'Consumer lock changed during validation');
  check(await hash(join(REPO, 'deno.lock')) === rootLockBefore, 'Repository lock changed');
  const report = {
    verdict: 'PASS',
    exactPublishedPackage: '@netscript/fresh@0.0.8/ai',
    cacheInitiallyAbsent: true,
    standalone: true,
    noLocalFrameworkAliases: true,
    sourceHashes,
    launcherSha256: await hash(fromFileUrl(import.meta.url)),
    published,
    localFiles,
    commands,
    positive: positive.summary,
    negative: negative.summary,
    control:
      'Drops native records only on the HTTP relay; semantic assertions fail, no production revert claimed',
    consumerLockBefore: lockBefore,
    consumerLockAfter: await hash(lockPath),
    repositoryLockBefore: rootLockBefore,
    repositoryLockAfter: await hash(join(REPO, 'deno.lock')),
    fixture:
      'Controlled HTTP storage/framing; every application record arrives from default published writer POSTs',
    remaining:
      'EIS-Chat adoption and one-SSE-per-pane check in its actual app remain outside this repo',
  };
  await Deno.writeTextFile(join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n');
  await Deno.writeTextFile(
    join(output, 'private-location.json'),
    JSON.stringify({ cwd: consumer, cache, repository: REPO }) + '\n',
  );
  console.log(
    JSON.stringify({
      verdict: report.verdict,
      positive: report.positive,
      negative: report.negative,
    }),
  );
}

if (import.meta.main) await main();
