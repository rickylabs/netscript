import type { GitInfo } from '../lib/agentic-lib.ts';
import { planClaudeCommand } from './adapters/claude-adapter.ts';
import {
  CODEX_OPENROUTER_PROFILE_FILE,
  CODEX_OPENROUTER_PROFILE_NAME,
  materializeCodexOpenRouterProfile,
  renderCodexOpenRouterProfile,
} from './adapters/codex-profile-adapter.ts';
import { inspectCodexHandoff, planCodexCommand } from './adapters/codex-adapter.ts';
import type { RouteIdentity, RuntimeCommand } from './contract.ts';

function assert(condition: unknown, message = 'assertion failed'): asserts condition {
  if (!condition) throw new Error(message);
}
function assertEquals(actual: unknown, expected: unknown, message = 'values differ'): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) throw new Error(`${message}\nactual: ${left}\nexpected: ${right}`);
}

const worktree = '/home/codex/repos/provider-profile-test';
const content = { path: '/home/codex/provider-profile-brief.md' } as const;
const git: GitInfo = {
  found: true,
  branch: 'feature',
  head: '01234567',
  upstream: 'NONE',
  dirty: 0,
};
const handoff = inspectCodexHandoff('use harness\n\n## SKILL\n- netscript-harness\n');

function route(values: Partial<RouteIdentity> = {}): RouteIdentity {
  return {
    agent: 'codex',
    provider: 'openrouter',
    profileId: 'codex-openrouter',
    model: 'z-ai/glm-5.2',
    effort: 'xhigh',
    worktree,
    mobileRequired: false,
    ...values,
  };
}

Deno.test('Codex OpenRouter profile is credential-free Responses TOML with mode 0600', async () => {
  const codexRoute = route();
  const rendered = renderCodexOpenRouterProfile(codexRoute);
  assert(rendered);
  assert(rendered.includes('base_url = "https://openrouter.ai/api/v1"'));
  assert(rendered.includes('env_key = "OPENROUTER_API_KEY"'));
  assert(rendered.includes('wire_api = "responses"'));
  assert(!rendered.includes('experimental_bearer_token'));
  const write: { current: { path: string; content: string; mode: number } | null } = {
    current: null,
  };
  const result = await materializeCodexOpenRouterProfile(
    '/home/codex/.cache/netscript-codex-profile',
    codexRoute,
    {
      ensureDirectory: () => Promise.resolve(),
      writeTextFile: (path, content, mode) => {
        write.current = { path, content, mode };
        return Promise.resolve();
      },
    },
  );
  assertEquals(result.reference, {
    name: CODEX_OPENROUTER_PROFILE_NAME,
    home: '/home/codex/.cache/netscript-codex-profile',
    path: `/home/codex/.cache/netscript-codex-profile/${CODEX_OPENROUTER_PROFILE_FILE}`,
  });
  assertEquals(write.current?.mode, 0o600);
  assertEquals(write.current?.content, rendered);
});

Deno.test('Codex OpenRouter plans select the named isolated profile and child credential', () => {
  const codexRoute = route();
  const command: Extract<RuntimeCommand, { kind: 'launch' }> = {
    kind: 'launch',
    commandId: 'codex-openrouter-launch',
    mode: 'plan',
    route: codexRoute,
    content,
  };
  const home = '/home/codex/.cache/netscript-codex-profile';
  const plan = planCodexCommand({
    command,
    git,
    expectedBranch: 'feature',
    nativeExt4: true,
    handoff,
    profile: {
      name: CODEX_OPENROUTER_PROFILE_NAME,
      home,
      path: `${home}/${CODEX_OPENROUTER_PROFILE_FILE}`,
    },
  });
  assertEquals(plan.diagnostics, []);
  assertEquals(plan.request?.arguments.slice(6, 10), [
    '--profile',
    CODEX_OPENROUTER_PROFILE_NAME,
    '--profile-home',
    home,
  ]);
  assertEquals(plan.request?.environment?.bindings, [{
    sourceKey: 'OPENROUTER_API_KEY',
    targetKey: 'OPENROUTER_API_KEY',
  }]);
  assertEquals(plan.request?.environment?.fixedValues, [
    { targetKey: 'CODEX_HOME', value: home },
    { targetKey: 'WSLENV', value: 'OPENROUTER_API_KEY:CODEX_HOME/p' },
  ]);
  assert(!plan.request?.arguments.includes('OPENROUTER_API_KEY'));
});

