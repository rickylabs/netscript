/**
 * agentic-lib_test.ts — unit tests for the pure primitives of the agentic suite.
 *
 * Zero external deps: a tiny local `assert`/`assertEquals` (the repo's other tool
 * tests, e.g. fitness/check-ds-gates_test.ts, also avoid `@std/assert` because the
 * root import map is empty). Covers path mapping, bash quoting, handoff-contract
 * validation, Codex thread-log parsing against the REAL launch fixture, push-safety
 * evaluation, repo-slug parsing, OpenHands comment building, and status parsing
 * against a real-shaped status comment fixture.
 *
 * Run: deno test --allow-read --allow-env .llm/tools/agentic/lib/agentic-lib_test.ts
 */

import {
  appendVerdictContractEpilogue,
  buildMergeBody,
  buildOpenHandsComment,
  buildPullRequestBody,
  buildWslCommand,
  evaluateGitSafety,
  extractVerdict,
  type GitInfo,
  parseEvalVerdict,
  parseOpenHandsStatusComment,
  parseRepoSlug,
  parseThreadInfo,
  parseTurnComplete,
  selectLatestOpenHandsComment,
  sq,
  validateHandoffContract,
  VERDICT_CONTRACT_MARKER,
  type VerdictSourceComment,
  winToWsl,
  wslHome,
  wslUser,
} from './agentic-lib.ts';
import { assert, assertEquals } from '@std/assert';

const here = new URL('.', import.meta.url).pathname;
// On Windows the pathname is like /C:/...; strip the leading slash for Deno.readTextFile.
const fixtureDir = `${here.replace(/^\/([A-Za-z]:)/, '$1')}__fixtures__`;

// --- winToWsl -------------------------------------------------------------
Deno.test('winToWsl maps a Windows path to /mnt', () => {
  assertEquals(winToWsl('C:\\Dev\\repos\\x\\y.md'), '/mnt/c/Dev/repos/x/y.md');
  assertEquals(winToWsl('D:/a/b'), '/mnt/d/a/b');
});
Deno.test('winToWsl passes through a POSIX path', () => {
  assertEquals(winToWsl('/home/codex/repos/wt'), '/home/codex/repos/wt');
});

// --- host-aware WSL command planning -------------------------------------
Deno.test('buildWslCommand selects local bash argv on Linux', () => {
  assertEquals(
    buildWslCommand('codex', 'echo ok', { os: 'linux', currentUser: 'codex' }),
    { bin: 'bash', args: ['-lc', 'echo ok'], cwd: undefined },
  );
});
Deno.test('buildWslCommand preserves Windows wsl.exe argv', () => {
  assertEquals(
    buildWslCommand('codex', 'echo ok', { os: 'windows', currentUser: 'someone-else' }),
    { bin: 'wsl.exe', args: ['-u', 'codex', '--', 'bash', '-lc', 'echo ok'] },
  );
});
Deno.test('buildWslCommand maps cwd locally and to Windows --cd', () => {
  assertEquals(
    buildWslCommand('codex', 'pwd', {
      os: 'linux',
      currentUser: 'codex',
      cwd: '/home/codex/repo',
    }),
    { bin: 'bash', args: ['-lc', 'pwd'], cwd: '/home/codex/repo' },
  );
  assertEquals(
    buildWslCommand('codex', 'pwd', { os: 'windows', cwd: '/home/codex/repo' }),
    {
      bin: 'wsl.exe',
      args: ['-u', 'codex', '--cd', '/home/codex/repo', '--', 'bash', '-lc', 'pwd'],
    },
  );
});
Deno.test('buildWslCommand rejects a local requested-user mismatch', () => {
  let message = '';
  try {
    buildWslCommand('codex', 'true', { os: 'linux', currentUser: 'alice' });
  } catch (error) {
    message = (error as Error).message;
  }
  assert(message.includes('requested user "codex"'), message);
  assert(message.includes('current Linux user is "alice"'), message);
});

