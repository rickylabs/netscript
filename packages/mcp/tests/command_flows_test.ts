import { assert, assertEquals } from '@std/assert';
import { createExecuteCommandFlow } from '../src/application/flows/execute-command-flow.ts';
import { createListCommandsFlow } from '../src/application/flows/list-commands-flow.ts';
import type { CommandExecutorPort } from '../src/domain/command-executor-port.ts';
import { decideCommand, DEFAULT_COMMAND_POLICY } from '../src/domain/command-policy.ts';

Deno.test('default command policy is deny-wins with default deny', () => {
  const cases: Array<[string[], boolean, string]> = [
    [['db', 'migrate'], true, 'allow_db_migrate'],
    [['plugin', 'install'], true, 'allow_plugin_install'],
    [['plugin', 'doctor'], true, 'allow_plugin_doctor'],
    [['service', 'status'], false, 'default_deny'],
    [['plugin', 'add'], false, 'default_deny'],
    [['ui'], false, 'default_deny'],
    [['ui:list'], true, 'allow_ui_list'],
    [['ui:update'], true, 'allow_ui_update'],
    [['ui:remove'], false, 'deny_ui_remove'],
    [['db', 'reset'], false, 'deny_db_reset'],
    [['deploy'], false, 'deny_deploy'],
    [['unknown'], false, 'default_deny'],
  ];
  for (const [path, allowed, rule] of cases) {
    assertEquals(decideCommand(DEFAULT_COMMAND_POLICY, path), { allowed, rule });
  }
  assertEquals(
    decideCommand({
      allow: [{ name: 'broad', prefix: ['db'] }],
      deny: [{ name: 'specific', prefix: ['db', 'reset'] }],
    }, ['db', 'reset']),
    { allowed: false, rule: 'specific' },
  );
});

Deno.test('execute command allows plugin install supplied through command args', async () => {
  const calls: Array<{ readonly path: readonly string[]; readonly args: readonly string[] }> = [];
  const executor: CommandExecutorPort = {
    execute: (input) => {
      calls.push(input);
      return Promise.resolve({
        exitCode: 0,
        durationMs: 1,
        outputTail: '',
        truncated: false,
        timedOut: false,
      });
    },
  };

  const result = await createExecuteCommandFlow(executor)({
    command: 'plugin',
    args: ['install', 'workers'],
  });

  assert(result.ok);
  assertEquals(calls, [{ path: ['plugin'], args: ['install', 'workers'] }]);
});

Deno.test('list commands filters and limits dynamic catalog results', async () => {
  const flow = createListCommandsFlow({
    listCommands: () =>
      Promise.resolve([
        { path: 'db migrate', description: 'Apply migrations', usage: '[--project-root PATH]' },
        { path: 'plugin list', description: 'List plugins', usage: '' },
        { path: 'db status', description: 'Show database status', usage: '' },
      ]),
  });
  const result = await flow({ filter: 'db', limit: 1 });
  assert(result.ok);
  assertEquals(result.value, {
    count: 1,
    commands: [{
      path: 'db migrate',
      description: 'Apply migrations',
      usage: '[--project-root PATH]',
    }],
  });
});

Deno.test('execute command rejects denied paths before calling executor', async () => {
  let called = false;
  const executor: CommandExecutorPort = {
    execute: () => {
      called = true;
      return Promise.resolve({
        exitCode: 0,
        durationMs: 1,
        outputTail: '',
        truncated: false,
        timedOut: false,
      });
    },
  };
  const result = await createExecuteCommandFlow(executor)({ command: 'db reset', args: [] });
  assert(!result.ok);
  assertEquals(result.error.code, 'command_denied');
  assertEquals(result.error.status, 'deny_db_reset');
  assertEquals(called, false);
});
