import { ChildProcessEnvironmentAdapter } from './adapters/child-process-environment-adapter.ts';
import type { AgentProcessRequest, ChildEnvironmentPolicy } from './ports.ts';
import { childEnvironmentPolicyForProfile, PROVIDER_PROFILES } from './provider-profiles.ts';
import { assert, assertEquals } from '@std/assert';

function stream(): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.close();
    },
  });
}
function request(environment: ChildEnvironmentPolicy): AgentProcessRequest {
  return {
    executable: 'provider-canary',
    arguments: ['--static'],
    cwd: '/home/codex/repos/provider-profile-test',
    timeoutMs: 100,
    maxCaptureBytes: 1024,
    environment,
  };
}

Deno.test('child environment late-binds only the selected target and leaves parent map unchanged', async () => {
  const opaque = crypto.randomUUID();
  const parent = new Map<string, string>([
    ['OPENROUTER_API_KEY', opaque],
    ['OPENAI_API_KEY', crypto.randomUUID()],
    ['ANTHROPIC_API_KEY', crypto.randomUUID()],
  ]);
  const before = JSON.stringify([...parent]);
  const child: { environment: Readonly<Record<string, string>> | null } = { environment: null };
  const adapter = new ChildProcessEnvironmentAdapter(
    { get: (key) => parent.get(key), toObject: () => Object.fromEntries(parent) },
    (_executable, options) => {
      child.environment = options.env;
      return {
        status: Promise.resolve({ success: true, code: 0, signal: null }),
        stdout: stream(),
        stderr: stream(),
        kill: () => undefined,
      };
    },
  );
  const policy = childEnvironmentPolicyForProfile(PROVIDER_PROFILES['claude-openrouter']);
  const outcome = await adapter.run(request(policy));
  assertEquals(outcome, { exitCode: 0, timedOut: false });
  assertEquals(child.environment?.ANTHROPIC_API_KEY, '');
  assertEquals(child.environment?.ANTHROPIC_AUTH_TOKEN, opaque);
  assertEquals(child.environment?.ANTHROPIC_BASE_URL, 'https://openrouter.ai/api');
  assertEquals(Object.keys(child.environment ?? {}).sort(), [
    'ANTHROPIC_API_KEY',
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_BASE_URL',
  ]);
  assertEquals(JSON.stringify([...parent]), before, 'parent environment map changed');
  assert(!JSON.stringify(outcome).includes(opaque), 'credential entered process outcome');
});

Deno.test('every profile policy explicitly clears rival credential keys', () => {
  for (const profile of Object.values(PROVIDER_PROFILES)) {
    const policy = childEnvironmentPolicyForProfile(profile);
    assertEquals(policy.bindings, [{
      sourceKey: profile.credentialSourceKey,
      targetKey: profile.credentialTargetKey,
    }]);
    assert(!policy.clearKeys.includes(profile.credentialTargetKey));
    for (const rival of profile.clearKeys) assert(policy.clearKeys.includes(rival));
  }
});

Deno.test('absent credential returns structured non-secret auth diagnostic without spawning', async () => {
  let spawned = false;
  const adapter = new ChildProcessEnvironmentAdapter(
    { get: () => undefined, toObject: () => ({}) },
    () => {
      spawned = true;
      throw new Error('must not spawn');
    },
  );
  const policy = childEnvironmentPolicyForProfile(PROVIDER_PROFILES['codex-openrouter']);
  const outcome = await adapter.run(request(policy));
  assertEquals(spawned, false);
  assertEquals(outcome.diagnostic?.code, 'auth_required');
  assertEquals(outcome.diagnostic?.category, 'authentication');
  assertEquals(outcome.timedOut, false);
});

Deno.test('policy refuses a selected target that is also explicitly cleared', async () => {
  const adapter = new ChildProcessEnvironmentAdapter(
    { get: () => crypto.randomUUID(), toObject: () => ({}) },
    () => {
      throw new Error('must not spawn');
    },
  );
  const outcome = await adapter.run(request({
    clearKeys: ['OPENROUTER_API_KEY'],
    emptyKeys: [],
    bindings: [{ sourceKey: 'OPENROUTER_API_KEY', targetKey: 'OPENROUTER_API_KEY' }],
  }));
  assertEquals(outcome.diagnostic?.code, 'auth_required');
});
