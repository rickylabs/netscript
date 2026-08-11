/**
 * @module
 *
 * Pins the process-level evidence reader, including one end-to-end read of a real
 * `/proc/<pid>/environ` — this repository's own test process.
 *
 * The parse and the identity rule are cheap to get subtly wrong (a `PATH=` value
 * containing `=`, a trailing NUL, an empty entry), and the gate that uses them runs
 * only inside the expensive runtime suite.
 */

import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import {
  identifiesResource,
  parseProcessEnvironment,
  requireResourceProcesses,
  scanResourceProcesses,
} from './process-evidence.ts';

function environ(...entries: string[]): Uint8Array {
  return new TextEncoder().encode(`${entries.join('\0')}\0`);
}

Deno.test('process evidence: parses the NUL-separated environ blob', () => {
  const parsed = parseProcessEnvironment(environ('A=1', 'MODE=http', 'EMPTY='));

  assertEquals(parsed.get('A'), '1');
  assertEquals(parsed.get('MODE'), 'http');
  assertEquals(parsed.get('EMPTY'), '');
  assertEquals(parsed.size, 3);
});

Deno.test('process evidence: keeps a value that itself contains =', () => {
  const parsed = parseProcessEnvironment(environ('DATABASE_URL=postgres://u:p@h:5432/d?a=b'));

  assertEquals(parsed.get('DATABASE_URL'), 'postgres://u:p@h:5432/d?a=b');
});

Deno.test('process evidence: ignores malformed and empty entries', () => {
  const parsed = parseProcessEnvironment(environ('', 'NOEQUALS', '=leading', 'OK=1'));

  assertEquals([...parsed.keys()], ['OK']);
});

Deno.test('process evidence: identifies a process by the injected resource name', () => {
  const environment = parseProcessEnvironment(environ('OTEL_SERVICE_NAME=users'));

  assert(identifiesResource(environment, 'users'));
  assert(!identifiesResource(environment, 'reports'));
  assert(!identifiesResource(new Map(), 'users'));
});

Deno.test('process evidence: refuses an empty scan instead of reporting success', () => {
  const error = assertThrows(
    () =>
      requireResourceProcesses(
        { processes: [], diagnostics: { examined: 412, workdirMatches: 2, identified: 0 } },
        'users',
        '/tmp/project/services/users',
      ),
    Error,
    'no running process could be identified as users',
  );

  // The counts have to survive into the message: "2 ran in that directory but none
  // was the resource" and "nothing ran there at all" are different bugs.
  assertEquals(error.message.includes('examined 412 processes'), true);
  assertEquals(error.message.includes('2 ran in /tmp/project/services/users'), true);
  assertEquals(error.message.includes('#1447 symptom'), true);
});

Deno.test('process evidence: returns what the scan identified', () => {
  const processes = [{ pid: 7, environment: new Map([['A', '1']]) }];

  assertEquals(
    requireResourceProcesses(
      { processes, diagnostics: { examined: 1, workdirMatches: 1, identified: 1 } },
      'users',
      '/tmp/x',
    ),
    processes,
  );
});

Deno.test('process evidence: reads a real process environment through /proc', async () => {
  const workdir = await Deno.makeTempDir({ prefix: 'ns-1447-proc-' });
  const identity = `ns-1447-resource-${Deno.pid}`;

  if (Deno.build.os !== 'linux') {
    // The gate itself refuses a platform without /proc; there is no weaker path.
    await assertRejects(() => scanResourceProcesses(workdir, identity), Error, '/proc');
    await Deno.remove(workdir, { recursive: true });
    return;
  }

  // A real child process, started the way the AppHost starts a service: a chosen
  // working directory plus an injected identity. `Deno.env.set` would not do —
  // /proc/<pid>/environ is what the kernel recorded at exec time, which is exactly
  // why it is the evidence this gate trusts.
  const child = new Deno.Command(Deno.execPath(), {
    args: ['eval', '--no-lock', 'await new Promise((resolve) => setTimeout(resolve, 30_000));'],
    cwd: workdir,
    env: { OTEL_SERVICE_NAME: identity, NETSCRIPT_E2E_SERVICE_MODE: 'http' },
    stdout: 'null',
    stderr: 'null',
  }).spawn();

  try {
    const found = await scanUntilFound(workdir, identity);
    const subject = found.processes.find((process) => process.pid === child.pid);
    assert(
      subject,
      `the scan did not find the child process (${JSON.stringify(found.diagnostics)})`,
    );
    // The declared value is read back out of the kernel's record, not out of a map
    // this test built.
    assertEquals(subject.environment.get('NETSCRIPT_E2E_SERVICE_MODE'), 'http');
    assertEquals(subject.environment.get('OTEL_SERVICE_NAME'), identity);

    const missing = await scanResourceProcesses(workdir, 'a-resource-nothing-is-called');
    assertEquals(missing.processes.length, 0);
    assert(
      missing.diagnostics.workdirMatches >= 1,
      'a process in the workdir that is not the resource must be counted, not identified',
    );
  } finally {
    child.kill();
    await child.status;
    await Deno.remove(workdir, { recursive: true });
  }
});

/** Gives the child a moment to exec before deciding the scan found nothing. */
async function scanUntilFound(workdir: string, identity: string) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const result = await scanResourceProcesses(workdir, identity);
    if (result.processes.length > 0) return result;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return await scanResourceProcesses(workdir, identity);
}
