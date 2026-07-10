import type { GitInfo } from '../agentic-lib.ts';
import type { RouteIdentity, RuntimeCommand, RuntimeDiagnostic } from './contract.ts';
import {
  CODEX_LAUNCH_WRAPPER,
  CODEX_RESUME_WRAPPER,
  inspectCodexHandoff,
  inspectCodexTurn,
  MAX_AGENT_CAPTURE_BYTES,
  observeCodexLaunch,
  planCodexCommand,
} from './adapters/codex-adapter.ts';
import { CLAUDE_SMOKE_WRAPPER, planClaudeCommand } from './adapters/claude-adapter.ts';
import { normalizeGeminiObservation, planGeminiCommand } from './adapters/gemini-adapter.ts';
import { CONFLICTING_CREDENTIAL_KEYS, validateProviderRoute } from './adapters/provider-adapter.ts';
import { FoundationRuntimeInspector } from './adapters/foundation-adapter.ts';
import {
  buildDoctorReport,
  classifyAuth,
  classifyComponent,
  classifyMobileControl,
} from '../wsl-foundation-lib.ts';
import { fingerprintRuntimeValue } from './state.ts';
import { RUNTIME_TEST_COMPONENT_VERSIONS } from './test-fixtures.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown, message = 'values differ'): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) throw new Error(`${message}\nactual: ${left}\nexpected: ${right}`);
}

function codes(diagnostics: readonly RuntimeDiagnostic[]): string[] {
  return diagnostics.map((entry) => entry.code);
}

const worktree = '/home/codex/repos/worktree';
const threadId = '019f4b72-2ea4-7050-917e-6d6918371265';
const content = { path: '/home/codex/briefs/message.md' } as const;
const git: GitInfo = {
  found: true,
  branch: 'feature',
  head: 'abc1234',
  upstream: 'NONE',
  dirty: 0,
};
const codexRoute: RouteIdentity = {
  agent: 'codex',
  provider: 'openai',
  model: 'caller-model',
  effort: 'high',
  worktree,
  mobileRequired: true,
};
const codexSession = {
  agent: 'codex',
  sessionId: threadId,
  worktree,
  boundary: 'idle',
} as const;
const resumeRoute: RouteIdentity = { ...codexRoute, sessionId: threadId };
const handoff = 'use harness\n\n## SKILL\n\n- netscript-harness - preserve the run.\n';
const idleTail = JSON.stringify({ payload: { type: 'task_complete' } });

Deno.test('Codex launch uses a content file and preserves exact worktree identity', () => {
  const command: Extract<RuntimeCommand, { kind: 'launch' }> = {
    kind: 'launch',
    commandId: 'launch-s3',
    mode: 'plan',
    route: codexRoute,
    content,
  };
  const plan = planCodexCommand({
    command,
    git,
    expectedBranch: 'feature',
    nativeExt4: true,
    handoff: inspectCodexHandoff(handoff),
  });
  assertEquals(plan.diagnostics, []);
  assertEquals(plan.route, codexRoute);
  assertEquals(plan.content, content);
  assertEquals(plan.request?.cwd, worktree);
  assertEquals(plan.request?.maxCaptureBytes, MAX_AGENT_CAPTURE_BYTES);
  assertEquals(plan.request?.arguments, [
    'run',
    '--no-lock',
    '--allow-read',
    '--allow-write',
    '--allow-run',
    CODEX_LAUNCH_WRAPPER,
    '--brief',
    content.path,
    '--worktree',
    worktree,
    '--branch',
    'feature',
    '--expect-base',
    git.head,
  ]);
});

