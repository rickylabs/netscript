import { assert, assertEquals, assertRejects } from '@std/assert';
import { classifySenderLeaseStaleness, type SenderOwnershipRecord } from '../sender-ownership.ts';
import { LocalSenderOwnershipAdapter } from './local-sender-ownership-adapter.ts';

interface LocalSenderLeaseRepairAdapterOptions {
  readonly ownership: LocalSenderOwnershipAdapter;
  readonly evidenceDirectory: string;
  readonly sessionRoot: string;
  readonly processAlive?: (pid: number) => boolean;
  readonly debounce?: (milliseconds: number) => Promise<void>;
  readonly readThread?: (
    sessionId: string,
  ) => Promise<Readonly<{ state: 'active' | 'idle' | 'not_loaded' | 'absent' | 'unknown' }>>;
}

interface LocalSenderLeaseRepairAdapterShape {
  observe(worktree: string, record: SenderOwnershipRecord): Promise<
    import('../sender-ownership.ts').SenderLeaseStalenessObservation
  >;
  evict(worktree: string, leaseToken: string): Promise<void>;
}

interface LocalSenderLeaseRepairAdapterModule {
  readonly LocalSenderLeaseRepairAdapter: new (
    options: LocalSenderLeaseRepairAdapterOptions,
  ) => LocalSenderLeaseRepairAdapterShape;
}

const sessionId = '019f4b72-2ea4-7050-917e-6d6918371265';

async function loadAdapterModule(): Promise<LocalSenderLeaseRepairAdapterModule> {
  const moduleUrl = new URL('./local-sender-lease-repair-adapter.ts', import.meta.url);
  return await import(moduleUrl.href) as LocalSenderLeaseRepairAdapterModule;
}

