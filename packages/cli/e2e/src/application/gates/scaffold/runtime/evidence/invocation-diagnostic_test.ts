import { saveOwnedInvocationDiagnostics } from './owned-invocation-diagnostic.ts';
import { assert, assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import {
  invocationDiagnostic,
  ownedDiagnosticFile,
  selectedInvocationLog,
  withInvocationEvidence,
} from './invocation-diagnostic.ts';
import { stopAndProbe } from './cleanup.ts';

const times = { startedAt: '2026-01-01T00:00:00.000Z', completedAt: '2026-01-01T00:00:02.000Z' };
const safeDetail = JSON.stringify({
  resourceKind: 'container',
  resourceName: 'redis',
  errorCode: 'in_use',
  Config: { Env: ['SECRET_ENV_SENTINEL'] },
  message: 'SECRET_MESSAGE_SENTINEL',
});

Deno.test('both output streams retain only safe details; exact linked logs are bounded and private', async () => {
  const root = await Deno.makeTempDir();
  try {
    const home = join(root, 'home'), logs = join(home, '.aspire', 'cli', 'logs');
    await Deno.mkdir(logs, { recursive: true });
    await Deno.mkdir(join(root, '.netscript'));
    const uid = (await Deno.stat(root)).uid;
    if (uid === null) throw new Error('fixture requires filesystem UID');
    const log = join(logs, 'cli_20260101T000001_deadbeef.log');
    const app = join(logs, 'cli_20260101T000000000_detach-child_deadbeef.log');
    await Deno.writeTextFile(app, safeDetail);
    await Deno.writeTextFile(log, safeDetail + '\n' + app + '\nSECRET_LOG_SENTINEL');
    const invocation = {
      ...times,
      code: 16,
      stdout: safeDetail + '\n' + log,
      stderr: 'summary SECRET_STDERR_SENTINEL',
    };
    const result = await invocationDiagnostic({
      invocation,
      logRoot: logs,
      uid,
      ordinal: 1,
      operation: 'stop',
      targetMatches: true,
    });
    assertEquals(result.nativeExit, 16);
    assertEquals(result.stdout.records.length, 1);
    assertEquals(result.stderr.records.length, 0);
    assertEquals(result.log.status, 'available');
    assert(result.linkedLog && 'status' in result.linkedLog);
    assertEquals(result.linkedLog.status, 'available');
    await saveOwnedInvocationDiagnostics({
      projectRoot: root,
      appHost: join(root, 'apphost.cs'),
      kind: 'cleanup',
      home,
      uid,
      transcripts: [invocation],
      survivorCounts: { ownedContainers: 0, foreignContainers: 1, unprovenContainers: 2 },
    });
    const output = await Deno.readTextFile(join(root, '.netscript/e2e-cleanup-diagnostic.json'));
    assert(!output.includes('SECRET_'));
    assert(!output.includes(log));
    assert(!output.includes(home));
    assert(!output.includes('Config'));
    assert(output.includes('in_use'));
    assert(output.includes('not_collected'));
    await Deno.writeTextFile(log, 'x'.repeat(300000) + '\n' + safeDetail);
    const bounded = await selectedInvocationLog(log, logs, invocation, uid);
    assertEquals(bounded.status, 'available');
    if (bounded.status === 'available') {
      assertEquals(bounded.readBytes, 256 << 10);
      assert(bounded.truncated);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('missing, foreign, escaped, symlink and ambiguous log evidence fail closed', async () => {
  const root = await Deno.makeTempDir();
  try {
    const uid = (await Deno.stat(root)).uid;
    if (uid === null) throw new Error('fixture requires filesystem UID');
    const path = join(root, 'cli_20260101T000001_deadbeef.log'),
      invocation = { ...times, code: 1, stdout: '', stderr: '' };
    assertEquals((await selectedInvocationLog(path, root, invocation, uid)).status, 'missing');
    assertEquals(
      (await selectedInvocationLog(
        join(root, '../cli_20260101T000001_deadbeef.log'),
        root,
        invocation,
        uid,
      )).status,
      'refused',
    );
    await Deno.writeTextFile(path, safeDetail);
    assertEquals((await selectedInvocationLog(path, root, invocation, uid + 1)).status, 'refused');
    const identity = {
      file: true,
      symlink: false,
      uid,
      expectedUid: uid,
      path,
      actualPath: path,
      root,
      actualRoot: root,
    };
    assert(ownedDiagnosticFile(identity));
    assert(!ownedDiagnosticFile({ ...identity, symlink: true }));
    assert(!ownedDiagnosticFile({ ...identity, actualPath: join(root, 'different') }));
    assert(!ownedDiagnosticFile({ ...identity, actualRoot: join(root, 'different') }));
    const missing = await invocationDiagnostic({
      invocation,
      logRoot: root,
      uid,
      ordinal: 1,
      operation: 'restart',
      targetMatches: true,
    });
    assertEquals(missing.log.status, 'missing_reference');
    const ambiguous = await invocationDiagnostic({
      invocation: {
        ...invocation,
        stdout: path + '\n' + join(root, 'cli_20260101T000002_cafebabe.log'),
      },
      logRoot: root,
      uid,
      ordinal: 1,
      operation: 'restart',
      targetMatches: true,
    });
    assertEquals(ambiguous.log.status, 'ambiguous_reference');
    const refused = await invocationDiagnostic({
      invocation: { ...invocation, stdout: path },
      logRoot: root,
      uid,
      ordinal: 1,
      operation: 'restart',
      targetMatches: false,
    });
    assertEquals(refused.log.status, 'refused');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('collector rejection cannot mask original failure or turn successful work into failure', async () => {
  const original = new Error('original invocation failure');
  let collected = 0;
  const error = await assertRejects(() =>
    withInvocationEvidence(() => Promise.reject(original), () => {
      collected++;
      return Promise.reject(new Error('SECRET_COLLECTOR'));
    })
  );
  assertEquals(error, original);
  assertEquals(collected, 1);
  assertEquals(
    await withInvocationEvidence(
      () => Promise.resolve(17),
      () => Promise.reject(new Error('SECRET_COLLECTOR')),
    ),
    17,
  );
});

Deno.test('actual stop-and-probe retains nonzero outcome and exact command count with diagnostic failure', async () => {
  const root = await Deno.makeTempDir();
  let retained = 0;
  const calls: string[][] = [];
  try {
    await assertRejects(
      () =>
        stopAndProbe(
          join(root, 'apphost.cs'),
          root,
          false,
          join(root, '.netscript/cleanup-private.json'),
          {
            run: (command, args) => {
              calls.push([command, ...args]);
              return Promise.resolve(
                command === 'aspire'
                  ? { ...times, code: 16, stdout: safeDetail, stderr: 'original stop failure' }
                  : { code: 0, stdout: '', stderr: '' },
              );
            },
            diagnostic: (transcripts, evaluation) => {
              retained++;
              assertEquals(transcripts.length, 1);
              assertEquals(transcripts[0].code, 16);
              assertEquals(evaluation?.ownedContainers.length, 0);
              return Promise.reject(new Error('SECRET_COLLECTOR'));
            },
          },
        ),
      Error,
      'Aspire stop did not complete: original stop failure',
    );
    assertEquals(calls.filter((call) => call[0] === 'aspire').length, 1);
    assertEquals(retained, 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