Deno.test('Codex resume is same-thread only and cannot construct a new sender', () => {
  const command: Extract<RuntimeCommand, { kind: 'resume' }> = {
    kind: 'resume',
    commandId: 'resume-s3',
    mode: 'plan',
    route: resumeRoute,
    session: codexSession,
    content,
  };
  const plan = planCodexCommand({
    command,
    git,
    expectedBranch: 'feature',
    nativeExt4: true,
    turn: inspectCodexTurn(idleTail),
  });
  assertEquals(plan.diagnostics, []);
  assertEquals(plan.request?.arguments, [
    'run',
    '--no-lock',
    '--allow-read',
    '--allow-run',
    CODEX_RESUME_WRAPPER,
    '--thread-id',
    threadId,
    '--message-file',
    content.path,
    '--worktree',
    worktree,
  ]);
  const argv = JSON.stringify(plan.request?.arguments);
  assert(!argv.includes(CODEX_LAUNCH_WRAPPER), 'resume selected the launch wrapper');
  assert(!argv.includes('send-message-v2'), 'resume constructed a new sender');
  assertEquals(plan.route.sessionId, plan.request?.arguments[6]);
});

Deno.test('Codex reuses bounded launch-log and turn parsing primitives', () => {
  const rollout = `/home/codex/.codex/sessions/rollout-2026-07-10T00-00-00-${threadId}.jsonl`;
  const observed = observeCodexLaunch(
    `${rollout}\n{"cwd":"${worktree}","model":"caller-model"}`,
    codexRoute,
  );
  assertEquals(observed.sessionId, threadId);
  assertEquals(observed.worktree, worktree);
  assertEquals(observed.diagnostics, []);
  const missing = observeCodexLaunch(rollout, codexRoute);
  assertEquals(codes(missing.diagnostics), ['missing_identity', 'missing_identity']);
  const wrong = observeCodexLaunch(
    `${rollout}\n{"cwd":"/home/codex/repos/other","model":"other-model"}`,
    codexRoute,
  );
  assertEquals(codes(wrong.diagnostics), ['route_conflict', 'route_conflict']);
  const failed = observeCodexLaunch(
    `${rollout}\n{"cwd":"${worktree}","model":"caller-model"}\n` +
      'codex app-server exited: exit status: 1',
    codexRoute,
  );
  assertEquals(codes(failed.diagnostics), ['process_failed']);
});

Deno.test('route matrix rejects incomplete and conflicting identity before construction', () => {
  const missing = [
    { ...codexRoute, provider: undefined },
    { ...codexRoute, model: '' },
    { ...codexRoute, effort: undefined },
    { ...codexRoute, worktree: '' },
    { ...codexRoute, mobileRequired: undefined },
  ] as unknown as RouteIdentity[];
  for (const route of missing) {
    const result = validateProviderRoute({ route, nativeExt4: true, requireSession: false });
    assert(codes(result.diagnostics).includes('missing_identity'), 'incomplete route was accepted');
  }
  const wrongProvider = validateProviderRoute({
    route: { ...codexRoute, provider: 'anthropic' },
    nativeExt4: true,
    requireSession: false,
  });
  assertEquals(codes(wrongProvider.diagnostics), ['route_conflict']);
  const noThread = validateProviderRoute({
    route: codexRoute,
    nativeExt4: true,
    session: { ...codexSession, sessionId: '' },
    requireSession: true,
  });
  assert(codes(noThread.diagnostics).includes('missing_identity'), 'resume without thread passed');
  const conflict = validateProviderRoute({
    route: resumeRoute,
    nativeExt4: true,
    session: { ...codexSession, agent: 'claude' },
    requireSession: true,
  });
  assertEquals(codes(conflict.diagnostics), ['route_conflict']);
  const nonNative = validateProviderRoute({
    route: codexRoute,
    nativeExt4: false,
    requireSession: false,
  });
  assertEquals(codes(nonNative.diagnostics), ['non_native_worktree']);
});

