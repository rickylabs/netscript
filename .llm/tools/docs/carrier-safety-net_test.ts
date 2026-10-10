import { assert, assertEquals } from '@std/assert';
import { publishCarrierRepair, trackCarrierDrift } from './publish-carrier-repair.mjs';

Deno.test('main carrier safety net retains every required quality gate and has a visible fallback', async () => {
  const workflow = await Deno.readTextFile(
    new URL('../../../.github/workflows/generated-carriers.yml', import.meta.url),
  );
  const ci = await Deno.readTextFile(new URL('../../../.github/workflows/ci.yml', import.meta.url));
  for (const gate of ['agent-docs-prose', 'mcp-export-corpus', 'assets-barrel', 'publish-assets']) {
    assert(workflow.includes(`check:${gate}`));
    assert(ci.includes(`--gate ${gate}`));
  }
  assert(workflow.includes('branches: [main]'));
  assert(workflow.includes('secrets.PAT_TOKEN'));
  assert(workflow.includes('if (!process.env.CHAIN_TOKEN) throw'));
  assert(workflow.includes('core.setFailed('));
  assert(workflow.includes('trackCarrierDrift({ github, context })'));
  assert(workflow.includes('deno-version: ${{ env.DENO_VERSION }}'));
  assert(!workflow.includes("title === '0.0.8'"));
});

Deno.test('carrier repair updates one existing PR and uses an ordinary merge commit', async () => {
  const requests: Array<{ op: string; args: Record<string, unknown> }> = [];
  const record = (op: string, data: Record<string, unknown>) => (args: Record<string, unknown>) => {
    requests.push({ op, args });
    return Promise.resolve({ data });
  };
  const root = await Deno.makeTempDir();
  const previous = Deno.cwd();
  try {
    Deno.chdir(root);
    await Deno.writeTextFile('fixture.generated.ts', 'export const fixture = 1;\n');
    await Deno.writeTextFile('new.generated.ts', 'export const added = 2;\n');
    const github = {
      rest: {
        git: {
          getCommit: record('getCommit', { tree: { sha: 'main-tree' } }),
          getRef: record('getRef', { object: { sha: 'previous-repair' } }),
          createBlob: record('createBlob', { sha: 'blob' }),
          createTree: record('createTree', { sha: 'tree' }),
          createCommit: record('createCommit', { sha: 'repair' }),
          updateRef: record('updateRef', {}),
        },
        pulls: {
          list: () => Promise.resolve({ data: [{ number: 42 }] }),
          update: record('updatePull', { number: 42 }),
        },
        issues: { listMilestones: () => {}, update: record('updateIssue', {}) },
      },
      paginate: () => Promise.resolve([{ title: 'Backlog / Triage', number: 8 }]),
    };
    await publishCarrierRepair({
      github,
      context: { repo: { owner: 'fixture', repo: 'fixture' }, sha: 'main' },
      exec: {
        getExecOutput: (_command: string, args: string[]) =>
          Promise.resolve({
            stdout: args[0] === 'diff' ? 'fixture.generated.ts\n' : 'new.generated.ts\n',
          }),
      },
    });
    assertEquals(requests.find((entry) => entry.op === 'createCommit')?.args.parents, [
      'main',
      'previous-repair',
    ]);
    assertEquals(requests.find((entry) => entry.op === 'updateRef')?.args.force, false);
    assertEquals(requests.filter((entry) => entry.op === 'updatePull').length, 1);
    assertEquals(requests.find((entry) => entry.op === 'createTree')?.args.tree, [
      { path: 'fixture.generated.ts', mode: '100644', type: 'blob', sha: 'blob' },
      { path: 'new.generated.ts', mode: '100644', type: 'blob', sha: 'blob' },
    ]);
  } finally {
    Deno.chdir(previous);
    await Deno.remove(root, { recursive: true });
  }
});

for (const failure of ['lookup', 'assignment', 'missing'] as const) {
  Deno.test(`fallback tracking issue is created before milestone ${failure} failure`, async () => {
    const operations: string[] = [];
    const github = {
      rest: {
        issues: {
          listForRepo: () => {},
          listMilestones: () => {},
          create: () => {
            operations.push('create');
            return Promise.resolve({ data: { number: 17 } });
          },
          update: () => {
            operations.push('assignment');
            return Promise.reject(new Error('Milestone is closed'));
          },
        },
      },
      paginate: (_api: unknown, args: Record<string, unknown>) => {
        if (args.labels) return Promise.resolve([]);
        operations.push('lookup');
        if (failure === 'lookup') return Promise.reject(new Error('Milestone lookup unavailable'));
        return Promise.resolve(
          failure === 'missing' ? [] : [{ title: 'Backlog / Triage', number: 8 }],
        );
      },
    };
    assertEquals(
      await trackCarrierDrift({
        github,
        context: {
          repo: { owner: 'fixture', repo: 'fixture' },
          serverUrl: 'https://github.com',
          runId: 1,
        },
      }),
      17,
    );
    assertEquals(operations[0], 'create');
    assert(operations.includes('lookup'));
  });
}
