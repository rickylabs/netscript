import { assertEquals } from '@std/assert';
import { AspirePsDashboardReader } from '../src/infrastructure/aspire-ps-dashboard-reader.ts';

const S2_ASPIRE_PS = `[
  {
    "appHostPath": "/workspace/aspire/apphost.mts",
    "appHostPid": 996807,
    "status": "running",
    "sdkVersion": "13.5.3",
    "cliPid": 996784,
    "dashboardUrl": "https://localhost:42501",
    "logFilePath": "/home/codex/.aspire/logs/cli_REDACTED.log"
  }
]`;

Deno.test('Aspire ps reader extracts the running AppHost dashboardUrl from the S2 shape', () => {
  const calls: string[][] = [];
  const reader = new AspirePsDashboardReader({
    appHostPath: '/workspace/aspire/apphost.mts',
    execute: (_command, args) => {
      calls.push([...args]);
      return { code: 0, stdout: `Aspire CLI\n${S2_ASPIRE_PS}`, stderr: '' };
    },
    realPath: (path) => path,
  });

  assertEquals(reader.readDashboardUrl(), 'https://localhost:42501');
  assertEquals(calls, [[
    'ps',
    '--format',
    'Json',
    '--nologo',
    '--non-interactive',
  ]]);
});

Deno.test('Aspire ps reader treats the authoritative empty array as unavailable', () => {
  const reader = new AspirePsDashboardReader({
    execute: () => ({ code: 0, stdout: '[]\n', stderr: '' }),
  });
  assertEquals(reader.readDashboardUrl(), undefined);
});
