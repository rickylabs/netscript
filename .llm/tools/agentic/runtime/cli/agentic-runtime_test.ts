import { assert, assertEquals } from '@std/assert';
import { parseRuntimeArgs } from './agentic-runtime.ts';

interface SenderLeaseCliDependencies {
  readonly senderDirectory: string;
  readonly evidenceDirectory: string;
  readonly sessionRoot: string;
  readonly runSenderLeaseRepair: (
    worktree: string,
    dryRun: boolean,
  ) => Promise<
    Readonly<{
      status: 'planned' | 'succeeded' | 'no_change' | 'blocked' | 'failed';
      changed: boolean;
    }>
  >;
}

interface AgenticRuntimeCliModule {
  runAgenticRuntimeCli(
    args: readonly string[],
    dependencies: SenderLeaseCliDependencies,
  ): Promise<Readonly<{ code: number; stdout: string; stderr: string }>>;
}

async function loadCliModule(): Promise<AgenticRuntimeCliModule> {
  const moduleUrl = new URL('./agentic-runtime.ts', import.meta.url);
  return await import(moduleUrl.href) as AgenticRuntimeCliModule;
}

function assertIsolatedRoots(
  testRoot: string,
  senderDirectory: string,
  evidenceDirectory: string,
  sessionRoot: string,
): void {
  const configuredHome = Deno.env.get('HOME');
  assert(configuredHome, 'HOME must be present so the production sender root can be forbidden');
  const production = `${configuredHome}/.config/netscript-agentic/runtime/senders`;
  for (const path of [senderDirectory, evidenceDirectory, sessionRoot]) {
    assert(path.startsWith(testRoot), `path escaped the test-owned root: ${path}`);
    assert(!path.startsWith(production), `test path must not use production sender root: ${path}`);
  }
}

Deno.test('runtime CLI parses one sender-lease dry-run through the guarded planner command', () => {
  const worktree = '/tmp/netscript-sender-cli/worktree';
  assert(!worktree.includes('/.config/netscript-agentic/runtime/senders'));

  const parsed: unknown = parseRuntimeArgs([
    'repair',
    'sender-lease',
    '--worktree',
    worktree,
    '--dry-run',
    '--json',
  ]);
  assertEquals(parsed, {
    command: {
      kind: 'repair-sender-lease',
      commandId: 'repair-sender-lease-cli',
      mode: 'plan',
      worktree,
    },
    json: true,
  });
});

Deno.test('runtime CLI dry-run uses injected roots and reports planned without mutation', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-sender-cli-' });
  const senderDirectory = `${root}/senders`;
  const evidenceDirectory = `${root}/evidence`;
  const sessionRoot = `${root}/sessions`;
  assertIsolatedRoots(root, senderDirectory, evidenceDirectory, sessionRoot);
  const worktree = `${root}/worktree`;
  let calls = 0;
  try {
    const { runAgenticRuntimeCli } = await loadCliModule();
    const output = await runAgenticRuntimeCli(
      ['repair', 'sender-lease', '--worktree', worktree, '--dry-run', '--json'],
      {
        senderDirectory,
        evidenceDirectory,
        sessionRoot,
        runSenderLeaseRepair(requestedWorktree, dryRun) {
          calls++;
          assertEquals(requestedWorktree, worktree);
          assertEquals(dryRun, true);
          return Promise.resolve({ status: 'planned', changed: false });
        },
      },
    );

    assertEquals(output.code, 0);
    assertEquals(JSON.parse(output.stdout), { status: 'planned', changed: false });
    assertEquals(output.stderr, '');
    assertEquals(calls, 1);
    for (const path of [senderDirectory, evidenceDirectory, sessionRoot]) {
      await Deno.stat(path).then(
        () => {
          throw new Error(`dry-run mutated ${path}`);
        },
        (error) => assert(error instanceof Deno.errors.NotFound),
      );
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
