import {
  assert,
  assertEquals,
  assertRejects,
  assertStrictEquals,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';
import { z } from 'zod';

import { createSmokeProject } from '../../../src/application/builders/workspace/smoke-project-factory.ts';
import { createBrowserPageDiagnosticsCollector } from '../../../src/application/gates/scaffold/service-client-browser-diagnostics.ts';
import {
  assertExpectedAppPage,
  awaitBrowserStartup,
  BROWSER_EXECUTABLE_ENV,
  captureBoundedText,
  CdpClient,
  probeBrowserVersion,
  restoreMutationPostData,
  selectBrowserExecutable,
  selectPageDebugTarget,
  terminateBrowserProcess,
  waitForCompletedStableBaseline,
  withMutationRestore,
} from '../../../src/application/gates/scaffold/service-client-browser-probe.ts';
import { createRuntimeBehaviorGates } from '../../../src/application/gates/scaffold/runtime/behavior-gates.ts';
import { generatedAppName } from '../../../src/application/gates/scaffold/runtime/generated-app-name.ts';
import { createScaffoldGates } from '../../../src/application/gates/scaffold/scaffold-gates.ts';
import { deriveProcedureInput } from '../../../src/application/gates/scaffold/service-client-input-probe.ts';
import {
  assertByteIdentical,
  assertGeneratedServiceSchemaReady,
  assertServiceGenerationSequence,
  assertServiceKeyIsolation,
  assertSettledRefetch,
  type FileSnapshot,
  serviceClientConsumerSource,
  type ServiceKeyEvidence,
} from '../../../src/application/gates/scaffold/service-client-runtime-probe.ts';
import { GATE, SCAFFOLD } from '../../../src/domain/cli-surface.ts';
import { DATABASE, PACKAGE_SOURCE, REPORT_FORMAT } from '../../../src/domain/extension-axes.ts';
import type { CommandGateDefinition } from '../../../src/domain/gate-definition.ts';
import type { RunContext, RunOptions } from '../../../src/domain/run-context.ts';
import { resolveSuite } from '../../../src/presentation/cli/suites/registry.ts';

const USERS_INPUT = { limit: 3, page: 1, sortBy: 'id', sortOrder: 'asc' } as const;
const PAYMENTS_INPUT = { limit: 3, offset: 0 } as const;
const CDP_TEST_TIMEOUT_MS = 25;
const CDP_TEST_WATCHDOG_MS = 1_000;

interface FakeCdpSocket {
  onopen: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  readonly sent: string[];
  readonly closeCount: number;
  send(data: string): void;
  close(): void;
  emitOpen(): void;
  emitError(): void;
  emitMessage(message: Record<string, unknown>): void;
}

function createFakeCdpSocket(): FakeCdpSocket {
  let closeCount = 0;
  return {
    onopen: null,
    onerror: null,
    onmessage: null,
    sent: [],
    get closeCount() {
      return closeCount;
    },
    send(data) {
      this.sent.push(data);
    },
    close() {
      closeCount += 1;
    },
    emitOpen() {
      this.onopen?.(new Event('open'));
    },
    emitError() {
      this.onerror?.(new Event('error'));
    },
    emitMessage(message) {
      this.onmessage?.(
        new MessageEvent('message', { data: JSON.stringify(message) }),
      );
    },
  };
}

async function withTestWatchdog<T>(operation: Promise<T>, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const watchdog = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`test watchdog expired waiting for ${label}`)),
      CDP_TEST_WATCHDOG_MS,
    );
  });
  try {
    return await Promise.race([operation, watchdog]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function connectFakeCdpClient(
  socket: FakeCdpSocket,
  url: string,
): Promise<CdpClient> {
  queueMicrotask(() => socket.emitOpen());
  return await withTestWatchdog(
    CdpClient.connect(url, {
      timeoutMs: CDP_TEST_TIMEOUT_MS,
      createSocket: () => socket,
    }),
    `CDP connection to ${url}`,
  );
}

function keyEvidence(): ServiceKeyEvidence {
  return {
    usersInput: USERS_INPUT,
    paymentsInput: PAYMENTS_INPUT,
    usersServerKey: ['users', 'list', JSON.stringify(USERS_INPUT)],
    paymentsServerKey: ['payments', 'list', JSON.stringify(PAYMENTS_INPUT)],
    usersServerFilter: ['users', 'list'],
    paymentsServerFilter: ['payments', 'list'],
    usersClientKey: ['users', 'list', { input: USERS_INPUT }],
    paymentsClientKey: ['payments', 'list', { input: PAYMENTS_INPUT }],
    usersClientFilter: ['users', 'list'],
    paymentsClientFilter: ['payments', 'list'],
  };
}

Deno.test('service client probe accepts distinct typed inputs with isolated own prefixes', () => {
  assertServiceKeyIsolation(keyEvidence());

  assertThrows(
    () =>
      assertServiceKeyIsolation({
        ...keyEvidence(),
        paymentsClientKey: ['payments', 'find', { input: PAYMENTS_INPUT }],
      }),
    Error,
    'paymentsClientKey did not equal',
  );
  assertThrows(
    () =>
      assertServiceKeyIsolation({
        ...keyEvidence(),
        usersClientFilter: ['payments', 'list'],
      }),
    Error,
    'usersClientFilter did not equal',
  );
  assertThrows(
    () =>
      assertServiceKeyIsolation({
        ...keyEvidence(),
        usersServerFilter: ['payments', 'list'],
      }),
    Error,
    'usersServerFilter did not equal',
  );
});

Deno.test('procedure inputs are derived independently from divergent real schema contracts', () => {
  const usersSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).default(10),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  });
  const paymentsSchema = z.object({
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
    search: z.string().min(1).optional(),
  });

  assertThrows(() => paymentsSchema.parse(USERS_INPUT));
  const usersInput = deriveProcedureInput<z.output<typeof usersSchema>>(
    usersSchema,
    'users.list',
  );
  const paymentsInput = deriveProcedureInput<z.output<typeof paymentsSchema>>(
    paymentsSchema,
    'payments.list',
  );
  assertEquals(usersInput, { page: 1, limit: 10, sortOrder: 'desc' });
  assertEquals(paymentsInput, { limit: 1, offset: 0 });

  const source = serviceClientConsumerSource('file:///probe/service-client-runtime-probe.ts');
  assertStringIncludes(source, 'deriveProcedureInput<UsersListInput>');
  assertStringIncludes(source, 'deriveProcedureInput<PaymentsListInput>');
  assertStringIncludes(source, "usersContract.list['~orpc'].inputSchema");
  assertStringIncludes(source, "paymentsContract.list['~orpc'].inputSchema");
  assertEquals(source.includes('const input ='), false);
});

