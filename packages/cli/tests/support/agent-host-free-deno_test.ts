import { assertEquals } from '@std/assert';
import { agentHostFreeDenoArgs } from './agent-host-free-deno.ts';

Deno.test('test children strip every host marker family and retain unrelated environment', async () => {
  const markers = {
    CLAUDECODE: '1',
    OPENCODE: '1',
    OPENCODE_CONFIG_DIR: 'fixture',
    OPENCODE_FUTURE_MARKER: 'fixture',
    TERM_PROGRAM: 'vscode',
    ZED_TERM: 'true',
    VSCODE_PID: '1',
    VSCODE_FUTURE_MARKER: 'fixture',
    CURSOR_TRACE_ID: 'fixture',
    CURSOR_FUTURE_MARKER: 'fixture',
  };
  const result = await new Deno.Command(Deno.execPath(), {
    args: agentHostFreeDenoArgs([
      'eval',
      `console.log(JSON.stringify({
        detected: Object.keys(Deno.env.toObject()).filter((name) =>
          ['CLAUDECODE', 'OPENCODE', 'TERM_PROGRAM', 'ZED_TERM'].includes(name) ||
          /^(OPENCODE_|VSCODE_|CURSOR_)/.test(name)),
        retained: Deno.env.get('NETSCRIPT_TEST_RETAINED')
      }));`,
    ]),
    env: { ...markers, NETSCRIPT_TEST_RETAINED: 'retained' },
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
  assertEquals(JSON.parse(new TextDecoder().decode(result.stdout)), {
    detected: [],
    retained: 'retained',
  });
});

Deno.test('test child runner preserves failure exit codes', async () => {
  const result = await new Deno.Command(Deno.execPath(), {
    args: agentHostFreeDenoArgs(['eval', 'Deno.exit(7)']),
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 7);
});
