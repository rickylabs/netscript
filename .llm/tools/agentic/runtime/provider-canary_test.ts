import { ProviderCanaryAdapter } from './adapters/provider-canary-adapter.ts';
import { PROVIDER_CANARY_MAX_OUTPUT_TOKENS } from './adapters/provider-canary-adapter.ts';
import { OPENROUTER_MODEL_IDS } from '../config/models.ts';
import type { RouteIdentity } from './contract.ts';
import { evaluateProviderCanary } from './provider-canary.ts';
import { assert, assertEquals } from '@std/assert';

const worktree = '/home/codex/repos/provider-profile-test';
function route(values: Partial<RouteIdentity> = {}): RouteIdentity {
  return {
    agent: 'claude',
    provider: 'openrouter',
    profileId: 'claude-openrouter',
    model: OPENROUTER_MODEL_IDS.implEvaluator,
    effort: 'max',
    worktree,
    mobileRequired: false,
    ...values,
  };
}
const supported = {
  credential: 'available',
  exitCode: 0,
  timedOut: false,
  malformed: false,
  incompatibility: null,
  eventCounts: { tools: 1, reasoning: 1, streaming: 3 },
  observedIdentity: {
    provider: 'openrouter',
    model: OPENROUTER_MODEL_IDS.implEvaluator,
    effort: 'max',
  },
  identitySource: 'launch_argv_and_profile',
  outputTokenBudget: PROVIDER_CANARY_MAX_OUTPUT_TOKENS,
  responseNonEmpty: true,
} as const;

Deno.test('complete observed compatibility is the only fan-out-eligible result', () => {
  const result = evaluateProviderCanary(route(), supported);
  assertEquals(result.status, 'passed');
  assertEquals(result.fanOutEligible, true);
  assertEquals(result.diagnostics, []);
  assertEquals(result.evidence?.capabilities, {
    tools: 'supported',
    reasoning: 'supported',
    streaming: 'supported',
  });
  assertEquals(result.evidence?.remoteControl, 'unavailable');
  assertEquals(result.evidence?.experimentalNonAnthropicModel, true);
  assertEquals(result.evidence?.routeIdentity.status, 'matched');
  assertEquals(result.evidence?.outputTokenBudget, PROVIDER_CANARY_MAX_OUTPUT_TOKENS);
  assertEquals(result.evidence?.response, 'non_empty');
});

Deno.test('absent credentials are structured blocked diagnostics and never fabricated passes', async () => {
  let spawned = false;
  const parent = new Map<string, string>([['PATH', '/usr/bin']]);
  const before = JSON.stringify([...parent]);
  const adapter = new ProviderCanaryAdapter(
    { get: (key) => parent.get(key), toObject: () => Object.fromEntries(parent) },
    () => {
      spawned = true;
      throw new Error('must not spawn');
    },
  );
  const result = await adapter.run(route());
  assertEquals(spawned, false);
  assertEquals(result.status, 'blocked');
  assertEquals(result.fanOutEligible, false);
  assert(result.diagnostics.some((entry) => entry.code === 'auth_required'));
  assertEquals(result.evidence?.credential, 'absent');
  assertEquals(JSON.stringify([...parent]), before);
});

Deno.test('preset identity is reported and a mismatched preset fails before spawn', async () => {
  const exact = evaluateProviderCanary(
    route({
      presetId: 'claude-evaluator-glm-5-3-flash',
    }),
    supported,
  );
  assertEquals(exact.evidence?.presetId, 'claude-evaluator-glm-5-3-flash');

  let spawned = false;
  const adapter = new ProviderCanaryAdapter(
    { get: () => crypto.randomUUID(), toObject: () => ({ PATH: '/usr/bin' }) },
    () => {
      spawned = true;
      throw new Error('mismatched preset must not spawn');
    },
  );
  const mismatch = await adapter.run(route({
    presetId: 'claude-evaluator-glm-5-3-flash',
    model: OPENROUTER_MODEL_IDS.planEvaluator,
  }));
  assertEquals(spawned, false);
  assertEquals(mismatch.status, 'blocked');
  assertEquals(mismatch.diagnostics.map((entry) => entry.code), ['route_conflict']);
});