Deno.test('Codex OpenRouter refuses launch planning without a materialized profile', () => {
  const command: Extract<RuntimeCommand, { kind: 'launch' }> = {
    kind: 'launch',
    commandId: 'codex-profile-missing',
    mode: 'plan',
    route: route(),
    content,
  };
  const plan = planCodexCommand({
    command,
    git,
    expectedBranch: 'feature',
    nativeExt4: true,
    handoff,
  });
  assertEquals(plan.request, null);
  assert(plan.diagnostics.some((entry) => entry.code === 'state_missing'));
});

Deno.test('Claude native and OpenRouter routes use model plus isolated child environments', () => {
  const nativeRoute = route({
    agent: 'claude',
    provider: 'anthropic',
    profileId: 'claude-anthropic-native',
    model: 'claude-opus-4-6',
    effort: 'high',
  });
  const command: Extract<RuntimeCommand, { kind: 'smoke' }> = {
    kind: 'smoke',
    commandId: 'claude-native',
    mode: 'plan',
    route: nativeRoute,
    level: 'static',
    content,
  };
  const native = planClaudeCommand({ command, nativeExt4: true });
  assertEquals(native.request?.arguments.slice(5, 7), ['--model', 'claude-opus-4-6']);
  assertEquals(native.providerCompatibility, {
    remoteControl: 'available',
    experimentalNonAnthropicModel: false,
  });
  const openRouter = planClaudeCommand({
    command: {
      ...command,
      commandId: 'claude-openrouter',
      route: route({
        agent: 'claude',
        profileId: 'claude-openrouter',
        model: 'minimax/minimax-m3',
        effort: 'high',
      }),
    },
    nativeExt4: true,
  });
  assertEquals(openRouter.providerCompatibility, {
    remoteControl: 'unavailable',
    experimentalNonAnthropicModel: true,
  });
  assertEquals(openRouter.request?.environment?.emptyKeys, ['ANTHROPIC_API_KEY']);
  assertEquals(openRouter.request?.environment?.fixedValues, [{
    targetKey: 'ANTHROPIC_BASE_URL',
    value: 'https://openrouter.ai/api',
  }]);
  assertEquals(openRouter.request?.environment?.bindings, [{
    sourceKey: 'OPENROUTER_API_KEY',
    targetKey: 'ANTHROPIC_AUTH_TOKEN',
  }]);
});

Deno.test('custom Claude base URL is sanitized and always reports experimental remote unavailable', () => {
  const customRoute = route({
    agent: 'claude',
    provider: 'custom',
    profileId: 'claude-custom',
    model: 'vendor/model',
    effort: 'high',
    baseUrl: 'https://gateway.example.test',
  });
  const plan = planClaudeCommand({
    command: {
      kind: 'smoke',
      commandId: 'claude-custom',
      mode: 'plan',
      route: customRoute,
      level: 'static',
      content,
    },
    nativeExt4: true,
  });
  assertEquals(plan.diagnostics, []);
  assertEquals(plan.providerCompatibility, {
    remoteControl: 'unavailable',
    experimentalNonAnthropicModel: true,
  });
  assertEquals(plan.request?.environment?.fixedValues, [{
    targetKey: 'ANTHROPIC_BASE_URL',
    value: 'https://gateway.example.test',
  }]);
  const rejected = planClaudeCommand({
    command: {
      kind: 'smoke',
      commandId: 'claude-custom-unsafe',
      mode: 'plan',
      route: { ...customRoute, baseUrl: 'http://gateway.example.test' },
      level: 'static',
      content,
    },
    nativeExt4: true,
  });
  assertEquals(rejected.request, null);
  assert(rejected.diagnostics.some((entry) => entry.code === 'unsupported_route'));
});
