import {
  ANTIGRAVITY_MAX_CAPTURE_BYTES,
  type AntigravityCommandOptions,
  AntigravityEvidenceAdapter,
} from './antigravity-adapter.ts';

function assert(condition: unknown, message = 'assertion failed'): asserts condition {
  if (!condition) throw new Error(message);
}
function assertEquals(actual: unknown, expected: unknown, message = 'values differ'): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}\nactual: ${JSON.stringify(actual)}\nexpected: ${JSON.stringify(expected)}`,
    );
  }
}
const encoder = new TextEncoder();

Deno.test('Antigravity adapter builds a bounded sandboxed request with child-only environment', async () => {
  let captured: { executable: string; options: AntigravityCommandOptions } | undefined;
  const adapter = new AntigravityEvidenceAdapter(
    {
      toObject: () => ({
        HOME: '/home/codex',
        PATH: '/home/codex/.local/bin',
        OPENAI_API_KEY: 'SYNTHETIC_VALUE_NOT_FOR_CHILD',
        ANTHROPIC_BASE_URL: 'https://rival.invalid',
      }),
    },
    (executable, options) => {
      captured = { executable, options };
      return {
        output: () =>
          Promise.resolve({
            code: 0,
            stdout: encoder.encode('AGY_HEADLESS_CANARY_OK'),
            stderr: new Uint8Array(),
          }),
      };
    },
  );
  const result = await adapter.run({
    cwd: '/home/codex/repos/worktree',
    probe: 'headless',
    timeoutMs: 10_000,
    model: 'caller-model',
    agent: 'caller-agent',
    project: 'caller-project',
  });
  assertEquals(result.status, 'passed');
  assertEquals(captured?.executable, 'agy');
  assertEquals(captured?.options.args, [
    '--print',
    '--print-timeout',
    '10000ms',
    '--sandbox',
    '--model',
    'caller-model',
    '--agent',
    'caller-agent',
    '--project',
    'caller-project',
    'Read-only canary. Reply with exactly AGY_HEADLESS_CANARY_OK. Do not use tools or modify files.',
  ]);
  assertEquals(captured?.options.env, { HOME: '/home/codex', PATH: '/home/codex/.local/bin' });
  assertEquals(captured?.options.clearEnv, true);
  assert(!JSON.stringify(result).includes('SYNTHETIC_VALUE_NOT_FOR_CHILD'));
});

Deno.test('Antigravity adapter classifies auth/service failure and retains no raw output', async () => {
  const adapter = new AntigravityEvidenceAdapter(
    { toObject: () => ({ HOME: '/home/codex' }) },
    () => ({
      output: () =>
        Promise.resolve({
          code: 1,
          stdout: new Uint8Array(),
          stderr: encoder.encode('authentication required; service unavailable'),
        }),
    }),
  );
  const result = await adapter.run({ cwd: '/home/codex/repos/worktree', probe: 'headless' });
  assertEquals(result.status, 'blocked');
  assertEquals(result.evidence.failureSignals, ['authentication', 'provider_unavailable']);
  assertEquals(result.diagnostics.map((entry) => entry.code), [
    'auth_required',
    'provider_unavailable',
  ]);
  assert(!JSON.stringify(result).includes('service unavailable'));
});

Deno.test('Antigravity adapter abort is a failed timeout even with owner acceptance', async () => {
  const adapter = new AntigravityEvidenceAdapter(
    { toObject: () => ({}) },
    (_executable, options) => ({
      output: () =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener(
            'abort',
            () => reject(new DOMException('aborted', 'AbortError')),
            { once: true },
          );
        }),
    }),
  );
  const result = await adapter.run({
    cwd: '/home/codex/repos/worktree',
    probe: 'headless',
    timeoutMs: 1,
    ownerAcceptedCapabilities: ['headless'],
  });
  assertEquals(result.status, 'failed');
  assertEquals(result.evidence.process, { exitCode: 1, timedOut: true });
  assertEquals(result.evidence.capabilities.headless, 'owner_accepted_working');
});

Deno.test('Antigravity adapter bounds captured provider text before classification', async () => {
  const oversized = `https://example.test/citation ${
    'x'.repeat(ANTIGRAVITY_MAX_CAPTURE_BYTES * 2)
  }`;
  const adapter = new AntigravityEvidenceAdapter(
    { toObject: () => ({}) },
    () => ({
      output: () =>
        Promise.resolve({ code: 0, stdout: encoder.encode(oversized), stderr: new Uint8Array() }),
    }),
  );
  const result = await adapter.run({ cwd: '/home/codex/repos/worktree', probe: 'web-citations' });
  assertEquals(result.status, 'passed');
  assertEquals(result.evidence.citations, [{
    url: 'https://example.test/citation',
    persisted: true,
  }]);
  assert(JSON.stringify(result).length < 2_000);
});