Deno.test('service client schema precondition rejects a project before database codegen', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-service-schema-missing-' });
  try {
    await assertRejects(
      () => assertGeneratedServiceSchemaReady(projectRoot),
      Error,
      'database/<engine>/schema/.generated/zod/crud.ts',
    );
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});

Deno.test('service client probe rejects any second-generation byte drift', () => {
  const before: FileSnapshot = {
    'apps/alpha/lib/payments.ts': { size: 8, sha256: 'payments' },
    'apps/alpha/lib/users.ts': { size: 5, sha256: 'users' },
    'aspire/apphost.mts': { size: 7, sha256: 'aspire' },
  };
  assertByteIdentical(before, { ...before });
  assertThrows(
    () =>
      assertByteIdentical(before, {
        ...before,
        'apps/alpha/lib/users.ts': { size: 6, sha256: 'changed' },
      }),
    Error,
    'second service generate changed owned output',
  );
});

Deno.test('service generation converges once then rejects repeated writes or byte drift', async () => {
  const converged: FileSnapshot = {
    'apps/alpha/lib/payments.ts': { size: 8, sha256: 'payments' },
    'apps/alpha/lib/users.ts': { size: 5, sha256: 'users' },
    'aspire/.helpers/services.mts': { size: 7, sha256: 'aspire' },
  };
  const result = (aspireWrites: number) => ({
    code: 0,
    stdout:
      `Wrote 0 service client modules.\nSkipped 2 current service client modules.\nWrote ${aspireWrites} Aspire helper files.\n`,
    stderr: '',
  });

  let generateCall = 0;
  let snapshotCall = 0;
  const events: string[] = [];
  const generations = [result(3), result(0)];
  const snapshots = [converged, { ...converged }];
  await assertServiceGenerationSequence({
    generate: () => {
      events.push(`generate:${generateCall + 1}`);
      return Promise.resolve(generations[generateCall++]!);
    },
    snapshot: () => {
      events.push(`snapshot:${snapshotCall + 1}`);
      return Promise.resolve(snapshots[snapshotCall++]!);
    },
  });
  assertEquals(generateCall, 2);
  assertEquals(snapshotCall, 2);
  assertEquals(events, ['generate:1', 'snapshot:1', 'generate:2', 'snapshot:2']);

  generateCall = 0;
  await assertRejects(
    () =>
      assertServiceGenerationSequence({
        generate: () => Promise.resolve([result(3), result(1)][generateCall++]!),
        snapshot: () => Promise.resolve(converged),
      }),
    Error,
    'consecutive service generate did not report Wrote 0 Aspire helper files.',
  );

  generateCall = 0;
  snapshotCall = 0;
  await assertRejects(
    () =>
      assertServiceGenerationSequence({
        generate: () => Promise.resolve([result(3), result(0)][generateCall++]!),
        snapshot: () =>
          Promise.resolve(
            [
              converged,
              {
                ...converged,
                'aspire/.helpers/services.mts': { size: 8, sha256: 'changed' },
              },
            ][snapshotCall++]!,
          ),
      }),
    Error,
    'second service generate changed owned output',
  );
});

Deno.test('settled refetch proof requires mutation, optimistic row, exactly +1, and final row', () => {
  const evidence = {
    baselineListRequestCount: 2,
    finalListRequestCount: 3,
    mutationSucceeded: true,
    optimisticRowContainedRenamedName: true,
    finalRowContainedRenamedName: true,
    renamedName: 'Ada*',
  } as const;
  assertSettledRefetch(evidence);
  assertThrows(
    () => assertSettledRefetch({ ...evidence, finalListRequestCount: 4 }),
    Error,
    'expected 3',
  );
  assertThrows(
    () => assertSettledRefetch({ ...evidence, mutationSucceeded: false }),
    Error,
    'users.update did not return a success response',
  );
  assertThrows(
    () => assertSettledRefetch({ ...evidence, optimisticRowContainedRenamedName: false }),
    Error,
    'optimistic row did not contain Ada*',
  );
  assertThrows(
    () => assertSettledRefetch({ ...evidence, finalRowContainedRenamedName: false }),
    Error,
    'persisted row did not contain Ada*',
  );
});

