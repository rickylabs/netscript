import { assertEquals } from '@std/assert';
import { DenoAspireCommandExecutor } from './aspire-command-executor.ts';

for (const override of [undefined, '', '/toolchain/pinned aspire']) {
  Deno.test(`Aspire database output and spawn resolve ${override === undefined ? 'unset' : override || 'empty'} executable`, async () => {
    const prior = Deno.env.get('NETSCRIPT_ASPIRE_CLI');
    const commands: Array<{ command: string | URL; options?: Deno.CommandOptions }> = [];
    const OriginalCommand = Deno.Command;
    Deno.Command = class extends OriginalCommand {
      constructor(command: string | URL, options?: Deno.CommandOptions) {
        commands.push({ command, options });
        super(Deno.execPath(), { args: ['eval', ''], stdout: 'null', stderr: 'null' });
      }
      override output(): Promise<Deno.CommandOutput> {
        return Promise.resolve({
          code: 0,
          success: true,
          signal: null,
          stdout: new TextEncoder().encode('output'),
          stderr: new Uint8Array(),
        });
      }
    };
    try {
      if (override === undefined) Deno.env.delete('NETSCRIPT_ASPIRE_CLI');
      else Deno.env.set('NETSCRIPT_ASPIRE_CLI', override);
      const executor = new DenoAspireCommandExecutor();
      const signal = new AbortController().signal;
      assertEquals(await executor.output(['describe'], { cwd: '.', signal }), {
        code: 0,
        stdout: 'output',
        stderr: '',
      });
      assertEquals(await executor.spawn(['start'], { cwd: '.', signal }), 0);
      assertEquals(commands.map((entry) => entry.command), [
        override || 'aspire',
        override || 'aspire',
      ]);
      assertEquals(commands.map((entry) => entry.options?.args), [['describe'], ['start']]);
      assertEquals(commands.every((entry) => entry.options?.signal === signal), true);
      await executor.output(['ps'], { cwd: '.', env: { NETSCRIPT_ASPIRE_CLI: '/project/aspire' } });
      assertEquals(commands[2].command, '/project/aspire');
      assertEquals(commands.length, 3);
    } finally {
      Deno.Command = OriginalCommand;
      if (prior === undefined) Deno.env.delete('NETSCRIPT_ASPIRE_CLI');
      else Deno.env.set('NETSCRIPT_ASPIRE_CLI', prior);
    }
  });
}
