import { assertEquals } from '@std/assert';
import { CODEX_STATUS_PROCESS_TABLE_MARKER, parseCodexDaemonProbe } from './codex-status.ts';

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