Deno.test('fixture restoration rewrites the generated Rename request to the captured name', () => {
  const postData = JSON.stringify({
    json: {
      id: 1,
      data: { name: 'Seed User**' },
    },
  });
  const restored = JSON.parse(
    restoreMutationPostData(postData, 'Seed User**', 'Seed User*'),
  );
  assertEquals(restored, {
    json: {
      id: 1,
      data: { name: 'Seed User*' },
    },
  });
});

Deno.test('fixture restoration runs after the settled verdict and after a post-mutation failure', async () => {
  const successCalls: string[] = [];
  const evidence = await withMutationRestore(
    () => {
      successCalls.push('settled assertion');
      return Promise.resolve('evidence');
    },
    () => true,
    () => {
      successCalls.push('restore captured original name');
      return Promise.resolve();
    },
  );
  assertEquals(evidence, 'evidence');
  assertEquals(successCalls, ['settled assertion', 'restore captured original name']);

  const failureCalls: string[] = [];
  const probeFailure = new Error('proof failed after onMutate');
  const observedFailure = await assertRejects(() =>
    withMutationRestore(
      () => {
        failureCalls.push('onMutate ran');
        return Promise.reject(probeFailure);
      },
      () => true,
      () => {
        failureCalls.push('restore captured original name');
        return Promise.resolve();
      },
    )
  );
  assertStrictEquals(observedFailure, probeFailure);
  assertEquals(failureCalls, ['onMutate ran', 'restore captured original name']);
});

Deno.test('quiet baseline rejects a late initial request before accepting the completed count', async () => {
  let now = 0;
  let observation = 0;
  const observations = [
    { requestCount: 1, completedCount: 1 },
    { requestCount: 2, completedCount: 1 },
    { requestCount: 2, completedCount: 2 },
    { requestCount: 2, completedCount: 2 },
    { requestCount: 2, completedCount: 2 },
  ] as const;

  const baseline = await waitForCompletedStableBaseline(
    () => observations[Math.min(observation++, observations.length - 1)],
    {
      confirmationMs: 100,
      pollMs: 50,
      timeoutMs: 500,
      now: () => now,
      sleep: (milliseconds) => {
        now += milliseconds;
        return Promise.resolve();
      },
    },
  );

  assertEquals(baseline, 2);
  assertEquals(observation, 5);
});

Deno.test('CDP connection timeout names the URL and closes an inert socket', async () => {
  const url = 'ws://connection-never-opens.invalid/devtools';
  const socket = createFakeCdpSocket();
  const error = await assertRejects(
    () =>
      withTestWatchdog(
        CdpClient.connect(url, {
          timeoutMs: CDP_TEST_TIMEOUT_MS,
          createSocket: () => socket,
        }),
        `inert CDP connection to ${url}`,
      ),
    Error,
  );

  assertStringIncludes(error.message, 'CDP WebSocket connection');
  assertStringIncludes(error.message, url);
  assertStringIncludes(error.message, `${CDP_TEST_TIMEOUT_MS} ms`);
  assertEquals(error.message.includes('CDP response'), false);
  assertEquals(error.message.includes('Page.enable'), false);
  assertEquals(socket.closeCount, 1);
  assertEquals(socket.onopen, null);
  assertEquals(socket.onerror, null);
});

Deno.test('CDP response timeout removes its id and ignores a late matching response', async () => {
  const url = 'ws://send-response-test.invalid/devtools';
  const socket = createFakeCdpSocket();
  const client = await connectFakeCdpClient(socket, url);
  let resolvedCount = 0;
  const response = client.send('Page.enable', {}, CDP_TEST_TIMEOUT_MS).then((value) => {
    resolvedCount += 1;
    return value;
  });
  const error = await assertRejects(
    () => withTestWatchdog(response, 'Page.enable response'),
    Error,
  );

  assertStringIncludes(error.message, 'CDP response');
  assertStringIncludes(error.message, 'Page.enable');
  assertStringIncludes(error.message, `${CDP_TEST_TIMEOUT_MS} ms`);
  assertEquals(error.message.includes('CDP WebSocket connection'), false);
  assertEquals(error.message.includes(url), false);
  assertEquals(client.pendingCommandCountForTest, 0);
  assertEquals(resolvedCount, 0);

  const timedOutCommand = JSON.parse(socket.sent[0]) as { id: number };
  socket.emitMessage({ id: timedOutCommand.id, result: 'late-result' });
  await Promise.resolve();
  assertEquals(client.pendingCommandCountForTest, 0);
  assertEquals(resolvedCount, 0);

  const nextResponse = client.send('Runtime.enable', {}, CDP_TEST_TIMEOUT_MS * 4);
  const nextCommand = JSON.parse(socket.sent[1]) as { id: number };
  socket.emitMessage({ id: nextCommand.id, result: 'next-result' });
  assertEquals(await withTestWatchdog(nextResponse, 'Runtime.enable response'), 'next-result');
  assertEquals(client.pendingCommandCountForTest, 0);
  client.close();
});

