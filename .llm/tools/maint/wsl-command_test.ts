import { assert, assertEquals } from '@std/assert';
import { buildWslCommand } from './wsl-command.ts';

Deno.test('buildWslCommand selects local bash argv on Linux', () => {
  assertEquals(
    buildWslCommand('codex', 'echo ok', { os: 'linux', currentUser: 'codex' }),
    { bin: 'bash', args: ['-lc', 'echo ok'], cwd: undefined },
  );
});
Deno.test('buildWslCommand preserves Windows wsl.exe argv', () => {
  assertEquals(
    buildWslCommand('codex', 'echo ok', { os: 'windows', currentUser: 'someone-else' }),
    { bin: 'wsl.exe', args: ['-u', 'codex', '--', 'bash', '-lc', 'echo ok'] },
  );
});
Deno.test('buildWslCommand maps cwd locally and to Windows --cd', () => {
  assertEquals(
    buildWslCommand('codex', 'pwd', {
      os: 'linux',
      currentUser: 'codex',
      cwd: '/home/codex/repo',
    }),
    { bin: 'bash', args: ['-lc', 'pwd'], cwd: '/home/codex/repo' },
  );
  assertEquals(
    buildWslCommand('codex', 'pwd', { os: 'windows', cwd: '/home/codex/repo' }),
    {
      bin: 'wsl.exe',
      args: ['-u', 'codex', '--cd', '/home/codex/repo', '--', 'bash', '-lc', 'pwd'],
    },
  );
});
Deno.test('buildWslCommand rejects a local requested-user mismatch', () => {
  let message = '';
  try {
    buildWslCommand('codex', 'true', { os: 'linux', currentUser: 'alice' });
  } catch (error) {
    message = (error as Error).message;
  }
  assert(message.includes('requested user "codex"'), message);
  assert(message.includes('current Linux user is "alice"'), message);
});
