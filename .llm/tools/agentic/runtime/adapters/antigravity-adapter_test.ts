import {
  ANTIGRAVITY_MAX_CAPTURE_BYTES,
  type AntigravityCommandOptions,
  AntigravityEvidenceAdapter,
  printArguments,
} from './antigravity-adapter.ts';
import { MODEL_IDS } from '../../config/models.ts';
import { assert, assertEquals, assertThrows } from '@std/assert';

const encoder = new TextEncoder();

Deno.test('Antigravity adapter passes the prompt as the final print value', async () => {
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
            stdout: encoder.encode(
              '{"event":"result","result":{"status":"SUCCESS","response":"AGY_HEADLESS_CANARY_OK\\n"}}\n',
            ),
            stderr: new Uint8Array(),
          }),
      };
    },
  );
  const result = await adapter.run({
    cwd: '/home/codex/repos/worktree',
    probe: 'headless',
    timeoutMs: 10_000,
  });
  assertEquals(result.status, 'passed');
  assertEquals(result.evidence.capabilities.headless, 'supported');
  assertEquals(result.evidence.capabilities.structured_output, 'supported');
  assertEquals(captured?.executable, 'agy');
  assertEquals(captured?.options.args, [
    '--model',
    MODEL_IDS.antigravityDocs,
    '--output-format',
    'stream-json',
    '--dangerously-skip-permissions',
    '--new-project',
    '--print',
    'Read-only canary. Reply with exactly AGY_HEADLESS_CANARY_OK. Do not use tools or modify files.',
  ]);
  const printIndex = captured?.options.args.indexOf('--print') ?? -1;
  assertEquals(printIndex, (captured?.options.args.length ?? 0) - 2);
  assertEquals(captured?.options.args[printIndex + 1]?.startsWith('--'), false);
  assertEquals(captured?.options.env, { HOME: '/home/codex', PATH: '/home/codex/.local/bin' });
  assertEquals(captured?.options.clearEnv, true);
  assert(!JSON.stringify(result).includes('SYNTHETIC_VALUE_NOT_FOR_CHILD'));
});

Deno.test('Antigravity argv rejects an empty or flag-shaped resolved prompt', () => {
  assertThrows(
    () => printArguments('headless', ''),
    Error,
    'prompt must be the non-flag value',
  );
  assertThrows(
    () => printArguments('headless', '--print-timeout'),
    Error,
    'prompt must be the non-flag value',
  );
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