// --- machine/env config seam ---------------------------------------------
Deno.test('wslUser/wslHome default to the historical hardcoded values when env is unset', () => {
  const prevUser = Deno.env.get('NETSCRIPT_WSL_USER');
  const prevHome = Deno.env.get('NETSCRIPT_WSL_HOME');
  Deno.env.delete('NETSCRIPT_WSL_USER');
  Deno.env.delete('NETSCRIPT_WSL_HOME');
  try {
    assertEquals(wslUser(), 'codex');
    assertEquals(wslHome(), '/home/codex');
  } finally {
    if (prevUser !== undefined) Deno.env.set('NETSCRIPT_WSL_USER', prevUser);
    if (prevHome !== undefined) Deno.env.set('NETSCRIPT_WSL_HOME', prevHome);
  }
});
Deno.test('NETSCRIPT_WSL_USER/HOME override the defaults', () => {
  const prevUser = Deno.env.get('NETSCRIPT_WSL_USER');
  const prevHome = Deno.env.get('NETSCRIPT_WSL_HOME');
  try {
    Deno.env.set('NETSCRIPT_WSL_USER', 'dev');
    Deno.env.delete('NETSCRIPT_WSL_HOME');
    assertEquals(wslUser(), 'dev');
    assertEquals(wslHome(), '/home/dev'); // derives from user when HOME unset
    Deno.env.set('NETSCRIPT_WSL_HOME', '/custom/home');
    assertEquals(wslHome(), '/custom/home');
  } finally {
    if (prevUser !== undefined) Deno.env.set('NETSCRIPT_WSL_USER', prevUser);
    else Deno.env.delete('NETSCRIPT_WSL_USER');
    if (prevHome !== undefined) Deno.env.set('NETSCRIPT_WSL_HOME', prevHome);
    else Deno.env.delete('NETSCRIPT_WSL_HOME');
  }
});

// --- sq (bash single-quoting) --------------------------------------------
Deno.test('sq wraps plain strings', () => {
  assertEquals(sq('/home/codex/x'), "'/home/codex/x'");
});
Deno.test('sq escapes embedded single quotes', () => {
  assertEquals(sq("it's"), "'it'\\''s'");
});

// --- validateHandoffContract ---------------------------------------------
Deno.test('validateHandoffContract passes a compliant brief', () => {
  const brief = 'use harness\n\n## SKILL\n- netscript-harness\n\nbody';
  const c = validateHandoffContract(brief);
  assert(c.ok, 'should be ok');
  assert(c.useHarness && c.skillChapter, 'both flags true');
  assertEquals(c.problems.length, 0);
});
Deno.test('validateHandoffContract fails without use harness', () => {
  const c = validateHandoffContract('## SKILL\n- x\n\nbody');
  assert(!c.ok, 'not ok');
  assert(!c.useHarness && c.skillChapter, 'missing use harness only');
});
Deno.test('validateHandoffContract fails without SKILL chapter', () => {
  const c = validateHandoffContract('use harness\n\nbody');
  assert(!c.ok, 'not ok');
  assert(c.useHarness && !c.skillChapter, 'missing skill only');
});
Deno.test('validateHandoffContract tolerates CRLF briefs', () => {
  const c = validateHandoffContract('use harness\r\n\r\n## SKILL\r\n- x\r\n');
  assert(c.ok, 'CRLF brief should still validate');
});

// --- parseThreadInfo against the REAL launch fixture ----------------------
Deno.test('parseThreadInfo extracts the thread id from the real fixture', async () => {
  const log = await Deno.readTextFile(`${fixtureDir}/codex-launch-s1.head.log`);
  const info = parseThreadInfo(log);
  assertEquals(info.threadId, '019ee68a-9a41-7f01-b7d5-072fbd469b09');
  assert(
    info.rollout?.endsWith(
      'rollout-2026-06-20T21-38-23-019ee68a-9a41-7f01-b7d5-072fbd469b09.jsonl',
    ) ?? false,
    `rollout path should match, got ${info.rollout}`,
  );
  assertEquals(info.cwd, '/home/codex/repos/netscript-pt-auth-s1-contract');
  assertEquals(info.provider, 'openai');
  assertEquals(info.effort, 'medium');
});
Deno.test('parseThreadInfo returns nulls for a log with no thread', () => {
  const info = parseThreadInfo('nothing useful here');
  assertEquals(info.threadId, null);
  assertEquals(info.rollout, null);
});
Deno.test('parseThreadInfo accepts v0.144 camel-case app-server identity', () => {
  const id = '019f53f6-dab2-7331-a90f-4b3f1ea33432';
  const info = parseThreadInfo(JSON.stringify({
    id: 'netscript-thread-start',
    result: {
      thread: { id },
      model: 'fixture-model',
      modelProvider: 'openai',
      reasoningEffort: 'max',
      cwd: '/home/codex/repos/worktree',
    },
  }));
  assertEquals(info.threadId, id);
  assertEquals(info.provider, 'openai');
  assertEquals(info.effort, 'max');
  assertEquals(info.cwd, '/home/codex/repos/worktree');
});

