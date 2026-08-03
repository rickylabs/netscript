import {
  classifyCodexRemote,
  type CodexRecoveryEvidence,
  type CodexRemoteObservation,
  type CodexRemoteRepairPort,
  runCodexRemoteRepair,
} from './codex-remote-repair.ts';
import {
  CODEX_CONTROL_SOCKET_RELATIVE,
  isAnchoredCodexAppServer,
  parseProcessTable,
  recentActiveSessions,
} from './adapters/local-codex-remote-adapter.ts';
import { assert } from '@std/assert';

const home = '/home/codex';
const worktree = '/home/codex/repos/worktree';
const socket = `${home}/${CODEX_CONTROL_SOCKET_RELATIVE}`;
const anchoredArgv = `${home}/.codex/packages/standalone/current/codex app-server --remote-control`;

function observed(values: Partial<CodexRemoteObservation> = {}): CodexRemoteObservation {
  return {
    cliVersion: '0.150.0',
    daemonVersion: '0.150.0',
    daemonManaged: false,
    remoteConnected: false,
    controlSocketPresent: true,
    controlSocketPath: socket,
    appServers: [{ pid: 71, argv: anchoredArgv, anchored: true }],
    activeSessionIds: [],
    activeChildCommands: [],
    ...values,
  };
}

class FakeRepairPort implements CodexRemoteRepairPort {
  readonly events: string[] = [];
  readonly evidence: CodexRecoveryEvidence[] = [];
  constructor(private readonly observations: CodexRemoteObservation[]) {}
  inspect(_worktree: string): Promise<CodexRemoteObservation> {
    this.events.push('inspect');
    const value = this.observations.shift();
    if (!value) throw new Error('missing observation');
    return Promise.resolve(value);
  }
  terminateAnchored(pids: readonly number[]): Promise<void> {
    this.events.push(`terminate:${pids.join(',')}`);
    return Promise.resolve();
  }
  removeKnownControlSocket(path: string): Promise<void> {
    this.events.push(`remove:${path}`);
    return Promise.resolve();
  }
  restartAndPair(): Promise<void> {
    this.events.push('restart-pair');
    return Promise.resolve();
  }
  persistEvidence(evidence: CodexRecoveryEvidence): Promise<void> {
    this.events.push('persist');
    this.evidence.push(evidence);
    return Promise.resolve();
  }
  now(): string {
    return '2026-07-10T21:00:00.000Z';
  }
}

Deno.test('daemon classification explicitly distinguishes every #580 state', () => {
  assert(
    classifyCodexRemote(observed({ daemonManaged: true, remoteConnected: true })) === 'managed',
  );
  assert(classifyCodexRemote(observed()) === 'unmanaged');
  assert(classifyCodexRemote(observed({ appServers: [] })) === 'stale_socket');
  assert(classifyCodexRemote(observed({ daemonManaged: true })) === 'disconnected');
  assert(classifyCodexRemote(observed({ daemonVersion: '0.149.0' })) === 'version_skew');
  assert(
    classifyCodexRemote(observed({ appServers: [], controlSocketPresent: false })) === 'absent',
  );
});

Deno.test('repair refuses active sessions and child commands before every mutation', async () => {
  for (
    const observation of [
      observed({ activeSessionIds: ['thread-active'] }),
      observed({ activeChildCommands: ['deno'] }),
    ]
  ) {
    const port = new FakeRepairPort([observation]);
    const result = await runCodexRemoteRepair(worktree, false, port);
    assert(result.status === 'blocked');
    assert(result.diagnostics[0]?.code === 'active_session');
    assert(port.events.join(',') === 'inspect');
  }
});