Deno.test('unsupported, malformed, and timeout evidence fail closed with actionable diagnostics', () => {
  const unsupported = evaluateProviderCanary(route(), {
    ...supported,
    eventCounts: { tools: 1, reasoning: 0, streaming: 3 },
  });
  assertEquals(unsupported.status, 'blocked');
  assertEquals(unsupported.evidence?.capabilities.reasoning, 'unsupported');
  assert(unsupported.diagnostics.some((entry) => entry.message.includes('reasoning')));
  const malformed = evaluateProviderCanary(route(), {
    ...supported,
    malformed: true,
    eventCounts: { tools: 0, reasoning: 0, streaming: 0 },
  });
  assertEquals(malformed.status, 'blocked');
  assertEquals(malformed.evidence?.capabilities.tools, 'unknown');
  const timeout = evaluateProviderCanary(route(), {
    ...supported,
    exitCode: 1,
    timedOut: true,
    eventCounts: { tools: 0, reasoning: 0, streaming: 0 },
  });
  assertEquals(timeout.status, 'failed');
  assert(timeout.diagnostics.some((entry) => entry.code === 'timeout'));
});

Deno.test('live adapter reduces private JSONL to counts and enforces read-only runner argv', async () => {
  const opaque = crypto.randomUUID();
  const parent = new Map<string, string>([
    ['PATH', '/usr/bin'],
    ['OPENROUTER_API_KEY', opaque],
    ['OPENAI_API_KEY', crypto.randomUUID()],
  ]);
  const before = JSON.stringify([...parent]);
  const captured: {
    options: import('./adapters/provider-canary-adapter.ts').CanaryCommandOptions | null;
  } = {
    options: null,
  };
  const output = [
    JSON.stringify({ type: 'tool_use', name: 'read_only_pwd' }),
    JSON.stringify({ type: 'reasoning', summary: 'bounded' }),
    JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'text', text: 'PROVIDER_CANARY_OK' }] },
    }),
  ].join('\n');
  const adapter = new ProviderCanaryAdapter(
    { get: (key) => parent.get(key), toObject: () => Object.fromEntries(parent) },
    (_executable, options) => {
      captured.options = options;
      return {
        output: () =>
          Promise.resolve({
            code: 0,
            stdout: new TextEncoder().encode(output),
            stderr: new Uint8Array(),
          }),
      };
    },
  );
  const result = await adapter.run(route());
  assertEquals(result.status, 'passed');
  assertEquals(result.evidence?.eventCounts, { tools: 1, reasoning: 1, streaming: 3 });
  assert(captured.options?.args.includes('--permission-mode'));
  assert(captured.options?.args.includes('plan'));
  assertEquals(
    captured.options?.args.slice(
      captured.options.args.indexOf('--effort'),
      captured.options.args.indexOf('--effort') + 2,
    ),
    ['--effort', 'max'],
  );
  assertEquals(
    captured.options?.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS,
    String(PROVIDER_CANARY_MAX_OUTPUT_TOKENS),
  );
  assertEquals(captured.options?.env.ANTHROPIC_API_KEY, '');
  assertEquals(captured.options?.env.ANTHROPIC_AUTH_TOKEN, opaque);
  assert(!JSON.stringify(result).includes(opaque), 'credential entered canary result');
  assert(!captured.options?.args.includes(opaque), 'credential entered canary argv');
  assertEquals(JSON.stringify([...parent]), before, 'parent environment changed');
});