// --- parseTurnComplete (rollout turn-state) -------------------------------
Deno.test('parseTurnComplete reports idle on a terminal task_complete', () => {
  const tail = [
    '{"type":"response_item","payload":{"type":"message","role":"assistant"}}',
    '{"type":"event_msg","payload":{"type":"token_count"}}',
    '{"type":"event_msg","payload":{"type":"task_complete"}}',
  ].join('\n');
  const s = parseTurnComplete(tail);
  assert(s.turnComplete, 'should be complete');
  assertEquals(s.lastEvent, 'task_complete');
});
Deno.test('parseTurnComplete skips trailing token_count bookkeeping after task_complete', () => {
  const tail = [
    '{"type":"event_msg","payload":{"type":"task_complete"}}',
    '{"type":"event_msg","payload":{"type":"token_count"}}',
  ].join('\n');
  const s = parseTurnComplete(tail);
  assert(s.turnComplete, 'trailing token_count must not hide the completed turn');
  assertEquals(s.lastEvent, 'task_complete');
});
Deno.test('parseTurnComplete reports busy mid-turn', () => {
  const tail = [
    '{"type":"event_msg","payload":{"type":"task_complete"}}',
    '{"type":"response_item","payload":{"type":"function_call"}}',
  ].join('\n');
  const s = parseTurnComplete(tail);
  assert(!s.turnComplete, 'a function_call after task_complete means a new turn is in flight');
  assertEquals(s.lastEvent, 'function_call');
});
Deno.test('parseTurnComplete tolerates a truncated leading line and top-level type', () => {
  const tail = [
    '5-T16-...-truncated-json-fragment',
    '{"type":"task_complete"}',
  ].join('\n');
  const s = parseTurnComplete(tail);
  assert(s.turnComplete, 'top-level task_complete type counts; truncated line skipped');
});
Deno.test('parseTurnComplete returns not-complete for empty/garbage tail', () => {
  assertEquals(parseTurnComplete('').turnComplete, false);
  assertEquals(parseTurnComplete('\n\n').lastEvent, null);
});

// --- evaluateGitSafety ----------------------------------------------------
const cleanInfo: GitInfo = {
  found: true,
  branch: 'feat/x',
  head: 'abc1234',
  upstream: 'NONE',
  dirty: 0,
};
Deno.test('evaluateGitSafety passes a clean no-upstream worktree', () => {
  const v = evaluateGitSafety(cleanInfo, { branch: 'feat/x' });
  assert(v.ok, 'should pass');
  assertEquals(v.code, 0);
});
Deno.test('evaluateGitSafety flags an inherited upstream (push hazard)', () => {
  const v = evaluateGitSafety({ ...cleanInfo, upstream: 'origin/feat/prime-time/auth' }, {});
  assert(!v.ok, 'should fail');
  assertEquals(v.code, 4);
  assert(v.problems.some((p) => p.includes('upstream')), 'names the upstream problem');
});
Deno.test('evaluateGitSafety flags a wrong branch and wrong base', () => {
  const v = evaluateGitSafety(cleanInfo, { branch: 'feat/other', expectBase: 'deadbee' });
  assert(!v.ok, 'should fail');
  assertEquals(v.problems.length, 2);
});
Deno.test('evaluateGitSafety returns code 5 for a missing worktree', () => {
  const v = evaluateGitSafety({ found: false, branch: '', head: '', upstream: '', dirty: 0 }, {});
  assertEquals(v.code, 5);
});

