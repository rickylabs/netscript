import { assertEquals } from '@std/assert';
import {
  buildCmdCommand,
  buildDenoCommand,
  buildDotNetCommand,
  buildExecutableCommand,
  buildPowerShellCommand,
  buildPythonCommand,
  buildShellCommand,
} from '../../src/executor/adapters/mod.ts';
import type { ResolvedTaskExecutionOptions } from '../../src/executor/mod.ts';
import type { TaskDefinition } from '../../src/domain/mod.ts';

Deno.test('buildDenoCommand includes permissions, import map, and args', () => {
  const command = buildDenoCommand({
    task: taskFixture('deno', {
      importMapUrl: './import_map.json',
      permissions: {
        env: false,
        ffi: false,
        net: ['api.example.com'],
        read: true,
        run: false,
        write: false,
      },
    }),
    options: optionsFixture({ args: ['--verbose'] }),
    env: envFixture(),
    os: 'linux',
  });

  assertEquals(command.command, 'deno');
  assertEquals(command.args, [
    'run',
    '--allow-net=api.example.com',
    '--allow-read',
    '--import-map=./import_map.json',
    './task.ts',
    '--task',
    '--verbose',
  ]);
});

Deno.test('buildPythonCommand prefers virtual environment Python', () => {
  const command = buildPythonCommand({
    task: taskFixture('python', { metadata: { pythonConfig: { venvPath: '.venv' } } }),
    options: optionsFixture(),
    env: envFixture(),
    os: 'linux',
  });

  assertEquals(command.command, '.venv/bin/python');
  assertEquals(command.args, ['-u', './task.ts', '--task']);
});

Deno.test('buildDotNetCommand supports project mode and runtime args', () => {
  const command = buildDotNetCommand({
    task: taskFixture('dotnet', {
      entrypoint: './Worker.csproj',
      metadata: { dotnetConfig: { runtimeArgs: ['--framework', 'net10.0'], useDotnetRun: true } },
    }),
    options: optionsFixture({ args: ['--task-arg'] }),
    env: envFixture(),
    os: 'linux',
  });

  assertEquals(command.command, 'dotnet');
  assertEquals(command.args, [
    'run',
    '--project',
    './Worker.csproj',
    '--',
    '--framework',
    'net10.0',
    '--task',
    '--task-arg',
  ]);
});

Deno.test('buildShellCommand augments Git Bash PATH on Windows', () => {
  const command = buildShellCommand({
    task: taskFixture('shell', {
      metadata: {
        shellConfig: { loginShell: true, shell: 'C:\\Program Files\\Git\\usr\\bin\\bash.exe' },
      },
    }),
    options: optionsFixture({ env: { PATH: 'C:\\Windows\\System32' } }),
    env: envFixture(),
    os: 'windows',
  });

  assertEquals(command.command, 'C:\\Program Files\\Git\\usr\\bin\\bash.exe');
  assertEquals(command.args, ['-l', './task.ts', '--task']);
  assertEquals(command.env?.PATH.startsWith('C:\\Program Files\\Git\\usr\\bin;'), true);
});

Deno.test('buildPowerShellCommand uses pwsh off Windows', () => {
  const command = buildPowerShellCommand({
    task: taskFixture('powershell'),
    options: optionsFixture(),
    env: envFixture(),
    os: 'linux',
  });

  assertEquals(command.command, 'pwsh');
  assertEquals(command.args.slice(0, 6), [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    './task.ts',
  ]);
});

Deno.test('buildCmdCommand and buildExecutableCommand preserve task args', () => {
  const options = optionsFixture({ args: ['--more'] });

  assertEquals(
    buildCmdCommand({ task: taskFixture('cmd'), options, env: envFixture(), os: 'windows' }).args,
    ['/c', './task.ts', '--task', '--more'],
  );
  assertEquals(
    buildExecutableCommand({
      task: taskFixture('executable', { entrypoint: './worker' }),
      options,
      env: envFixture(),
      os: 'linux',
    }),
    { command: './worker', args: ['--task', '--more'] },
  );
});

function taskFixture(
  type: TaskDefinition['type'],
  overrides: Partial<TaskDefinition> = {},
): TaskDefinition {
  return {
    id: 'task.fixture' as TaskDefinition['id'],
    name: 'Fixture Task',
    type,
    entrypoint: './task.ts',
    topic: 'default',
    source: 'local',
    args: ['--task'],
    timeout: 300000,
    maxRetries: 1,
    priority: 50,
    enabled: true,
    tags: [],
    timezone: 'UTC',
    retryDelay: 1000,
    maxConcurrency: 1,
    persist: true,
    ...overrides,
  };
}

function optionsFixture(
  overrides: Partial<ResolvedTaskExecutionOptions> = {},
): ResolvedTaskExecutionOptions {
  return {
    args: [],
    cwd: '',
    env: {},
    timeout: 300000,
    ...overrides,
  };
}

function envFixture(values: Record<string, string> = {}): (name: string) => string | undefined {
  return (name) => values[name];
}
