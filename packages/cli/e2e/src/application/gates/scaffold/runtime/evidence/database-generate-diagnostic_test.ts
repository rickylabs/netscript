import { assertEquals } from '@std/assert';
import {
  databaseGenerateWithEvidence,
  reportedRestartFailure,
} from './database-generate-diagnostic.ts';

Deno.test('database generate diagnostic runs exactly the original command and preserves failure', async () => {
  const appHost = '/synthetic/project/aspire/apphost.mts';
  const text =
    `Database client generated, but web restart failed (Aspire exit 16). summary\nRun: aspire resource web restart --apphost ${
      JSON.stringify(appHost)
    }`;
  let runs = 0, collects = 0;
  const command = ['deno', 'run', 'cli.ts', 'db', 'generate'];
  const code = await databaseGenerateWithEvidence({
    command,
    appHost,
    run: (args) => {
      runs++;
      assertEquals(args, command);
      return Promise.resolve({ code: 1, stdout: 'stdout detail', stderr: text });
    },
    emit: async () => {},
    collect: (invocation) => {
      collects++;
      assertEquals(invocation.code, 1);
      assertEquals(invocation.process, 'database_cli');
      assertEquals(invocation.reportedRestart, { resource: 'web', exit: 16 });
      return Promise.reject(new Error('SECRET_COLLECTOR'));
    },
  });
  assertEquals(code, 1);
  assertEquals(runs, 1);
  assertEquals(collects, 1);
  assertEquals(reportedRestartFailure(text, '/foreign/apphost.mts'), undefined);
  assertEquals(reportedRestartFailure(text.replace('exit 16', 'exit 999'), appHost), undefined);
});
Deno.test('database generate diagnostic preserves success and does not invent a restart outcome', async () => {
  let collected = 0;
  const code = await databaseGenerateWithEvidence({
    command: ['deno'],
    appHost: '/synthetic/apphost.mts',
    run: () => Promise.resolve({ code: 0, stdout: 'success', stderr: '' }),
    emit: async () => {},
    collect: (invocation) => {
      collected++;
      assertEquals(invocation.reportedRestart, undefined);
      return Promise.resolve();
    },
  });
  assertEquals(code, 0);
  assertEquals(collected, 1);
});