Deno.test('dirty wrong-branch and active-turn Codex plans reject before execution', () => {
  const launch: Extract<RuntimeCommand, { kind: 'launch' }> = {
    kind: 'launch',
    commandId: 'unsafe',
    mode: 'plan',
    route: codexRoute,
    content,
  };
  const unsafe = planCodexCommand({
    command: launch,
    git: { ...git, branch: 'wrong', dirty: 1 },
    expectedBranch: 'feature',
    nativeExt4: true,
    handoff: inspectCodexHandoff(handoff),
  });
  assertEquals(unsafe.request, null);
  assert(codes(unsafe.diagnostics).includes('unsafe_worktree'), 'unsafe worktree passed');
  const missingHead = planCodexCommand({
    command: launch,
    git: { ...git, head: '' },
    expectedBranch: 'feature',
    nativeExt4: true,
    handoff: inspectCodexHandoff(handoff),
  });
  assertEquals(missingHead.request, null);
  assert(codes(missingHead.diagnostics).includes('missing_identity'), 'missing HEAD passed');
  const resume: Extract<RuntimeCommand, { kind: 'resume' }> = {
    kind: 'resume',
    commandId: 'active',
    mode: 'plan',
    route: resumeRoute,
    session: codexSession,
    content,
  };
  const active = planCodexCommand({
    command: resume,
    git,
    expectedBranch: 'feature',
    nativeExt4: true,
    turn: inspectCodexTurn(JSON.stringify({ payload: { type: 'agent_message' } })),
  });
  assertEquals(active.request, null);
  assert(codes(active.diagnostics).includes('active_session'), 'active turn passed');
});

Deno.test('Claude static smoke uses fixed bounded argv and blocks owner-only live work', () => {
  const route: RouteIdentity = {
    agent: 'claude',
    provider: 'anthropic',
    model: 'caller-model',
    effort: 'low',
    worktree,
    mobileRequired: true,
  };
  const command: Extract<RuntimeCommand, { kind: 'smoke' }> = {
    kind: 'smoke',
    commandId: 'claude-static',
    mode: 'plan',
    route,
    level: 'static',
    content,
  };
  const plan = planClaudeCommand({ command, nativeExt4: true });
  assertEquals(plan.request?.arguments, [
    'run',
    '--no-lock',
    '--allow-read',
    '--allow-run',
    CLAUDE_SMOKE_WRAPPER,
    '--prompt',
    content.path,
    '--timeout-ms',
    '30000',
  ]);
  assertEquals(plan.request?.maxCaptureBytes, MAX_AGENT_CAPTURE_BYTES);
  const live = planClaudeCommand({ command: { ...command, level: 'live' }, nativeExt4: true });
  assertEquals(live.request, null);
  assertEquals(codes(live.diagnostics), ['capability_unsupported']);
});

Deno.test('Gemini observations are finite and live evidence is issue 578 blocked', () => {
  const observation = normalizeGeminiObservation({
    version: RUNTIME_TEST_COMPONENT_VERSIONS.gemini,
    authStatus: 'ready',
    credentialKeyNames: ['IGNORED_KEY'],
  });
  assertEquals(observation.components.map((entry) => entry.component), [
    'gemini',
    'gemini-auth-policy',
  ]);
  assertEquals(observation.capability, 'available');
  const route: RouteIdentity = {
    agent: 'gemini',
    provider: 'google',
    model: 'caller-model',
    effort: 'low',
    worktree,
    mobileRequired: false,
  };
  const command: Extract<RuntimeCommand, { kind: 'smoke' }> = {
    kind: 'smoke',
    commandId: 'gemini-live',
    mode: 'plan',
    route,
    level: 'live',
    content,
  };
  const plan = planGeminiCommand({ command, nativeExt4: true });
  assertEquals(plan.request, null);
  assertEquals(plan.diagnostics[0]?.ownerIssue, 578);
  assertEquals(codes(plan.diagnostics), ['capability_deferred']);
});