Deno.test('repair proceeds from absent state despite stale non-completed rollout evidence', async () => {
  const sessionRoot = await Deno.makeTempDir({ prefix: 'netscript-stale-rollout-' });
  try {
    await Deno.writeTextFile(
      `${sessionRoot}/019f4b72-2ea4-7050-917e-6d6918371265.jsonl`,
      '{"type":"agent_message"}\n',
    );
    const activeSessionIds = await recentActiveSessions(sessionRoot, false);
    const port = new FakeRepairPort([observed({
      appServers: [],
      controlSocketPresent: false,
      activeSessionIds,
    })]);
    const result = await runCodexRemoteRepair(worktree, true, port);
    assert(activeSessionIds.length === 0);
    assert(result.status === 'planned');
    assert(port.events.join(',') === 'inspect');
  } finally {
    await Deno.remove(sessionRoot, { recursive: true });
  }
});

Deno.test('repair still refuses a non-completed rollout anchored by a live app-server', async () => {
  const sessionRoot = await Deno.makeTempDir({ prefix: 'netscript-live-rollout-' });
  try {
    const sessionId = '019f4b72-2ea4-7050-917e-6d6918371265';
    await Deno.writeTextFile(`${sessionRoot}/${sessionId}.jsonl`, '{"type":"agent_message"}\n');
    const activeSessionIds = await recentActiveSessions(sessionRoot, true);
    const port = new FakeRepairPort([observed({
      controlSocketPresent: false,
      activeSessionIds,
    })]);
    const result = await runCodexRemoteRepair(worktree, true, port);
    assert(activeSessionIds.join(',') === sessionId);
    assert(result.status === 'blocked');
    assert(result.diagnostics[0]?.code === 'active_session');
    assert(port.events.join(',') === 'inspect');
  } finally {
    await Deno.remove(sessionRoot, { recursive: true });
  }
});

Deno.test('repair refuses unanchored processes and parser never broad-matches shells', async () => {
  assert(isAnchoredCodexAppServer(anchoredArgv, home));
  assert(!isAnchoredCodexAppServer('bash -lc pkill -f "codex app-server"', home));
  assert(!isAnchoredCodexAppServer('/usr/local/bin/codex app-server', home));
  const table = parseProcessTable(
    `71 1 ${anchoredArgv}\n72 1 bash -lc pkill -f "codex app-server"\n`,
    home,
  );
  assert(table.appServers.length === 2);
  assert(table.appServers.filter((entry) => entry.anchored).length === 1);
  const port = new FakeRepairPort([observed({ appServers: table.appServers })]);
  const result = await runCodexRemoteRepair(worktree, false, port);
  assert(result.status === 'blocked');
  assert(result.diagnostics[0]?.code === 'unowned_resource');
  assert(port.events.join(',') === 'inspect');
});

Deno.test('dry-run inspects and plans without daemon, socket, or evidence mutation', async () => {
  const port = new FakeRepairPort([observed()]);
  const result = await runCodexRemoteRepair(worktree, true, port);
  assert(result.status === 'planned');
  assert(port.events.join(',') === 'inspect');
});

Deno.test('repair follows anchored terminate socket restart verify evidence order', async () => {
  const healthy = observed({
    daemonManaged: true,
    remoteConnected: true,
    controlSocketPresent: true,
    appServers: [{ pid: 81, argv: anchoredArgv, anchored: true }],
  });
  const port = new FakeRepairPort([observed(), healthy]);
  const result = await runCodexRemoteRepair(worktree, false, port);
  assert(result.status === 'succeeded');
  assert(
    port.events.join('|') ===
      `inspect|terminate:71|remove:${socket}|restart-pair|inspect|persist`,
  );
  assert(port.evidence[0]?.before === 'unmanaged');
  assert(port.evidence[0]?.after === 'managed');
  assert(!JSON.stringify(port.evidence[0]).includes(anchoredArgv));
});

Deno.test('post-repair version skew fails verification and persists no evidence', async () => {
  const port = new FakeRepairPort([observed(), observed({ daemonVersion: '0.149.0' })]);
  const result = await runCodexRemoteRepair(worktree, false, port);
  assert(result.status === 'failed');
  assert(result.diagnostics[0]?.code === 'version_skew');
  assert(port.evidence.length === 0);
});