// --- parseRepoSlug --------------------------------------------------------
Deno.test('parseRepoSlug splits owner/name', () => {
  const s = parseRepoSlug('rickylabs/netscript');
  assertEquals(s.owner, 'rickylabs');
  assertEquals(s.repo, 'netscript');
});
Deno.test('parseRepoSlug rejects malformed slugs', () => {
  let threw = false;
  try {
    parseRepoSlug('not-a-slug');
  } catch {
    threw = true;
  }
  assert(threw, 'should throw on malformed slug');
});

// --- buildOpenHandsComment ------------------------------------------------
Deno.test('buildOpenHandsComment emits the trigger line and body', () => {
  const body = buildOpenHandsComment({
    model: 'openrouter/qwen/qwen3.7-max',
    outputMode: 'pr-comment',
    iterations: 800,
    provider: 'openrouter',
    effort: 'xhigh',
    prompt: 'use harness\n\n## SKILL\n- x',
  });
  const first = body.split('\n')[0];
  assert(first.startsWith('@openhands-agent'), 'mentions @openhands-agent');
  assert(first.includes('model=openrouter/qwen/qwen3.7-max'), 'carries model');
  assert(first.includes('output=pr-comment'), 'carries output');
  assert(first.includes('iterations=800'), 'carries iterations');
  assert(first.includes('provider=openrouter'), 'carries provider');
  assert(first.includes('effort=xhigh'), 'carries effort');
  assert(body.includes('use harness'), 'includes the prompt body');
});
Deno.test('buildOpenHandsComment omits unset tokens and strips CRLF', () => {
  const body = buildOpenHandsComment({ model: 'x/y', prompt: 'use harness\r\n## SKILL\r\n' });
  const first = body.split('\n')[0];
  assert(!first.includes('iterations='), 'no iterations token when unset');
  assert(!first.includes('output='), 'no output token when unset');
  assert(!body.includes('\r'), 'CRLF stripped from body');
});

// --- parseOpenHandsStatusComment against the real-shaped fixture ----------
Deno.test('parseOpenHandsStatusComment parses a completed status', async () => {
  const body = await Deno.readTextFile(`${fixtureDir}/openhands-status.completed.md`);
  const s = parseOpenHandsStatusComment(body);
  assertEquals(s.heading, 'Completed');
  assertEquals(s.verdict, 'completed');
  assertEquals(s.model, 'openrouter/qwen/qwen3.7-max');
  assertEquals(s.provider, 'OPENROUTER');
  assertEquals(s.jobStatus, 'success');
  assert(s.isFinal, 'completed is final');
  assert(s.runUrl?.includes('actions/runs/27412819714') ?? false, 'captures run url');
});
Deno.test('parseOpenHandsStatusComment treats Running as non-final', () => {
  const s = parseOpenHandsStatusComment(
    '<!-- openhands-agent-summary -->\n## OpenHands Agent — Running\n\nModel: `x/y`\n',
  );
  assertEquals(s.heading, 'Running');
  assertEquals(s.verdict, 'running');
  assert(!s.isFinal, 'running is not final');
});
Deno.test('parseOpenHandsStatusComment maps failure headings', () => {
  assertEquals(
    parseOpenHandsStatusComment('## OpenHands Agent — Agent failed\n').verdict,
    'agent-failed',
  );
  assertEquals(
    parseOpenHandsStatusComment('## OpenHands Agent — Bootstrap failed\n').verdict,
    'bootstrap-failed',
  );
});

// --- buildPullRequestBody / buildMergeBody --------------------------------
Deno.test('buildPullRequestBody carries the core fields and omits draft when unset', () => {
  const b = buildPullRequestBody({
    title: 'S3',
    head: 'feat/x',
    base: 'feat/umbrella',
    body: 'why',
  });
  assertEquals(b.title, 'S3');
  assertEquals(b.head, 'feat/x');
  assertEquals(b.base, 'feat/umbrella');
  assertEquals(b.body, 'why');
  assert(!('draft' in b), 'no draft key when unset');
});
Deno.test('buildPullRequestBody sets draft when requested', () => {
  assertEquals(
    buildPullRequestBody({ title: 't', head: 'h', base: 'b', body: '', draft: true }).draft,
    true,
  );
});
Deno.test('buildMergeBody passes method and pins the head sha', () => {
  const b = buildMergeBody({ method: 'merge', title: 'S3 merge', sha: 'deadbee' });
  assertEquals(b.merge_method, 'merge');
  assertEquals(b.commit_title, 'S3 merge');
  assertEquals(b.sha, 'deadbee');
  assert(!('commit_message' in b), 'no commit_message when unset');
});

