import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { dirname, fromFileUrl, join, resolve } from '@std/path';
import { verifyListenerReadiness } from '../../../src/application/gates/scaffold/runtime/verify-listener-readiness.ts';

const CAPTURE = fromFileUrl(
  new URL(
    '../../../src/application/gates/scaffold/runtime/evidence/describe-follow.ts',
    import.meta.url,
  ),
);
const EXPECTED = ['postgres', 'garnet', 'workers', 'unobserved'];
const EVENTS = [
  { displayName: 'postgres', state: 'Starting' },
  {
    displayName: 'postgres',
    state: 'Running',
    healthStatus: 'Unhealthy',
    healthReports: { postgres_listener: { status: 'Unhealthy' } },
  },
  { displayName: 'garnet', state: 'Starting' },
  { displayName: 'workers', state: 'Running', healthStatus: 'Healthy' },
];

async function failureFixture(mode: 'capture' | 'refresh', hang = false) {
  await Deno.mkdir('.llm/tmp', { recursive: true });
  const root = await Deno.makeTempDir({ dir: '.llm/tmp', prefix: 'startup-diagnostics-' });
  const absolute = resolve(root);
  try {
    await Deno.mkdir(join(root, '.llm/tmp'), { recursive: true });
    await Deno.writeTextFile(
      join(root, '.llm/tmp/e2e-image-pulls.json'),
      JSON.stringify([
        {
          image: 'example.invalid/test-pull',
          durationMs: 1250,
          attempts: [{ durationMs: 1250, exitCode: 0 }],
        },
      ]),
    );
    await Deno.mkdir(join(root, 'aspire'));
    await Deno.writeTextFile(
      join(root, 'aspire/aspire.config.json'),
      JSON.stringify({
        profiles: {
          https: { environmentVariables: { ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS: 'true' } },
        },
      }),
    );
    await Deno.mkdir(join(root, 'bin'));
    await Deno.writeTextFile(
      join(root, 'bin/aspire'),
      `#!/usr/bin/env -S deno run --allow-write\n
await Deno.writeTextFile('calls.jsonl', JSON.stringify(Deno.args) + '\\n', { append: true });
if (Deno.args[0] === 'start') { console.error('injected start failure'); Deno.exit(1); }
const events = ${JSON.stringify(EVENTS)};
if (Deno.args.includes('--follow')) {
  for (const event of events) console.log(JSON.stringify(event));
  ${hang ? 'setInterval(() => {}, 1000);' : ''}
} else { console.log(JSON.stringify({ resources: events.slice(1) }, null, 2)); }
`,
    );
    await Deno.chmod(join(root, 'bin/aspire'), 0o755);
    const args = mode === 'capture'
      ? [mode, join(absolute, 'aspire/apphost.mts'), absolute, JSON.stringify(EXPECTED)]
      : [
        mode,
        join(absolute, 'aspire/apphost.mts'),
        join(absolute, 'describe.ndjson'),
        JSON.stringify(EXPECTED),
      ];
    const started = performance.now();
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-env=ASPIRE_CLI_START_TIMEOUT',
        '--allow-read',
        '--allow-write',
        '--allow-run=aspire',
        CAPTURE,
        ...args,
      ],
      cwd: absolute,
      env: {
        PATH: `${join(absolute, 'bin')}:${dirname(Deno.execPath())}:${Deno.env.get('PATH')}`,
        ASPIRE_CLI_START_TIMEOUT: '1',
      },
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const calls = (await Deno.readTextFile(join(root, 'calls.jsonl'))).trim().split('\n').map((
      line,
    ) => JSON.parse(line) as string[]);
    return {
      code: output.code,
      stderr: new TextDecoder().decode(output.stderr),
      durationMs: performance.now() - started,
      calls,
    };
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

function assertAttribution(stderr: string) {
  assertStringIncludes(stderr, 'postgres: state=Running');
  assertStringIncludes(stderr, 'postgres.healthReports.postgres_listener=Unhealthy');
  assertStringIncludes(stderr, 'garnet: state=Starting');
  assertStringIncludes(stderr, 'unobserved: state=Unknown (not observed)');
  assertStringIncludes(stderr, 'example.invalid/test-pull=1250ms');
  assert(!stderr.includes('workers: state='), 'healthy resource must not be named as unconverged');
}

Deno.test('injected convergence exit reports every blocker, last state and measured pull time', async () => {
  const result = await failureFixture('refresh');
  assertEquals(result.code, 1);
  assertAttribution(result.stderr);
  assertEquals(result.calls.length, 1, 'must not restart or retry a convergence gate');
});

Deno.test('injected hung convergence fails within the configured window with last states', async () => {
  const result = await failureFixture('refresh', true);
  assertEquals(result.code, 1);
  assertStringIncludes(result.stderr, 'timed out after 1s');
  assertAttribution(result.stderr);
  assert(result.durationMs < 10_000, `hung follower took ${result.durationMs}ms`);
  assertEquals(result.calls.length, 1);
});

Deno.test('injected aspire-start failure takes one attribution snapshot and never retries start', async () => {
  const result = await failureFixture('capture');
  assertEquals(result.code, 1);
  assertAttribution(result.stderr);
  assertEquals(result.calls.map((args) => args[0]), ['start', 'describe']);
  assert(!result.calls[1].includes('--follow'), 'failure attribution must be one bounded snapshot');
});

Deno.test('injected listener follower failure includes the last state and health in its top-level error', async () => {
  let closed = 0;
  try {
    await verifyListenerReadiness(
      'test-apphost',
      'garnet',
      'garnet_resp',
      50,
      () =>
        Promise.resolve({
          waitFor(predicate) {
            const resource = {
              displayName: 'garnet',
              state: 'Starting',
              healthStatus: 'Unhealthy',
            };
            predicate({ resource, rawLine: JSON.stringify(resource) });
            return Promise.reject(new Error('injected follower exit'));
          },
          close() {
            closed++;
            return Promise.resolve();
          },
        }),
    );
    throw new Error('fault was accepted');
  } catch (error) {
    assert(error instanceof Error);
    assertStringIncludes(error.message, 'garnet');
    assertStringIncludes(error.message, 'last state=Starting');
    assertStringIncludes(error.message, 'healthStatus=Unhealthy');
    assertStringIncludes(error.message, 'injected follower exit');
  }
  assertEquals(closed, 1);
});
