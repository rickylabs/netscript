import { assertEquals, assertRejects, assertStringIncludes, assertThrows } from '@std/assert';

import {
  parseResourceUpdateLine,
  watchResourceUpdates,
} from '../../../src/application/gates/scaffold/runtime/resource-state-stream.ts';
import { createControlledFollower } from './controlled-follower.ts';

/** Test-failure ceiling for deterministic in-memory subscription tests. */
const UNIT_WAIT_FAILURE_CEILING_MS = 1_000;
/** Deliberately short ceiling used only to prove a missing match fails non-vacuously. */
const EXPECTED_EXPIRY_CEILING_MS = 20;
/** Test-failure ceiling for proving a malformed-line child actually exits. */
const CHILD_EXIT_FAILURE_CEILING_MS = 2_000;

Deno.test('resource update parser accepts the snapshot envelope line shape', () => {
  const rawLine = JSON.stringify({
    resources: [{ displayName: 'garnet', state: 'Running', healthStatus: 'Healthy' }],
  });
  assertEquals(parseResourceUpdateLine(rawLine, 'garnet'), {
    rawLine,
    resource: { displayName: 'garnet', state: 'Running', healthStatus: 'Healthy' },
  });
});

Deno.test('resource update parser accepts the single-resource line shape', () => {
  const rawLine = JSON.stringify({
    name: 'postgres-a1b2c3',
    displayName: 'postgres',
    state: 'Running',
    healthStatus: 'Unhealthy',
  });
  assertEquals(parseResourceUpdateLine(rawLine, 'postgres'), {
    rawLine,
    resource: {
      name: 'postgres-a1b2c3',
      displayName: 'postgres',
      state: 'Running',
      healthStatus: 'Unhealthy',
    },
  });
});

Deno.test('resource update parser throws with the raw unrecognized line', () => {
  const rawLine = '{"message":"not a resource update"}';
  const error = assertThrows(
    () => parseResourceUpdateLine(rawLine, 'garnet'),
    Error,
    'Unrecognized Aspire resource update line',
  );
  assertStringIncludes(error.message, rawLine);
});

Deno.test('resource subscription observes a line emitted before waitFor is called', async () => {
  const controlled = createControlledFollower();
  const subscription = await watchResourceUpdates(
    '/workspace/app/aspire/apphost.mts',
    'garnet',
    () => controlled.follower,
  );
  const initialHealthy = JSON.stringify({
    displayName: 'garnet',
    healthStatus: 'Healthy',
    sequence: 1,
  });
  const unhealthy = JSON.stringify({
    displayName: 'garnet',
    healthStatus: 'Unhealthy',
    sequence: 2,
  });
  try {
    await controlled.emit(initialHealthy);
    await controlled.emit(unhealthy);
    let predicateCalls = 0;
    const departure = await subscription.waitFor((candidate) => {
      predicateCalls += 1;
      return candidate.resource.healthStatus === 'Unhealthy';
    }, UNIT_WAIT_FAILURE_CEILING_MS);
    assertEquals(departure.rawLine, unhealthy);
    assertEquals(predicateCalls, 2);

    const recoveryPromise = subscription.waitFor(
      (candidate) => candidate.resource.healthStatus === 'Healthy',
      UNIT_WAIT_FAILURE_CEILING_MS,
    );
    const recovered = JSON.stringify({
      displayName: 'garnet',
      healthStatus: 'Healthy',
      sequence: 3,
    });
    await controlled.emit(recovered);
    assertEquals((await recoveryPromise).rawLine, recovered);
  } finally {
    await subscription.close();
  }
});

Deno.test('resource subscription ceiling rejects when the predicate never matches', async () => {
  const controlled = createControlledFollower();
  const subscription = await watchResourceUpdates(
    '/workspace/app/aspire/apphost.mts',
    'garnet',
    () => controlled.follower,
  );
  await controlled.emit(JSON.stringify({ displayName: 'garnet', healthStatus: 'Healthy' }));

  const error = await assertRejects(
    () =>
      subscription.waitFor(
        (update) => update.resource.healthStatus === 'Unhealthy',
        EXPECTED_EXPIRY_CEILING_MS,
      ),
    Error,
    'test-failure ceiling for a hung stream',
  );
  assertStringIncludes(error.message, `${EXPECTED_EXPIRY_CEILING_MS}ms`);
  assertEquals(controlled.wasKilled(), true);
});

Deno.test('resource subscription terminates its child when line parsing throws', async () => {
  const rawLine = 'not-json-resource-output';
  let child: Deno.ChildProcess | undefined;
  const subscription = await watchResourceUpdates(
    '/workspace/app/aspire/apphost.mts',
    'garnet',
    () => {
      child = new Deno.Command(Deno.execPath(), {
        args: [
          'eval',
          `console.log(${JSON.stringify(rawLine)}); await Deno.stdin.read(new Uint8Array(1));`,
        ],
        stdin: 'piped',
        stdout: 'piped',
        stderr: 'piped',
      }).spawn();
      return child;
    },
  );

  try {
    const error = await assertRejects(
      () => subscription.waitFor(() => false, UNIT_WAIT_FAILURE_CEILING_MS),
      Error,
      rawLine,
    );
    assertStringIncludes(error.message, rawLine);
    if (!child) throw new Error('synthetic child was not spawned');
    const status = await childStatusWithin(child, CHILD_EXIT_FAILURE_CEILING_MS);
    assertEquals(status.success, false);
  } finally {
    await subscription.close();
  }
});

async function childStatusWithin(
  child: Deno.ChildProcess,
  ceilingMs: number,
): Promise<Deno.CommandStatus> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error(`synthetic follower did not terminate within ${ceilingMs}ms`)),
      ceilingMs,
    );
  });
  try {
    return await Promise.race([child.status, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
