import { assertEquals } from '@std/assert';
import { join } from '@std/path';

import { GATE, KV_BACKGROUND_RUNTIME_RESOURCES } from '../../../../src/domain/cli-surface.ts';
import { DATABASE, type DatabaseEngine } from '../../../../src/domain/extension-axes.ts';
import type { RunContext } from '../../../../src/domain/run-context.ts';
import { createRuntimeGates } from '../../../../src/application/gates/scaffold/runtime-gates.ts';

// #1720 / S8 regression: a successful typed `<database>-cli migrate` leaves the AppHost
// resident — that is the slice's whole point — but the workers/sagas/triggers background
// runtimes started *before* the migration keep running against the pre-migration state, so
// the health-check job they enqueued is never processed and `behavior.workers-executions`
// burns its whole 30-attempt budget on "health-check execution has not completed yet".
// The post-database gate must therefore refresh *only* those background resources and keep
// the full AppHost restart strictly as a fallback.
//
// These tests execute the gate's real `deno eval` script with a fake `aspire` on PATH, so
// the assertions cover the aspire invocations the script actually makes, not its source text.

const FAKE_ASPIRE = [
  '#!/bin/sh',
  'printf \'%s\\n\' "$*" >> "$FAKE_ASPIRE_LOG"',
  'if [ "$1" = "start" ]; then',
  '  printf \'%s\\n\' \'{"dashboardUrl":"http://localhost:0"}\'',
  'fi',
  'if [ -n "$FAKE_ASPIRE_FAIL_SUBSTR" ] && printf \'%s\' "$*" | grep -qF -- "$FAKE_ASPIRE_FAIL_SUBSTR"; then',
  '  echo "simulated failure: $FAKE_ASPIRE_FAIL_SUBSTR" >&2',
  '  exit 9',
  'fi',
  'exit 0',
  '',
].join('\n');

interface RestartRun {
  readonly appHost: string;
  readonly invocations: readonly (readonly string[])[];
}

Deno.test('typed migrate success restarts only the KV background runtimes and preserves the AppHost', async () => {
  // The gate runs in both runtime tiers, so the sqlite tier must refresh the same runtimes.
  for (const database of [DATABASE.POSTGRES, DATABASE.SQLITE]) {
    const { appHost, invocations } = await runRestartGate({ database });

    assertEquals(invocations, [
      [
        'resource',
        `${database}-cli`,
        'migrate',
        '--timeout',
        '60',
        '--apphost',
        appHost,
        '--non-interactive',
        '--nologo',
      ],
      ...KV_BACKGROUND_RUNTIME_RESOURCES.map((resource) => [
        'resource',
        resource,
        'restart',
        '--apphost',
        appHost,
        '--non-interactive',
        '--nologo',
      ]),
    ]);
  }
});

Deno.test('typed migrate failure still falls back to the full AppHost restart', async () => {
  const { appHost, invocations } = await runRestartGate({ failSubstring: 'migrate' });

  assertEquals(invocations, [
    [
      'resource',
      'postgres-cli',
      'migrate',
      '--timeout',
      '60',
      '--apphost',
      appHost,
      '--non-interactive',
      '--nologo',
    ],
    ['stop', '--apphost', appHost, '--non-interactive', '--nologo'],
    [
      'start',
      '--apphost',
      appHost,
      '--isolated',
      '--non-interactive',
      '--nologo',
      '--format',
      'Json',
    ],
  ]);
});

Deno.test('a failed targeted restart falls back to the full AppHost restart without retrying the rest', async () => {
  const { appHost, invocations } = await runRestartGate({ failSubstring: 'workers restart' });

  assertEquals(invocations, [
    [
      'resource',
      'postgres-cli',
      'migrate',
      '--timeout',
      '60',
      '--apphost',
      appHost,
      '--non-interactive',
      '--nologo',
    ],
    ['resource', 'workers', 'restart', '--apphost', appHost, '--non-interactive', '--nologo'],
    ['stop', '--apphost', appHost, '--non-interactive', '--nologo'],
    [
      'start',
      '--apphost',
      appHost,
      '--isolated',
      '--non-interactive',
      '--nologo',
      '--format',
      'Json',
    ],
  ]);
});

async function runRestartGate(
  options: { readonly failSubstring?: string; readonly database?: DatabaseEngine },
): Promise<RestartRun> {
  // The fake must be executable to intercept `aspire` by name; TMPDIR can point at a
  // noexec mount, where execvp silently skips the fake and runs a real `aspire`.
  const root = await Deno.makeTempDir({ dir: '/tmp', prefix: 'netscript-typed-db-restart-' });
  try {
    const binDir = join(root, 'bin');
    await Deno.mkdir(binDir);
    const fakeAspire = join(binDir, 'aspire');
    await Deno.writeTextFile(fakeAspire, FAKE_ASPIRE);
    await Deno.chmod(fakeAspire, 0o755);
    const logPath = join(root, 'aspire-invocations.log');
    const appHost = join(root, 'aspire', 'apphost.mts');
    // The restart fallback runs ASPIRE_START_SCRIPT, which reads aspire.config.json beside the
    // AppHost to force ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS=false. Without this fixture the
    // fallback dies on a missing file and both fallback cases fail for the wrong reason.
    await Deno.mkdir(join(root, 'aspire'), { recursive: true });
    await Deno.writeTextFile(
      join(root, 'aspire', 'aspire.config.json'),
      `${JSON.stringify({ profiles: { https: { environmentVariables: {} } } }, null, 2)}\n`,
    );

    const gate = createRuntimeGates(options.database ?? DATABASE.POSTGRES).find((entry) =>
      entry.id === GATE.RUNTIME_ASPIRE_RESTART_AFTER_DB
    );
    if (gate?.kind !== 'command') throw new Error('Expected the typed database command gate.');
    const [executable, ...args] = gate.command(restartContext(root, appHost));

    const env: Record<string, string> = { ...Deno.env.toObject() };
    env.PATH = `${binDir}:${env.PATH ?? ''}`;
    env.FAKE_ASPIRE_LOG = logPath;
    if (options.failSubstring === undefined) delete env.FAKE_ASPIRE_FAIL_SUBSTR;
    else env.FAKE_ASPIRE_FAIL_SUBSTR = options.failSubstring;

    const output = await new Deno.Command(executable, {
      args,
      cwd: root,
      env,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stderr = new TextDecoder().decode(output.stderr);
    assertEquals(output.success, true, `gate script exited non-zero: ${stderr}`);

    const log = await Deno.readTextFile(logPath);
    return { appHost, invocations: log.trimEnd().split('\n').map((line) => line.split(' ')) };
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

function restartContext(projectRoot: string, appHost: string): RunContext {
  return {
    request: { options: { projectName: 'generated' } },
    project: { repoRoot: '/repo', projectRoot, appHost },
  } as RunContext;
}