// --- parseEvalVerdict -----------------------------------------------------
Deno.test('parseEvalVerdict reads a PASS from a Verdict line', () => {
  const v = parseEvalVerdict('## Verdict: IMPL-EVAL: PASS\n\nall gates green');
  assertEquals(v.kind, 'IMPL');
  assertEquals(v.verdict, 'PASS');
  assert(v.isPass && !v.isFail, 'is a pass');
});
Deno.test('parseEvalVerdict reads a FAIL_FIX verdict', () => {
  const v = parseEvalVerdict('**Verdict: IMPL-EVAL: FAIL_FIX** — one cast remains');
  assertEquals(v.verdict, 'FAIL_FIX');
  assert(v.isFail && !v.isPass, 'is a fail');
});
Deno.test('parseEvalVerdict prefers the Verdict line over an instructional echo', () => {
  // A body that quotes the instruction (FAIL_RESCOPE) before the real verdict (PASS).
  const body = 'Emit `IMPL-EVAL: FAIL_RESCOPE` if scope is wrong.\n\n## Verdict: IMPL-EVAL: PASS';
  assertEquals(parseEvalVerdict(body).verdict, 'PASS');
});
Deno.test('parseEvalVerdict returns null verdict when absent', () => {
  const v = parseEvalVerdict('## OpenHands Agent — Running\nstill working');
  assertEquals(v.verdict, null);
  assert(!v.isPass && !v.isFail, 'neither pass nor fail');
});
Deno.test('parseEvalVerdict reads a standalone VERDICT: PASS (no IMPL/PLAN kind)', () => {
  // The shape OpenHands posted for PR #100 S6: bolded, kindless verdict line.
  const v = parseEvalVerdict('## Verdict\n**VERDICT: PASS** — Certify S6 slice only.');
  assertEquals(v.kind, null);
  assertEquals(v.verdict, 'PASS');
  assert(v.isPass && !v.isFail, 'is a pass');
});
Deno.test('parseEvalVerdict treats PASS-WITH-NITS as a pass', () => {
  const v = parseEvalVerdict('VERDICT: PASS-WITH-NITS (doc polish only)');
  assertEquals(v.verdict, 'PASS-WITH-NITS');
  assert(v.isPass && !v.isFail, 'nits are non-blocking');
});
Deno.test('parseEvalVerdict reads a standalone FAIL_FIX without a kind', () => {
  const v = parseEvalVerdict('VERDICT: FAIL_FIX — one cast remains');
  assertEquals(v.verdict, 'FAIL_FIX');
  assert(v.isFail && !v.isPass, 'is a fail');
});
Deno.test('parseEvalVerdict never parses a menu echo as a verdict', () => {
  // The instruction line that lists the options must not register as PASS.
  const v = parseEvalVerdict('Emit `VERDICT: PASS | FAIL | PASS-WITH-NITS` as a PR comment.');
  assertEquals(v.verdict, null);
  assert(!v.isPass && !v.isFail, 'menu is not a verdict');
});

// --- selectLatestOpenHandsComment -----------------------------------------
Deno.test('selectLatestOpenHandsComment picks the last tagged comment', () => {
  const marker = '<!-- openhands-agent-summary -->';
  const comments = [
    { body: 'human chatter' },
    { body: `${marker}\n## OpenHands Agent — Running` },
    { body: 'more chatter' },
    { body: `${marker}\n## OpenHands Agent — Completed\nVerdict: IMPL-EVAL: PASS` },
  ];
  const latest = selectLatestOpenHandsComment(comments);
  assert(latest?.body?.includes('Completed') ?? false, 'should be the completed one');
});
Deno.test('selectLatestOpenHandsComment returns null when none tagged', () => {
  assertEquals(selectLatestOpenHandsComment([{ body: 'a' }, { body: 'b' }]), null);
});

