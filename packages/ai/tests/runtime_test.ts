import {
  assert,
  assertEquals,
  assertNotStrictEquals,
  assertRejects,
  assertStrictEquals,
} from '@std/assert';
import {
  AiNotConfiguredError,
  createAiRuntime,
  getAiRuntime,
  isAiRuntimeInitialized,
  resetAiRuntime,
} from '../mod.ts';
import { createFakeTelemetryPort } from '../src/testing/mod.ts';
import type { AgentLoopInput } from '../src/ports/mod.ts';

const AGENT_INPUT: AgentLoopInput = {
  model: 'demo:model',
  messages: [{ role: 'user', content: 'hi' }],
};

Deno.test('createAiRuntime: defaults every unspecified port to its no-op/throwing default', () => {
  const ai = createAiRuntime();
  // No-op telemetry is safe to call with nothing wired.
  ai.telemetry.recordEvent('agent.start');
  const span = ai.telemetry.startSpan('step');
  span.setAttribute('k', 'v');
  span.end();
  // No-op skills/tools return empty.
  assertEquals(ai.tools.list(), []);
  assertEquals(ai.tools.has('anything'), false);
});

Deno.test('createAiRuntime: injected telemetry port is used verbatim', () => {
  const telemetry = createFakeTelemetryPort();
  const ai = createAiRuntime({ telemetry });
  ai.telemetry.recordEvent('agent.finish', { ok: true });
  assertEquals(telemetry.records.length, 1);
  assertEquals(telemetry.records[0]?.name, 'agent.finish');
});

Deno.test('createAiRuntime: unconfigured embedding port rejects with AiNotConfiguredError', async () => {
  const ai = createAiRuntime();
  await assertRejects(
    () => ai.embeddings.embed('hello', { model: 'x' }),
    AiNotConfiguredError,
  );
});

Deno.test('createAiRuntime: unconfigured agent loop rejects when iterated', async () => {
  const ai = createAiRuntime();
  await assertRejects(async () => {
    for await (const _chunk of ai.agentLoop.run(AGENT_INPUT)) {
      // unreachable — the default loop rejects on first pull
    }
  }, AiNotConfiguredError);
});

Deno.test('createAiRuntime: getModelProvider without id or default throws AiNotConfiguredError', () => {
  const ai = createAiRuntime();
  let threw = false;
  try {
    ai.getModelProvider();
  } catch (error) {
    threw = error instanceof AiNotConfiguredError;
  }
  assert(threw);
});

Deno.test('getAiRuntime: reuses and resets the process singleton', () => {
  resetAiRuntime();
  assertEquals(isAiRuntimeInitialized(), false);

  const first = getAiRuntime();
  const second = getAiRuntime();
  assertStrictEquals(first, second);
  assert(isAiRuntimeInitialized());

  resetAiRuntime();
  assertEquals(isAiRuntimeInitialized(), false);
  const third = getAiRuntime();
  assertNotStrictEquals(third, first);

  resetAiRuntime();
});