Deno.test('CDP connection and response preserve normal result and error settlement', async () => {
  const url = 'ws://normal-cdp-settlement.invalid/devtools';
  const socket = createFakeCdpSocket();
  const client = await connectFakeCdpClient(socket, url);

  const result = client.send('Runtime.enable', {}, CDP_TEST_TIMEOUT_MS * 4);
  const resultCommand = JSON.parse(socket.sent[0]) as { id: number };
  socket.emitMessage({ id: resultCommand.id, result: { enabled: true } });
  assertEquals(await withTestWatchdog(result, 'Runtime.enable result'), { enabled: true });
  assertEquals(client.pendingCommandCountForTest, 0);

  const failed = client.send('Runtime.evaluate', {}, CDP_TEST_TIMEOUT_MS * 4);
  const failedCommand = JSON.parse(socket.sent[1]) as { id: number };
  socket.emitMessage({ id: failedCommand.id, error: { message: 'existing CDP error' } });
  await assertRejects(
    () => withTestWatchdog(failed, 'Runtime.evaluate error'),
    Error,
    'existing CDP error',
  );
  assertEquals(client.pendingCommandCountForTest, 0);

  await new Promise((resolve) => setTimeout(resolve, CDP_TEST_TIMEOUT_MS * 5));
  assertEquals(client.pendingCommandCountForTest, 0);
  client.close();

  const errorSocket = createFakeCdpSocket();
  queueMicrotask(() => errorSocket.emitError());
  await assertRejects(
    () =>
      withTestWatchdog(
        CdpClient.connect(url, {
          timeoutMs: CDP_TEST_TIMEOUT_MS * 4,
          createSocket: () => errorSocket,
        }),
        'CDP socket error',
      ),
    Error,
    `failed to connect to ${url}`,
  );
  assertEquals(errorSocket.closeCount, 0);
});

Deno.test('browser executable override is exclusive and preserves validated selection metadata', async () => {
  const override = '/managed/chrome-for-testing';
  const calls: string[] = [];
  const selection = await selectBrowserExecutable(override, (path) => {
    calls.push(path);
    return Promise.resolve('Google Chrome for Testing 151.0.0.0');
  });

  assertEquals(calls, [override]);
  assertEquals(selection, {
    path: override,
    source: BROWSER_EXECUTABLE_ENV,
    version: 'Google Chrome for Testing 151.0.0.0',
  });
});

Deno.test('invalid browser overrides fail specifically without probing a fallback', async () => {
  const emptyCalls: string[] = [];
  const emptyError = await assertRejects(
    () =>
      selectBrowserExecutable('', (path) => {
        emptyCalls.push(path);
        return Promise.resolve('Chromium 151.0');
      }),
    Error,
  );
  assertStringIncludes(emptyError.message, BROWSER_EXECUTABLE_ENV);
  assertStringIncludes(emptyError.message, '<empty>');
  assertStringIncludes(emptyError.message, 'empty');
  assertEquals(emptyCalls, []);

  const cases = [
    ['/missing/browser', 'path does not exist'],
    ['/directory/browser', 'path is not a file'],
    ['/non-executable/browser', 'path is not executable'],
    ['/spawn-failing/browser', 'failed to start version probe'],
    ['/timed-out/browser', 'version probe timed out'],
    ['/non-zero/browser', 'version probe exited with code 7'],
    ['/unrecognized/browser', 'unrecognized browser version output'],
  ] as const;
  for (const [path, reason] of cases) {
    const calls: string[] = [];
    const expected = new Error(reason);
    const error = await assertRejects(
      () =>
        selectBrowserExecutable(path, (candidate) => {
          calls.push(candidate);
          return Promise.reject(expected);
        }),
      Error,
    );
    assertStringIncludes(error.message, BROWSER_EXECUTABLE_ENV);
    assertStringIncludes(error.message, JSON.stringify(path));
    assertStringIncludes(error.message, reason);
    assertEquals(calls, [path]);
    assertStrictEquals(error.cause, expected);
  }
});

Deno.test('built-in browser candidates are returned only after a runnable probe succeeds', async () => {
  const configured = Deno.env.get(BROWSER_EXECUTABLE_ENV);
  Deno.env.delete(BROWSER_EXECUTABLE_ENV);
  try {
    const calls: string[] = [];
    const selection = await selectBrowserExecutable(undefined, (path) => {
      calls.push(path);
      return calls.length === 3
        ? Promise.resolve('Chromium 151.0')
        : Promise.reject(new Error('candidate is present but not runnable'));
    });
    assertEquals(calls.length, 3);
    assertEquals(selection.path, calls[2]);
    assertEquals(selection.source, 'built-in allowlist');
    assertEquals(selection.version, 'Chromium 151.0');

    const failedCalls: string[] = [];
    const error = await assertRejects(
      () =>
        selectBrowserExecutable(undefined, (path) => {
          failedCalls.push(path);
          return Promise.reject(new Error('candidate is present but not runnable'));
        }),
      Error,
    );
    assertEquals(failedCalls.length > 3, true);
    for (const path of failedCalls) assertStringIncludes(error.message, JSON.stringify(path));
    assertStringIncludes(error.message, 'candidate is present but not runnable');
    assertStringIncludes(error.message, `Set ${BROWSER_EXECUTABLE_ENV}`);
  } finally {
    if (configured === undefined) Deno.env.delete(BROWSER_EXECUTABLE_ENV);
    else Deno.env.set(BROWSER_EXECUTABLE_ENV, configured);
  }
});

