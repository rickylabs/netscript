import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { StaticCommandCatalog } from '../src/infrastructure/static-command-catalog.ts';
import {
  DEFAULT_CLI_COMMAND,
  SpawnCommandExecutor,
} from '../src/infrastructure/spawn-command-executor.ts';
import mcpPackageJson from '../deno.json' with { type: 'json' };

Deno.test('static catalog defaults to an explicit unwired descriptor', async () => {
  const commands = await new StaticCommandCatalog().listCommands();
  assertEquals(commands.length, 1);
  assertStringIncludes(commands[0]!.path, 'not wired');
});

Deno.test('spawn executor uses the published CLI prefix by default', () => {
  assertEquals(DEFAULT_CLI_COMMAND, [
    'deno',
    'run',
    '-A',
    `jsr:@netscript/cli@${mcpPackageJson.version}`,
  ]);
});

Deno.test('spawn executor captures a cheap real subprocess', async () => {
  const executor = new SpawnCommandExecutor({
    cliCommand: ['deno', 'eval', 'console.log(Deno.args.join("|"))'],
  });
  const result = await executor.execute({ path: ['db', 'status'], args: ['fixture'] });
  assertEquals(result.exitCode, 0);
  assertEquals(result.timedOut, false);
  assertStringIncludes(result.outputTail, 'db|status|fixture');
});

Deno.test('spawn executor bounds output to a tail', async () => {
  const executor = new SpawnCommandExecutor({
    cliCommand: ['deno', 'eval', 'console.log("x".repeat(5000))'],
    outputTailBytes: 64,
  });
  const result = await executor.execute({ path: [], args: [] });
  assert(result.truncated);
  assert(result.outputTail.length <= 64);
});

Deno.test('spawn executor terminates commands at the deadline', async () => {
  const executor = new SpawnCommandExecutor({
    cliCommand: ['deno', 'eval', 'await new Promise((resolve) => setTimeout(resolve, 5000))'],
    timeoutMs: 30,
  });
  const result = await executor.execute({ path: [], args: [] });
  assertEquals(result.exitCode, 124);
  assertEquals(result.timedOut, true);
  assertStringIncludes(result.outputTail, 'timed_out');
});
