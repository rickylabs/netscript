import { assertEquals } from '@std/assert';
import {
  buildCodexStatusSession,
  CODEX_STATUS_PROCESS_TABLE_MARKER,
  parseCodexDaemonProbe,
} from './codex-status.ts';

const home = '/home/codex';
const wrapper = `4182 4179 bash -lc export PATH="$HOME/.local/bin:$PATH"; ` +
  `echo "VERSION=$(codex app-server daemon version 2>/dev/null | head -n1)"; ` +
  `echo "${CODEX_STATUS_PROCESS_TABLE_MARKER}"; ps -eo pid=,ppid=,args= 2>/dev/null`;

Deno.test('Codex status reports zero when the process table has no real app-server', () => {
  const result = parseCodexDaemonProbe(
    `VERSION=codex-cli 0.150.0\n${CODEX_STATUS_PROCESS_TABLE_MARKER}\n${wrapper}\n`,
    home,
  );
  assertEquals(result, {
    version: 'codex-cli 0.150.0',
    appServerProcesses: 0,
    anchoredAppServerProcesses: 0,
  });
});

Deno.test('Codex status ignores its wrapper shell and counts the anchored app-server', () => {
  const anchored = `1258642 1 ${home}/.codex/packages/standalone/current/codex ` +
    'app-server --remote-control --listen unix://';
  const result = parseCodexDaemonProbe(
    `VERSION=codex-cli 0.150.0\n${CODEX_STATUS_PROCESS_TABLE_MARKER}\n` +
      `${anchored}\n${wrapper}\n`,
    home,
  );
  assertEquals(result, {
    version: 'codex-cli 0.150.0',
    appServerProcesses: 1,
    anchoredAppServerProcesses: 1,
  });
});

Deno.test('Codex status reports unanchored app-servers without claiming ownership', () => {
  const unanchored = '1258643 1 /opt/codex/bin/codex app-server --listen unix:///tmp/codex.sock';
  const result = parseCodexDaemonProbe(
    `VERSION=codex-cli 0.150.0\n${CODEX_STATUS_PROCESS_TABLE_MARKER}\n` +
      `${unanchored}\n${wrapper}\n`,
    home,
  );
  assertEquals(result, {
    version: 'codex-cli 0.150.0',
    appServerProcesses: 1,
    anchoredAppServerProcesses: 0,
  });
});

Deno.test('Codex status reports dirty rollout file evidence ahead of the branch commit', () => {
  const rollout = [
    JSON.stringify({ type: 'session_meta', payload: { id: 'thread-1', cwd: '/repo' } }),
    JSON.stringify({
      timestamp: '2026-08-05T12:00:00.000Z',
      type: 'event_msg',
      payload: { type: 'task_started' },
    }),
    JSON.stringify({
      timestamp: '2026-08-05T12:00:01.000Z',
      type: 'event_msg',
      payload: { type: 'patch_apply_end', changes: { '/repo/live.ts': { type: 'add' } } },
    }),
  ].join('\n');
  const session = buildCodexStatusSession(
    rollout,
    '/sessions/rollout-thread-1.jsonl',
    new Date('2026-08-05T12:00:02.000Z'),
    300_000,
    new Date('2026-08-05T12:00:01.000Z'),
    { dirty: true, commit: 'abc123 prior commit' },
  );
  assertEquals(session.state, 'working');
  assertEquals(session.cwd, '/repo');
  assertEquals(session.lastArtifact, { kind: 'file-write', value: '/repo/live.ts' });
});

Deno.test('Codex status reports the branch commit for a clean worktree', () => {
  const session = buildCodexStatusSession(
    '',
    '/sessions/rollout-thread-1.jsonl',
    new Date('2026-08-05T12:00:02.000Z'),
    300_000,
    new Date('2026-08-05T12:00:01.000Z'),
    { dirty: false, commit: 'abc123 latest commit' },
  );
  assertEquals(session.lastArtifact, { kind: 'commit', value: 'abc123 latest commit' });
});