Deno.test('browser version probe distinguishes path and process failure classes', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-browser-version-' });
  try {
    const missing = `${root}/missing`;
    await assertRejects(() => probeBrowserVersion(missing), Error, 'path does not exist');
    await assertRejects(() => probeBrowserVersion(root), Error, 'path is not a file');

    const nonExecutable = `${root}/non-executable`;
    await Deno.writeTextFile(nonExecutable, '#!/bin/sh\necho Chromium 151.0\n');
    await Deno.chmod(nonExecutable, 0o600);
    await assertRejects(
      () => probeBrowserVersion(nonExecutable),
      Error,
      'path is not executable',
    );

    const timedOut = await writeExecutableScript(root, 'timed-out', 'while :; do :; done');
    await assertRejects(
      () => probeBrowserVersion(timedOut, 25),
      Error,
      'version probe timed out after 25 ms',
    );

    const nonZero = await writeExecutableScript(
      root,
      'non-zero',
      "echo 'version failed' >&2\nexit 7",
    );
    const nonZeroError = await assertRejects(() => probeBrowserVersion(nonZero), Error);
    assertStringIncludes(nonZeroError.message, 'version probe exited with code 7');
    assertStringIncludes(nonZeroError.message, 'version failed');

    const unrecognized = await writeExecutableScript(
      root,
      'unrecognized',
      "echo 'Unknown Browser 1.0'",
    );
    await assertRejects(
      () => probeBrowserVersion(unrecognized),
      Error,
      'unrecognized browser version output: Unknown Browser 1.0',
    );

    const recognized = await writeExecutableScript(
      root,
      'recognized',
      "echo 'Google Chrome for Testing 151.0.0.0'",
    );
    assertEquals(
      await probeBrowserVersion(recognized),
      'Google Chrome for Testing 151.0.0.0',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('configured managed browser is validated when the runtime override is present', async () => {
  const override = Deno.env.get(BROWSER_EXECUTABLE_ENV);
  if (override === undefined) return;

  const selection = await selectBrowserExecutable();
  assertEquals(selection.source, BROWSER_EXECUTABLE_ENV);
  assertEquals(selection.path, override);
  assertEquals(
    /(?:Google Chrome(?: for Testing)?|Chromium|Microsoft Edge)/i.test(selection.version),
    true,
  );
});

Deno.test('browser startup reports early status and bounded stderr instead of a target timeout', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-browser-startup-' });
  try {
    const executable = await writeExecutableScript(
      root,
      'version-then-fail',
      `if [ "$1" = "--version" ]; then
  echo 'Google Chrome for Testing 151.0.0.0'
  exit 0
fi
echo 'headless-startup-sentinel' >&2
exit 2`,
    );
    const selection = await selectBrowserExecutable(executable);
    const child = new Deno.Command(selection.path, {
      args: ['--headless=new'],
      stdout: 'null',
      stderr: 'piped',
    }).spawn();
    const stderr = captureBoundedText(child.stderr);
    const target = new Promise<never>(() => undefined);
    const error = await assertRejects(
      () => awaitBrowserStartup(selection, target, child.status, stderr),
      Error,
    );

    assertStringIncludes(error.message, BROWSER_EXECUTABLE_ENV);
    assertStringIncludes(error.message, JSON.stringify(executable));
    assertStringIncludes(error.message, 'code 2');
    assertStringIncludes(error.message, 'headless-startup-sentinel');
    assertEquals(error.message.includes('timed out waiting for Chrome DevTools target'), false);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('bounded browser output drains to EOF and retains only a marked tail', async () => {
  const terminalSentinel = 'terminal-browser-sentinel';
  const bytes = new TextEncoder().encode(`${'x'.repeat(40 * 1024)}${terminalSentinel}`);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes.subarray(0, 17 * 1024));
      controller.enqueue(bytes.subarray(17 * 1024));
      controller.close();
    },
  });
  const capture = captureBoundedText(stream);
  await capture.drain;
  const text = capture.text();

  assertStringIncludes(text, '[truncated to final 32768 bytes]');
  assertEquals(text.endsWith(terminalSentinel), true);
  assertEquals(new TextEncoder().encode(text).byteLength <= 32 * 1024 + 40, true);
});

Deno.test('live browser target failure preserves cause without inventing child status', async () => {
  const selection = {
    path: '/managed/browser',
    source: BROWSER_EXECUTABLE_ENV,
    version: 'Chromium 151.0',
  } as const;
  const targetError = new Error('timed out waiting for Chrome DevTools target');
  const status = new Promise<Deno.CommandStatus>(() => undefined);
  const stderr = captureBoundedText(
    new ReadableStream({ start: (controller) => controller.close() }),
  );
  const error = await assertRejects(
    () => awaitBrowserStartup(selection, Promise.reject(targetError), status, stderr),
    Error,
  );

  assertStringIncludes(error.message, BROWSER_EXECUTABLE_ENV);
  assertStringIncludes(error.message, JSON.stringify(selection.path));
  assertStringIncludes(error.message, targetError.message);
  assertEquals(error.message.includes('code '), false);
  assertStrictEquals(error.cause, targetError);
});

Deno.test('browser termination tolerates a naturally exited child and awaits its drain', async () => {
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      'eval',
      `await Deno.stderr.write(new TextEncoder().encode('natural-exit'))`,
    ],
    stdout: 'null',
    stderr: 'piped',
  }).spawn();
  let stderr = '';
  let drainCompleted = false;
  const drain = child.stderr
    .pipeThrough(new TextDecoderStream())
    .pipeTo(
      new WritableStream<string>({
        write(chunk) {
          stderr += chunk;
        },
      }),
    )
    .then(() => {
      drainCompleted = true;
    });

  const naturalStatus = await child.status;
  const terminatedStatus = await terminateBrowserProcess(child, drain);

  assertEquals(naturalStatus, { success: true, code: 0, signal: null });
  assertEquals(terminatedStatus, naturalStatus);
  assertEquals(stderr, 'natural-exit');
  assertEquals(drainCompleted, true);
});