// --- appendVerdictContractEpilogue -----------------------------------------
Deno.test('appendVerdictContractEpilogue appends the contract once (idempotent)', () => {
  const once = appendVerdictContractEpilogue('use harness\n\n## SKILL\n- x\n\nbody\n');
  assert(once.includes(VERDICT_CONTRACT_MARKER), 'carries the contract marker');
  assert(once.startsWith('use harness'), 'prompt body preserved');
  const twice = appendVerdictContractEpilogue(once);
  assertEquals(twice, once, 'second append is a no-op');
});
Deno.test('appendVerdictContractEpilogue instructs early verdict + machine-readable line', () => {
  const p = appendVerdictContractEpilogue('use harness\n## SKILL\n- x');
  assert(p.includes('IMMEDIATELY after you form the verdict'), 'verdict-first instruction');
  assert(p.includes('**[PHASE: <phase>] [VERDICT: <verdict>]**'), 'formal header form');
  assert(p.includes('OPENHANDS_VERDICT: <verdict>'), 'machine-readable line form');
  assert(p.includes('summary file'), 'summary file also carries the line');
});
Deno.test('the contract epilogue itself can never satisfy the verdict extractor', () => {
  const comment = buildOpenHandsComment({
    model: 'x/y',
    outputMode: 'pr-comment',
    prompt: appendVerdictContractEpilogue('use harness\n## SKILL\n- x'),
  });
  const v = extractVerdict([
    { body: comment, url: 'https://x/trigger', createdAt: '2026-07-05T00:00:00Z' },
  ]);
  assertEquals(v, null, 'dispatched trigger comment must not read as a verdict');
});

// --- extractVerdict (layered) ----------------------------------------------
function c(
  body: string,
  createdAt: string,
  url = `https://x/c-${createdAt}`,
): VerdictSourceComment {
  return { body, url, createdAt };
}
const OH = '<!-- openhands-agent-summary -->';
// A real-shaped trigger comment: quotes both template forms.
const triggerComment = c(
  '@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=800\n\n' +
    'use harness\n## SKILL\n- jsr-audit\n\nPost `**[PHASE: IMPL-EVAL] ' +
    '[VERDICT: <PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT>]**` and end with ' +
    'OPENHANDS_VERDICT: <verdict>.',
  '2026-07-05T00:00:00Z',
  'https://x/trigger',
);

