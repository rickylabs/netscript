import { assert, assertEquals } from '@std/assert';
import { publishCarrierRepair } from './publish-carrier-repair.mjs';

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
  assert(workflow.includes('current.number, body'));
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
      paginate: () => Promise.resolve([{ title: '0.0.8', number: 8 }]),
    };
    await publishCarrierRepair({
      github,
      context: { repo: { owner: 'fixture', repo: 'fixture' }, sha: 'main' },
      exec: { getExecOutput: () => Promise.resolve({ stdout: 'fixture.generated.ts\n' }) },
    });
    assertEquals(requests.find((entry) => entry.op === 'createCommit')?.args.parents, [
      'main',
      'previous-repair',
    ]);
    assertEquals(requests.find((entry) => entry.op === 'updateRef')?.args.force, false);
    assertEquals(requests.filter((entry) => entry.op === 'updatePull').length, 1);
  } finally {
    Deno.chdir(previous);
    await Deno.remove(root, { recursive: true });
  }
});