Deno.test('browser termination sends SIGTERM to an active child and awaits its drain', async () => {
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      'eval',
      `console.error('ready'); setInterval(() => {}, 1_000);`,
    ],
    stdout: 'null',
    stderr: 'piped',
  }).spawn();
  const ready = Promise.withResolvers<void>();
  let stderr = '';
  let drainCompleted = false;
  const drain = child.stderr
    .pipeThrough(new TextDecoderStream())
    .pipeTo(
      new WritableStream<string>({
        write(chunk) {
          stderr += chunk;
          if (stderr.includes('ready')) ready.resolve();
        },
      }),
    )
    .then(() => {
      drainCompleted = true;
    });
  let terminationStarted = false;

  try {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutId = setTimeout(() => reject(new Error('active child did not become ready')), 5_000);
    });
    try {
      await Promise.race([ready.promise, timeout]);
    } finally {
      clearTimeout(timeoutId);
    }

    terminationStarted = true;
    const status = await terminateBrowserProcess(child, drain);
    assertEquals(status.success, false);
    assertEquals(status.signal, 'SIGTERM');
    assertStringIncludes(stderr, 'ready');
    assertEquals(drainCompleted, true);
  } finally {
    if (!terminationStarted) await terminateBrowserProcess(child, drain);
  }
});

Deno.test('browser termination propagates unrelated kill and drain errors unchanged', async () => {
  const successfulStatus: Deno.CommandStatus = { success: true, code: 0, signal: null };
  const unrelatedTypeError = new TypeError('permission denied');
  const wrongType = new Error('Child process has already terminated');

  for (const expected of [unrelatedTypeError, wrongType]) {
    const actual = await assertRejects(() =>
      terminateBrowserProcess(
        {
          kill: () => {
            throw expected;
          },
          status: Promise.resolve(successfulStatus),
        },
        Promise.resolve(),
      )
    );
    assertStrictEquals(actual, expected);
  }

  const drainError = new Error('stderr drain failed');
  const drain = new Promise<void>((_resolve, reject) => {
    setTimeout(() => reject(drainError), 0);
  });
  const actual = await assertRejects(() =>
    terminateBrowserProcess(
      {
        kill: () => undefined,
        status: Promise.resolve(successfulStatus),
      },
      drain,
    )
  );
  assertStrictEquals(actual, drainError);
});