Deno.test('provider blocks issue 577 routes and never exposes credential values', () => {
  const sentinel = 'SYNTHETIC_SECRET_CREDENTIAL_VALUE';
  const openRouter = validateProviderRoute({
    route: { ...codexRoute, provider: 'openrouter' },
    nativeExt4: true,
    requireSession: false,
    credentialKeyNames: ['OPENAI_API_KEY', sentinel],
  });
  assertEquals(openRouter.ok, false);
  assert(codes(openRouter.diagnostics).includes('capability_deferred'), 'OpenRouter did not block');
  assertEquals(openRouter.diagnostics.find((entry) => entry.ownerIssue)?.ownerIssue, 577);
  assertEquals(openRouter.conflictingKeyNames, ['OPENAI_API_KEY']);
  assert(
    !JSON.stringify(openRouter).includes(sentinel),
    'credential value entered provider result',
  );
  assertEquals(CONFLICTING_CREDENTIAL_KEYS.codex, ['OPENAI_API_KEY']);
  const launch = planCodexCommand({
    command: {
      kind: 'launch',
      commandId: 'sentinel',
      mode: 'plan',
      route: codexRoute,
      content,
    },
    git,
    expectedBranch: 'feature',
    nativeExt4: true,
    handoff: inspectCodexHandoff(`${handoff}\n${sentinel}`),
    credentialKeyNames: [sentinel],
  });
  assert(
    !JSON.stringify(launch).includes(sentinel),
    'content or credential value entered argv/result',
  );
  const custom = validateProviderRoute({
    route: { ...codexRoute, provider: 'custom' },
    nativeExt4: true,
    requireSession: false,
  });
  assertEquals(custom.diagnostics[0]?.ownerIssue, 577);
});

Deno.test('unsupported lifecycle operations return finite diagnostics and no request', () => {
  const claudeRoute: RouteIdentity = {
    agent: 'claude',
    provider: 'anthropic',
    model: 'caller-model',
    effort: 'low',
    worktree,
    mobileRequired: true,
  };
  const claudeLaunch: Extract<RuntimeCommand, { kind: 'launch' }> = {
    kind: 'launch',
    commandId: 'claude-launch',
    mode: 'plan',
    route: claudeRoute,
    content,
  };
  const claude = planClaudeCommand({ command: claudeLaunch, nativeExt4: true });
  assertEquals(claude.request, null);
  assertEquals(codes(claude.diagnostics), ['capability_unsupported']);
  const geminiRoute: RouteIdentity = {
    agent: 'gemini',
    provider: 'google',
    model: 'caller-model',
    effort: 'low',
    worktree,
    sessionId: threadId,
    mobileRequired: false,
  };
  const geminiResume: Extract<RuntimeCommand, { kind: 'resume' }> = {
    kind: 'resume',
    commandId: 'gemini-resume',
    mode: 'plan',
    route: geminiRoute,
    session: { ...codexSession, agent: 'gemini' },
    content,
  };
  const gemini = planGeminiCommand({ command: geminiResume, nativeExt4: true });
  assertEquals(gemini.request, null);
  assertEquals(codes(gemini.diagnostics), ['capability_unsupported']);
});

Deno.test('foundation owned readers match checkpoint canonical component shapes', async () => {
  const report = buildDoctorReport({
    generatedAt: '2026-07-10T00:00:00.000Z',
    nativePath: { cwd: worktree, nativeExt4: true },
    components: [
      classifyComponent({
        component: 'node',
        output: `v${RUNTIME_TEST_COMPONENT_VERSIONS.node}`,
        exitCode: 0,
        expected: RUNTIME_TEST_COMPONENT_VERSIONS.node,
      }),
    ],
    auth: classifyAuth(new Set(), false, false),
    mobileControl: classifyMobileControl(true, '0.144.1', '0.144.1'),
  });
  const inspector = new FoundationRuntimeInspector({ readReport: () => Promise.resolve(report) });
  assertEquals(
    await inspector.readOwnedResourceFingerprint('component:node'),
    await fingerprintRuntimeValue({
      kind: 'component',
      version: RUNTIME_TEST_COMPONENT_VERSIONS.node,
    }),
  );
});