Deno.test('extractVerdict reads the machine-readable OPENHANDS_VERDICT line (exact)', () => {
  const v = extractVerdict([
    triggerComment,
    c('Gates green.\n\nOPENHANDS_VERDICT: PASS\n', '2026-07-05T01:00:00Z', 'https://x/m'),
  ]);
  assertEquals(v?.verdict, 'PASS');
  assertEquals(v?.confidence, 'exact');
  assertEquals(v?.url, 'https://x/m');
});
Deno.test('extractVerdict reads the formal PHASE/VERDICT header (exact)', () => {
  const v = extractVerdict([
    triggerComment,
    c('**[PHASE: IMPL-EVAL] [VERDICT: FAIL_FIX]**\n\nOne cast remains.', '2026-07-05T01:00:00Z'),
  ]);
  assertEquals(v?.verdict, 'FAIL_FIX');
  assertEquals(v?.confidence, 'exact');
});
Deno.test('extractVerdict prefers an exact layer over a newer heuristic comment', () => {
  const v = extractVerdict([
    c('**[PHASE: PLAN-EVAL] [VERDICT: FAIL_PLAN]**', '2026-07-05T01:00:00Z', 'https://x/formal'),
    c(`${OH}\n## OpenHands Agent — Completed\n\n**Verdict: PASS.**`, '2026-07-05T02:00:00Z'),
  ]);
  assertEquals(v?.verdict, 'FAIL_PLAN', 'formal header outranks a newer heuristic form');
  assertEquals(v?.url, 'https://x/formal');
});
Deno.test('extractVerdict falls back to a ## Verdict section in a synthesized summary', () => {
  const v = extractVerdict([
    triggerComment,
    c(
      `${OH}\n## OpenHands Agent — Agent failed\n\n## Verdict\n**PASS**\n\ndetail`,
      '2026-07-05T01:00:00Z',
    ),
  ]);
  assertEquals(v?.verdict, 'PASS');
  assertEquals(v?.confidence, 'heuristic');
});
Deno.test('extractVerdict falls back to an inline **Verdict: PASS.** phrase', () => {
  const v = extractVerdict([
    c(
      `${OH}\n## OpenHands Agent — Completed\n\nchecks…\n\n**Verdict: PASS.** All gates green.`,
      '2026-07-05T01:00:00Z',
    ),
  ]);
  assertEquals(v?.verdict, 'PASS');
  assertEquals(v?.confidence, 'heuristic');
});
Deno.test('extractVerdict finds a verdict token buried in a context dump', () => {
  const v = extractVerdict([
    c(
      `${OH}\n## OpenHands Agent — Agent failed\n\n…iteration budget exhausted. The final verdict reached before exhaustion was FAIL_DEBT (two debt entries).`,
      '2026-07-05T01:00:00Z',
    ),
  ]);
  assertEquals(v?.verdict, 'FAIL_DEBT');
  assertEquals(v?.confidence, 'heuristic');
});
Deno.test('extractVerdict never matches the trigger/template comment', () => {
  assertEquals(extractVerdict([triggerComment]), null);
});
Deno.test('extractVerdict ignores plain PASS/FAIL prose away from a verdict context', () => {
  const v = extractVerdict([
    c(
      `${OH}\n## OpenHands Agent — Completed\n\nAll 41 tests PASS on CI; one FAIL was retried.`,
      '2026-07-05T01:00:00Z',
    ),
    c('Nice, tests PASS locally too.', '2026-07-05T02:00:00Z'),
  ]);
  assertEquals(v, null, 'a bare PASS/FAIL word is not a verdict');
});
Deno.test('extractVerdict takes the newest comment within the same layer', () => {
  const v = extractVerdict([
    c('OPENHANDS_VERDICT: FAIL_FIX', '2026-07-05T01:00:00Z'),
    c('re-eval after fix\n\nOPENHANDS_VERDICT: PASS', '2026-07-05T03:00:00Z', 'https://x/new'),
  ]);
  assertEquals(v?.verdict, 'PASS');
  assertEquals(v?.url, 'https://x/new');
});
Deno.test('extractVerdict returns null when there are no comments', () => {
  assertEquals(extractVerdict([]), null);
});
Deno.test('extractVerdict matches a bolded machine marker with Verdict: prefix (PR #475 prod form)', () => {
  const v = extractVerdict([
    triggerComment,
    c(
      '# IMPL-EVAL Summary — PR #475\n\n**Verdict: OPENHANDS_VERDICT: PASS**\n\ndetail',
      '2026-07-05T01:00:00Z',
    ),
  ]);
  assertEquals(v?.verdict, 'PASS');
  assertEquals(v?.confidence, 'exact');
});
Deno.test('extractVerdict matches a decorated full-line verdict in an agent comment (PR #476 prod form)', () => {
  const v = extractVerdict([
    triggerComment,
    c(
      '## [PHASE: IMPL-EVAL] Evaluation: PR #476\n\n**Verdict**: `FAIL_FIX`\n\n**Evaluator**: OpenHands agent',
      '2026-07-05T01:00:00Z',
    ),
  ]);
  assertEquals(v?.verdict, 'FAIL_FIX');
  assertEquals(v?.confidence, 'heuristic');
});
Deno.test('extractVerdict never maps GitHub review vocabulary to a verdict', () => {
  const v = extractVerdict([
    triggerComment,
    c(
      '## [PHASE: IMPL-EVAL] Evaluation\n\n**Verdict**: `CHANGES_REQUESTED`\n\ndetail',
      '2026-07-05T01:00:00Z',
    ),
  ]);
  assertEquals(v, null, 'CHANGES_REQUESTED is not harness vocabulary');
});