Deno.test('browser refetch probe proves refetch before restoring its captured row name', async () => {
  const sourceUrl = new URL(
    '../../../src/application/gates/scaffold/service-client-browser-probe.ts',
    import.meta.url,
  );
  const source = await Deno.readTextFile(sourceUrl);
  const testSource = await Deno.readTextFile(new URL(import.meta.url));
  assertStringIncludes(source, 'await waitForCompletedStableBaseline(() => ({');
  assertEquals(source.includes('await delay(750)'), false);
  assertStringIncludes(source, "client!.send('Fetch.continueResponse'");
  assertStringIncludes(source, "client!.send('Fetch.disable')");
  assertStringIncludes(source, "client.send('Fetch.continueRequest'");
  const stableBaseline = source.indexOf('await waitForCompletedStableBaseline(() => ({');
  const refreshedRow = source.indexOf(
    'originalName = await waitForExpression<string>(client, rowNameExpression())',
    stableBaseline,
  );
  const renameClick = source.indexOf(
    'await evaluate(client!, clickRenameExpression())',
    refreshedRow,
  );
  assert(stableBaseline >= 0 && refreshedRow > stableBaseline && renameClick > refreshedRow);
  const settledVerdict = source.indexOf('options.assertSettled?.(evidence);', renameClick);
  const restoreCall = source.indexOf('await restoreRenamedRow(', settledVerdict);
  assert(settledVerdict > renameClick && restoreCall > settledVerdict);
  assertStringIncludes(
    source.slice(restoreCall, source.indexOf(');', restoreCall) + 2),
    'originalName',
  );
  const continueResponse = source.indexOf("client!.send('Fetch.continueResponse'");
  const disableFetch = source.indexOf("client!.send('Fetch.disable')", continueResponse);
  assert(continueResponse >= 0 && disableFetch > continueResponse);
  assertStringIncludes(source, 'const stderr = captureBoundedText(child.stderr);');
  assertStringIncludes(source, 'const childStatus = child.status;');
  assertStringIncludes(source, 'const target = await awaitBrowserStartup(');
  assertStringIncludes(source, "client.send('Log.enable')");
  for (
    const field of [
      'finalUrl',
      'documentHttpStatus',
      'documentTitle',
      'bodyHtmlSnippet',
      'consoleErrors',
      'failedNetworkRequests',
    ]
  ) {
    assertStringIncludes(source, field);
  }
  assertEquals(source.includes('new WritableStream({ write: () => undefined })'), false);
  assertEquals(source.includes('findBrowserExecutable'), false);
  const cleanupStart = source.indexOf('  } finally {', source.indexOf('let client:'));
  const helperStart = source.indexOf('/** Terminate the browser child');
  const cleanup = source.slice(cleanupStart, helperStart);
  assertStringIncludes(cleanup, 'await terminateBrowserProcess(child, stderr.drain);');
  assertEquals(cleanup.includes("child.kill('SIGTERM')"), false);

  const forbiddenCacheDirectories = [1232, 1234].map((revision) =>
    ['chromium', revision].join('-')
  );
  for (const directory of forbiddenCacheDirectories) {
    assertEquals(source.includes(directory), false);
    assertEquals(testSource.includes(directory), false);
  }
});

Deno.test('browser page diagnostics retain document status, client failures, and console errors', () => {
  const diagnostics = createBrowserPageDiagnosticsCollector();
  diagnostics.observe({
    method: 'Network.requestWillBeSent',
    params: {
      requestId: 'document',
      request: { url: 'http://localhost/examples/users', method: 'GET' },
    },
  });
  diagnostics.observe({
    method: 'Network.responseReceived',
    params: {
      requestId: 'document',
      type: 'Document',
      response: { url: 'http://localhost/examples/users', status: 200 },
    },
  });
  diagnostics.observe({
    method: 'Network.requestWillBeSent',
    params: {
      requestId: 'island',
      request: { url: 'http://localhost/@id/fresh-island::ServiceShowcaseLab', method: 'GET' },
    },
  });
  diagnostics.observe({
    method: 'Network.responseReceived',
    params: {
      requestId: 'island',
      type: 'Script',
      response: {
        url: 'http://localhost/@id/fresh-island::ServiceShowcaseLab',
        status: 404,
      },
    },
  });
  diagnostics.observe({
    method: 'Runtime.consoleAPICalled',
    params: { type: 'error', args: [{ value: 'island import failed' }] },
  });

  assertEquals(diagnostics.snapshot(), {
    documentHttpStatus: 200,
    documentUrl: 'http://localhost/examples/users',
    consoleErrors: ['island import failed'],
    failedNetworkRequests: [{
      url: 'http://localhost/@id/fresh-island::ServiceShowcaseLab',
      method: 'GET',
      status: 404,
      errorText: null,
    }],
  });
});

Deno.test('browser target selection ignores extension backgrounds and chooses the page', () => {
  const extensionTarget = {
    type: 'background_page',
    url: 'chrome-extension://nkeimhogjdpnpccoofpliimaahmaaome/background.html',
    webSocketDebuggerUrl: 'ws://localhost/devtools/page/extension',
  };
  const pageTarget = {
    type: 'page',
    url: 'about:blank',
    webSocketDebuggerUrl: 'ws://localhost/devtools/page/app',
  };

  assertStrictEquals(selectPageDebugTarget([extensionTarget, pageTarget]), pageTarget);
  assertEquals(selectPageDebugTarget([extensionTarget]), undefined);
});

Deno.test('browser target origin guard accepts only the generated app web origin', () => {
  assertExpectedAppPage(
    'http://127.0.0.1:5173/examples/users',
    'http://127.0.0.1:5173/examples/users?mode=success',
  );
  assertThrows(
    () =>
      assertExpectedAppPage(
        'http://127.0.0.1:5173/examples/users',
        'chrome-extension://nkeimhogjdpnpccoofpliimaahmaaome/background.html',
      ),
    Error,
    'chrome-extension://nkeimhogjdpnpccoofpliimaahmaaome/background.html',
  );
  assertThrows(
    () =>
      assertExpectedAppPage(
        'http://127.0.0.1:5173/examples/users',
        'http://127.0.0.1:4173/examples/users',
      ),
    Error,
    'expected an http(s) page on http://127.0.0.1:5173',
  );
});

Deno.test('live service refetch targets the same canonical page as island hydration', async () => {
  const source = await Deno.readTextFile(
    new URL(
      '../../../src/application/gates/scaffold/service-client-runtime-probe.ts',
      import.meta.url,
    ),
  );
  assertStringIncludes(source, "const SERVICE_SHOWCASE_PATH = '/examples/users';");
  assertEquals(source.includes('/examples/users?preview=success'), false);
  assertStringIncludes(source, 'assertSettled: assertSettledRefetch');
});

