import { assert, assertEquals, assertMatch } from '@std/assert';
import { OPENROUTER_MODEL_IDS } from '../config/models.ts';
import { type DispatchOpenHandsDependencies, runDispatchOpenHands } from './dispatch-openhands.ts';

const PROMPT = 'use harness\n\n## SKILL\n\n- netscript-harness\n';
const MODEL = `openrouter/${OPENROUTER_MODEL_IDS.implEvaluator}`;

function args(target: string[], extra: string[] = []): string[] {
  return [
    '--repo',
    'rickylabs/netscript',
    ...target,
    '--prompt-file',
    'prompt.md',
    '--provider',
    'openrouter',
    '--model',
    MODEL,
    '--effort',
    'medium',
    ...extra,
  ];
}

function harness(overrides: Partial<DispatchOpenHandsDependencies> = {}) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const calls: string[] = [];
  const dependencies: DispatchOpenHandsDependencies = {
    readTextFile: () => Promise.resolve(PROMPT),
    resolveGithubToken: () => {
      calls.push('token');
      return Promise.resolve({ token: 'controlled-token', source: 'test' });
    },
    githubRequest: (method, path) => {
      calls.push(`${method} ${path}`);
      return Promise.resolve({ status: 500, ok: false, body: { message: 'unexpected request' } });
    },
    ...overrides,
  };
  return {
    calls,
    stdout,
    stderr,
    run: (argv: string[]) =>
      runDispatchOpenHands(argv, dependencies, {
        log: (value) => stdout.push(value),
        error: (value) => stderr.push(value),
      }),
  };
}

Deno.test('dispatch CLI rejects unknown phase and any caller-supplied head flag', async () => {
  const invalidPhase = harness();
  assertEquals(await invalidPhase.run(args(['--pr', '42'], ['--phase', 'review', '--dry-run'])), 2);
  assertMatch(invalidPhase.stderr.join('\n'), /--phase must be plan or impl/);
  assertEquals(invalidPhase.calls, []);

  const suppliedHead = harness();
  assertEquals(
    await suppliedHead.run(args(['--pr', '42'], ['--head', 'a'.repeat(40), '--dry-run'])),
    2,
  );
  assertMatch(suppliedHead.stderr.join('\n'), /Unknown argument: --head/);
  assertEquals(suppliedHead.calls, []);
});

Deno.test('formal dispatch refuses issue targets and disabled verdict contracts', async () => {
  const issue = harness();
  assertEquals(await issue.run(args(['--issue', '42'], ['--phase', 'plan', '--dry-run'])), 2);
  assertMatch(issue.stderr.join('\n'), /Formal OpenHands dispatch requires --pr/);
  assertEquals(issue.calls, []);

  const noContract = harness();
  assertEquals(
    await noContract.run(
      args(['--pr', '42'], ['--phase', 'impl', '--no-verdict-contract', '--dry-run']),
    ),
    2,
  );
  assertMatch(noContract.stderr.join('\n'), /requires the verdict output contract/);
  assertEquals(noContract.calls, []);
});

Deno.test('formal dry-run resolves the live PR head immediately before emission', async () => {
  const head = 'a'.repeat(40);
  const h = harness({
    githubRequest: (method, path) => {
      h.calls.push(`${method} ${path}`);
      return Promise.resolve({ status: 200, ok: true, body: { head: { sha: head } } });
    },
  });
  assertEquals(await h.run(args(['--pr', '42'], ['--phase', 'plan', '--dry-run'])), 0);
  assertEquals(h.calls, ['token', 'GET /repos/rickylabs/netscript/pulls/42']);
  const output = JSON.parse(h.stdout.at(-1)!);
  assertMatch(output.triggerLine, / phase=plan /);
  assertMatch(output.triggerLine, new RegExp(` head=${head}$`));
});

Deno.test('formal post uses the just-resolved live head in its only controlled post', async () => {
  const head = 'b'.repeat(40);
  let postedBody = '';
  const h = harness({
    githubRequest: (method, path, _token, body) => {
      h.calls.push(`${method} ${path}`);
      if (method === 'GET') {
        return Promise.resolve({ status: 200, ok: true, body: { head: { sha: head } } });
      }
      postedBody = String((body as { body?: unknown })?.body ?? '');
      return Promise.resolve({
        status: 201,
        ok: true,
        body: { html_url: 'https://example.test/c' },
      });
    },
  });
  assertEquals(await h.run(args(['--pr', '42'], ['--phase', 'impl'])), 0);
  assertEquals(h.calls, [
    'token',
    'GET /repos/rickylabs/netscript/pulls/42',
    'POST /repos/rickylabs/netscript/issues/42/comments',
  ]);
  assertMatch(postedBody.split('\n')[0], / phase=impl /);
  assertMatch(postedBody.split('\n')[0], new RegExp(` head=${head}$`));
});

Deno.test('non-formal PR and issue dry-runs stay tuple-free without GitHub calls', async () => {
  for (const target of [['--pr', '42'], ['--issue', '43']]) {
    const h = harness();
    assertEquals(await h.run(args(target, ['--dry-run'])), 0);
    assertEquals(h.calls, []);
    const output = JSON.parse(h.stdout.at(-1)!);
    assert(!output.triggerLine.includes('phase='));
    assert(!output.triggerLine.includes('head='));
  }
});