function sender(
  worktree: string,
  values: Partial<SenderOwnershipRecord> = {},
): SenderOwnershipRecord {
  return {
    schemaVersion: '1.0',
    worktree,
    ownerPid: 91_751,
    leaseToken: 'original-test-lease',
    state: 'active',
    acquiredAt: '2026-08-31T10:00:00.000Z',
    updatedAt: '2026-08-31T10:01:00.000Z',
    sessionId,
    ...values,
  };
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

async function stopAndReap(child: Deno.ChildProcess): Promise<void> {
  const status = child.status;
  try {
    child.kill('SIGTERM');
  } catch (error) {
    if (
      !(error instanceof Deno.errors.NotFound) &&
      !(error instanceof TypeError && error.message === 'Child process has already terminated')
    ) throw error;
  }
  const terminated = await Promise.race([
    status.then(() => true),
    new Promise<false>((resolve) => setTimeout(() => resolve(false), 2_000)),
  ]);
  if (!terminated) {
    try {
      child.kill('SIGKILL');
    } catch (error) {
      if (
        !(error instanceof Deno.errors.NotFound) &&
        !(error instanceof TypeError && error.message === 'Child process has already terminated')
      ) throw error;
    }
  }
  await status;
}

Deno.test('changed-token CAS race retains the replacement sender record', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-sender-cas-' });
  const senderDirectory = `${root}/senders`;
  const evidenceDirectory = `${root}/evidence`;
  const sessionRoot = `${root}/sessions`;
  assertIsolatedRoots(root, senderDirectory, evidenceDirectory, sessionRoot);
  try {
    const ownership = new LocalSenderOwnershipAdapter(senderDirectory);
    const original = sender(`${root}/worktree`);
    assert(await ownership.create(original));
    await ownership.replace(
      { ...original, leaseToken: 'replacement-test-lease' },
      original.leaseToken,
    );
    const { LocalSenderLeaseRepairAdapter } = await loadAdapterModule();
    const adapter = new LocalSenderLeaseRepairAdapter({
      ownership,
      evidenceDirectory,
      sessionRoot,
    });

    await assertRejects(
      () => adapter.evict(original.worktree, original.leaseToken),
      Error,
      'sender lease mismatch',
    );
    assertEquals((await ownership.read(original.worktree))?.leaseToken, 'replacement-test-lease');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('strict rollout inventory errors stay unknown rather than proven absent', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-sender-rollout-error-' });
  const senderDirectory = `${root}/senders`;
  const evidenceDirectory = `${root}/evidence`;
  const sessionRoot = `${root}/sessions-not-a-directory`;
  assertIsolatedRoots(root, senderDirectory, evidenceDirectory, sessionRoot);
  try {
    await Deno.writeTextFile(sessionRoot, 'inventory access must fail closed\n');
    const ownership = new LocalSenderOwnershipAdapter(senderDirectory);
    const current = sender(`${root}/worktree`);
    assert(await ownership.create(current));
    const { LocalSenderLeaseRepairAdapter } = await loadAdapterModule();
    const adapter = new LocalSenderLeaseRepairAdapter({
      ownership,
      evidenceDirectory,
      sessionRoot,
      processAlive: () => false,
      debounce: () => Promise.resolve(),
      readThread: () => Promise.resolve({ state: 'idle' }),
    });

    const observation = await adapter.observe(current.worktree, current);

    assertEquals(observation.rollout.state, 'unknown');
    assertEquals(classifySenderLeaseStaleness(current.worktree, observation), 'indeterminate');
    assertEquals((await ownership.read(current.worktree))?.leaseToken, current.leaseToken);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('a real live child writer preserves its sender record and is boundedly reaped', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-sender-live-writer-' });
  const senderDirectory = `${root}/senders`;
  const evidenceDirectory = `${root}/evidence`;
  const sessionRoot = `${root}/sessions`;
  assertIsolatedRoots(root, senderDirectory, evidenceDirectory, sessionRoot);
  const writerPath = `${root}/writer-open`;
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      'eval',
      `const file = await Deno.open(${
        JSON.stringify(writerPath)
      }, { create: true, write: true }); ` +
      'await file.write(new TextEncoder().encode("READY\\n")); console.log("READY"); ' +
      'await new Promise(() => {});',
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const stdoutReader = child.stdout.getReader();
  try {
    const ready = await Promise.race([
      stdoutReader.read(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('live writer readiness timed out')), 2_000)
      ),
    ]);
    assert(!ready.done && new TextDecoder().decode(ready.value).includes('READY'));
    await Deno.mkdir(sessionRoot, { recursive: true });
    await Deno.writeTextFile(
      `${sessionRoot}/rollout-2026-08-31-${sessionId}.jsonl`,
      `${
        JSON.stringify({
          type: 'session_meta',
          payload: { id: sessionId, cwd: `${root}/worktree` },
        })
      }\n${JSON.stringify({ type: 'event_msg', payload: { type: 'task_started' } })}\n`,
    );
    const ownership = new LocalSenderOwnershipAdapter(senderDirectory);
    const current = sender(`${root}/worktree`, { ownerPid: child.pid });
    assert(await ownership.create(current));
    const { LocalSenderLeaseRepairAdapter } = await loadAdapterModule();
    const adapter = new LocalSenderLeaseRepairAdapter({
      ownership,
      evidenceDirectory,
      sessionRoot,
      readThread: () => Promise.resolve({ state: 'active' }),
    });

    const observation = await adapter.observe(current.worktree, current);

    assertEquals(observation.pid.first, 'alive');
    assertEquals(observation.thread.state, 'active');
    assertEquals(classifySenderLeaseStaleness(current.worktree, observation), 'preserve');
    assertEquals((await ownership.read(current.worktree))?.leaseToken, current.leaseToken);
  } finally {
    await stdoutReader.cancel().catch(() => undefined);
    stdoutReader.releaseLock();
    await stopAndReap(child);
    await new Response(child.stderr).text().catch(() => '');
    await Deno.remove(root, { recursive: true });
  }
});