Deno.test('generated consumer imports usersQueries and paymentsQueries together without aliases', () => {
  const source = serviceClientConsumerSource();
  assertStringIncludes(source, "import { usersContract, usersQueries } from './users.ts';");
  assertStringIncludes(
    source,
    "import { paymentsContract, paymentsQueries } from './payments.ts';",
  );
  assertEquals(source.includes(' as usersQueries'), false);
  assertEquals(source.includes(' as paymentsQueries'), false);
  assertStringIncludes(source, 'usersQueries.list.key(usersInput)');
  assertStringIncludes(source, 'paymentsQueries.list.clientKey(paymentsInput)');
});

Deno.test('service client gates emit the required commands and probe modes', () => {
  const context = createContext();
  assertEquals(commandGate(GATE.SCAFFOLD_SERVICE_CLIENT_ADD).command(context), [
    'deno',
    'run',
    '-A',
    '/repo/packages/cli/bin/netscript.ts',
    'service',
    'add',
    '--name',
    'payments',
    '--with-client',
    '--project-root',
    context.project.projectRoot,
  ]);
  assertEquals(commandGate(GATE.SCAFFOLD_SERVICE_CLIENT_GENERATE).command(context), [
    'deno',
    'run',
    '-A',
    '/repo/packages/cli/bin/netscript.ts',
    'service',
    'generate',
    '--project-root',
    context.project.projectRoot,
  ]);

  const staticProbe = commandGate(GATE.GENERATED_SERVICE_CLIENT_CONTRACT).command(context);
  assertEquals(staticProbe.slice(-4, -1), [
    'static',
    context.project.projectRoot,
    generatedAppName(context),
  ]);
  assertEquals(JSON.parse(staticProbe.at(-1) ?? 'null'), [
    'deno',
    'run',
    '-A',
    '/repo/packages/cli/bin/netscript.ts',
  ]);
  assertEquals(commandGate(GATE.BEHAVIOR_SERVICE_CLIENT_REFETCH).command(context).slice(-4), [
    'browser',
    context.project.projectRoot,
    generatedAppName(context),
    context.project.appHost,
  ]);
});

Deno.test('service and runtime suites preserve executable service-client gate order', () => {
  const serviceIds = resolveSuite(SCAFFOLD.SERVICE).gates.map((gate) => gate.id);
  const runtimeIds = resolveSuite(SCAFFOLD.RUNTIME).gates.map((gate) => gate.id);
  assertEquals(runtimeIds.slice(0, 1), [GATE.PREFLIGHT_DENO]);
  for (const ids of [serviceIds, runtimeIds]) {
    assertEquals(
      ids.indexOf(GATE.SCAFFOLD_SERVICE_CLIENT_ADD) <
        ids.indexOf(GATE.SCAFFOLD_SERVICE_CLIENT_GENERATE),
      true,
    );
    assertEquals(
      ids.indexOf(GATE.DATABASE_CODEGEN) + 1,
      ids.indexOf(GATE.GENERATED_SERVICE_CLIENT_CONTRACT),
    );
  }
  assertEquals(serviceIds.includes(GATE.BEHAVIOR_SERVICE_CLIENT_REFETCH), false);
  const servedSurfaceIndex = runtimeIds.indexOf(GATE.BEHAVIOR_ISLAND_SERVED_SURFACE);
  assertEquals(
    runtimeIds.slice(servedSurfaceIndex, servedSurfaceIndex + 3),
    [
      GATE.BEHAVIOR_ISLAND_SERVED_SURFACE,
      GATE.BEHAVIOR_ISLAND_HYDRATION,
      GATE.BEHAVIOR_SERVICE_CLIENT_REFETCH,
    ],
  );
  assert(runtimeIds.indexOf(GATE.BEHAVIOR_SERVICE_HEALTH) < servedSurfaceIndex);
});

function commandGate(id: string): CommandGateDefinition {
  const gate = [
    ...createScaffoldGates({ plugins: [], samples: false }),
    ...createRuntimeBehaviorGates(),
  ].find((entry) => entry.id === id);
  if (!gate || gate.kind !== 'command') throw new Error(`${id} command gate missing`);
  return gate;
}

function createContext(): RunContext {
  const options: RunOptions = {
    repoRoot: '/repo',
    cliEntrypoint: 'packages/cli/bin/netscript.ts',
    smokeRoot: '/repo/.llm/tmp/cli-e2e',
    projectName: 'alpha',
    database: DATABASE.POSTGRES,
    packageSource: PACKAGE_SOURCE.LOCAL,
    plugins: [],
    samples: false,
    cache: true,
    cleanup: true,
    format: REPORT_FORMAT.PRETTY,
    commandTimeoutMs: 30_000,
    httpTimeoutMs: 10_000,
  };
  return {
    request: { suiteId: SCAFFOLD.RUNTIME, options },
    project: createSmokeProject(options),
  };
}

async function writeExecutableScript(root: string, name: string, body: string): Promise<string> {
  const path = `${root}/${name}`;
  await Deno.writeTextFile(path, `#!/bin/sh\n${body}\n`);
  await Deno.chmod(path, 0o700);
  return path;
}