Deno.test('live adapter requires the marker in visible assistant content', async () => {
  const parent = new Map<string, string>([
    ['PATH', '/usr/bin'],
    ['OPENROUTER_API_KEY', crypto.randomUUID()],
  ]);
  const output = [
    JSON.stringify({ type: 'reasoning', summary: 'I should reply PROVIDER_CANARY_OK' }),
    JSON.stringify({
      type: 'tool_use',
      name: 'read_only_pwd',
      input: { expectedReply: 'PROVIDER_CANARY_OK' },
    }),
    JSON.stringify({ type: 'result', result: '' }),
  ].join('\n');
  const adapter = new ProviderCanaryAdapter(
    { get: (key) => parent.get(key), toObject: () => Object.fromEntries(parent) },
    () => ({
      output: () =>
        Promise.resolve({
          code: 0,
          stdout: new TextEncoder().encode(output),
          stderr: new Uint8Array(),
        }),
    }),
  );

  const result = await adapter.run(route());
  assertEquals(result.status, 'blocked');
  assertEquals(result.evidence?.response, 'empty');
  assert(result.diagnostics.some((entry) => entry.message.includes('empty')));
});

Deno.test('live adapter retains visible output after a large reasoning prelude', async () => {
  const parent = new Map<string, string>([
    ['PATH', '/usr/bin'],
    ['OPENROUTER_API_KEY', crypto.randomUUID()],
  ]);
  const output = [
    JSON.stringify({ type: 'reasoning', summary: 'x'.repeat(70 * 1024) }),
    JSON.stringify({ type: 'tool_use', name: 'read_only_pwd' }),
    JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'text', text: 'PROVIDER_CANARY_OK' }] },
    }),
  ].join('\n');
  const adapter = new ProviderCanaryAdapter(
    { get: (key) => parent.get(key), toObject: () => Object.fromEntries(parent) },
    () => ({
      output: () =>
        Promise.resolve({
          code: 0,
          stdout: new TextEncoder().encode(output),
          stderr: new Uint8Array(),
        }),
    }),
  );

  const result = await adapter.run(route());
  assertEquals(result.status, 'passed');
  assertEquals(result.evidence?.response, 'non_empty');
  assertEquals(result.evidence?.eventCounts.tools, 1);
});

Deno.test('Codex canary requires the named profile and uses ephemeral read-only execution', async () => {
  let spawned = false;
  const codexRoute = route({
    agent: 'codex',
    profileId: 'codex-openrouter',
    model: 'x-ai/grok-4.5',
    effort: 'medium',
  });
  const adapter = new ProviderCanaryAdapter(
    {
      get: () => crypto.randomUUID(),
      toObject: () => ({ PATH: '/usr/bin' }),
    },
    () => {
      spawned = true;
      throw new Error('profile must block first');
    },
  );
  const result = await adapter.run(codexRoute);
  assertEquals(spawned, false);
  assertEquals(result.fanOutEligible, false);
  assertEquals(result.status, 'blocked');
});

Deno.test('Codex namespace rejection is reduced to a structured incompatibility', async () => {
  const codexRoute = route({
    agent: 'codex',
    profileId: 'codex-openrouter',
    model: 'z-ai/glm-5.2',
    effort: 'xhigh',
  });
  const adapter = new ProviderCanaryAdapter(
    {
      get: () => crypto.randomUUID(),
      toObject: () => ({ PATH: '/usr/bin' }),
    },
    () => ({
      output: () =>
        Promise.resolve({
          code: 1,
          stdout: new TextEncoder().encode(
            `${JSON.stringify({ type: 'thread.started' })}\n${JSON.stringify({ type: 'error' })}`,
          ),
          stderr: new TextEncoder().encode(
            'No endpoints found that support the native namespace tool type',
          ),
        }),
    }),
  );
  const result = await adapter.run(codexRoute, {
    name: 'netscript-openrouter',
    home: '/home/codex/.cache/profile',
    path: '/home/codex/.cache/profile/netscript-openrouter.config.toml',
  });
  assertEquals(result.evidence?.incompatibility, 'codex-native-namespace-tool');
  assertEquals(result.evidence?.incompatibilitySource, 'observed');
  assert(
    result.diagnostics.some((entry) =>
      entry.message.includes('native namespace tools are unsupported')
    ),
  );
});
