import { assertEquals } from '@std/assert';
import { createBenchRunner, type RunCaps } from '../src/application/runner/bench-runner.ts';
import { FakeAgentDriver, type ScriptedTurn } from '../src/adapters/agent/fake-driver.ts';
import { fixtureResult, FixtureTestRunner } from '../src/adapters/test-runner/fixture-runner.ts';
import { PricingTokenMeter } from '../src/adapters/token-meter/pricing-token-meter.ts';
import { SystemClock } from '../src/adapters/clock/system-clock.ts';
import { ANCHORS, DEFAULT_PRESET, pricingFor } from '../bench.config.ts';
import type { Sandbox, SandboxProvider, SandboxRequest } from '../src/ports/sandbox.ts';
import type { BenchTask, FrameworkLane } from '../src/domain/task.ts';
import type { RunManifest } from '../src/domain/manifest.ts';
import type { TokenUsage } from '../src/domain/agent.ts';

class FakeSandbox implements SandboxProvider {
  disposed = 0;
  created = 0;
  create(request: SandboxRequest): Promise<Sandbox> {
    this.created += 1;
    return Promise.resolve({ workdir: `/fake/${request.taskId}`, taskId: request.taskId });
  }
  dispose(_sandbox: Sandbox): Promise<void> {
    this.disposed += 1;
    return Promise.resolve();
  }
}

const LANE: FrameworkLane = {
  id: 'netscript',
  name: 'NetScript',
  contextPath: 'context/AGENTS.md',
};

const TASK: BenchTask = {
  id: 't1-storefront-api',
  title: 'Storefront',
  dir: '/fake/task',
  promptPath: 'prompt.md',
  rubricPath: 'rubric.md',
  testSuitePath: '/fake/task/tests/frozen-suite.ts',
  lanes: [LANE],
};

const MANIFEST: RunManifest = {
  runId: 'test-run',
  startedAt: new Date(0).toISOString(),
  model: 'claude-opus-4-8',
  claudeCodeVersion: 'unknown',
  frameworkVersion: '0.0.1-alpha.19',
  denoVersion: 'test',
  lockfileHash: 'test',
  seed: 1,
  weightsPreset: 'default',
  fake: true,
};

const CAPS: RunCaps = { maxTurns: 80, maxWallSeconds: 900, suiteTimeoutMs: 1000 };

const usage: TokenUsage = {
  inputTokens: 1000,
  outputTokens: 500,
  cacheCreationTokens: 0,
  cacheReadTokens: 0,
};

function script(n: number): ScriptedTurn[] {
  return Array.from({ length: n }, () => ({ usage }) satisfies ScriptedTurn);
}

function makeRunner(
  sandbox: SandboxProvider,
  turns: ScriptedTurn[],
  results: ReturnType<typeof fixtureResult>[],
) {
  return createBenchRunner({
    driver: new FakeAgentDriver(turns),
    sandboxes: sandbox,
    testRunner: new FixtureTestRunner(results),
    tokenMeter: new PricingTokenMeter(pricingFor('claude-opus-4-8')),
    clock: new SystemClock(),
  });
}

function input() {
  return {
    task: TASK,
    lane: LANE,
    manifest: MANIFEST,
    repeat: 1,
    model: 'claude-opus-4-8',
    prompt: 'solve it',
    caps: CAPS,
    anchors: ANCHORS,
    preset: DEFAULT_PRESET,
  };
}

Deno.test('turns_to_green is the 1-based turn where the suite first goes green', async () => {
  const sandbox = new FakeSandbox();
  const runner = makeRunner(sandbox, script(6), [
    fixtureResult(2, 5),
    fixtureResult(4, 5),
    fixtureResult(5, 5), // green on turn 3
    fixtureResult(5, 5),
  ]);
  const { result, trace } = await runner.runTask(input());

  assertEquals(result.metrics.turnsToGreen, 3);
  assertEquals(result.turns, 3, 'loop stops at first green');
  assertEquals(result.stopCause, 'green');
  assertEquals(result.metrics.testPassRate, 1, 'best pass rate observed');
  assertEquals(trace.observations.length, 3);
  assertEquals(trace.observations[2].firstGreen, true);
  assertEquals(sandbox.disposed, 1, 'sandbox disposed exactly once');
});

Deno.test('never green yields null turns_to_green and best partial pass rate', async () => {
  const sandbox = new FakeSandbox();
  const runner = makeRunner(sandbox, script(3), [
    fixtureResult(2, 5),
    fixtureResult(3, 5),
    fixtureResult(1, 5),
  ]);
  const { result } = await runner.runTask(input());

  assertEquals(result.metrics.turnsToGreen, null);
  assertEquals(result.turns, 3);
  assertEquals(result.stopCause, 'agent-ended');
  assertEquals(result.metrics.testPassRate, 3 / 5, 'best observed pass rate retained');
});

Deno.test('turn cap halts the loop before the driver is exhausted', async () => {
  const sandbox = new FakeSandbox();
  const runner = createBenchRunner({
    driver: new FakeAgentDriver(script(10)),
    sandboxes: sandbox,
    testRunner: new FixtureTestRunner([fixtureResult(1, 5)]),
    tokenMeter: new PricingTokenMeter(pricingFor('claude-opus-4-8')),
    clock: new SystemClock(),
  });
  const capped = { ...input(), caps: { ...CAPS, maxTurns: 4 } };
  const { result } = await runner.runTask(capped);

  assertEquals(result.turns, 4);
  assertEquals(result.stopCause, 'max-turns');
});

Deno.test('cost accumulates across turns and is priced from the pinned table', async () => {
  const sandbox = new FakeSandbox();
  const runner = makeRunner(sandbox, script(2), [
    fixtureResult(1, 5),
    fixtureResult(5, 5),
  ]);
  const { result } = await runner.runTask(input());

  // 2 turns * (1000 input * $5/1e6 + 500 output * $25/1e6)
  //   = 2 * (0.005 + 0.0125) = 0.035
  assertEquals(Number(result.metrics.cost.toFixed(6)), 0.035);
});
