import { assertEquals } from '@std/assert';
import {
  aspireAgentInitArgs,
  DenoAspireAgentInitializer,
} from './deno-aspire-agent-initializer.ts';

Deno.test('Aspire 17.0.0 agent init passes non-interactive workspace-root flags without removed 13.5 options', () => {
  const args = aspireAgentInitArgs('/workspace/project');
  assertEquals(args, [
    'agent',
    'init',
    '--non-interactive',
    '--nologo',
    '--workspace-root',
    '/workspace/project',
  ]);
  assertEquals(args.includes('--skill-locations'), false);
  assertEquals(args.includes('--skills'), false);
});

for (const override of [undefined, '', '/toolchain/pinned aspire']) {
  Deno.test(`Aspire agent init resolves ${override === undefined ? 'unset' : override || 'empty'} executable`, async () => {
    const prior = Deno.env.get('NETSCRIPT_ASPIRE_CLI');
    const commands: Array<{ command: string | URL; options?: Deno.CommandOptions }> = [];
    const OriginalCommand = Deno.Command;
    Deno.Command = class extends OriginalCommand {
      constructor(command: string | URL, options?: Deno.CommandOptions) {
        commands.push({ command, options });
        super(Deno.execPath(), { args: ['eval', ''] });
      }
      override output(): Promise<Deno.CommandOutput> {
        return Promise.resolve({
          code: 0,
          success: true,
          signal: null,
          stdout: new Uint8Array(),
          stderr: new Uint8Array(),
        });
      }
    };
    try {
      if (override === undefined) Deno.env.delete('NETSCRIPT_ASPIRE_CLI');
      else Deno.env.set('NETSCRIPT_ASPIRE_CLI', override);
      const signal = new AbortController().signal;
      assertEquals(
        await new DenoAspireAgentInitializer().initialize('/workspace/project', signal),
        {
          ok: true,
        },
      );
      assertEquals(commands[0].command, override || 'aspire');
      assertEquals(commands[0].options?.args, aspireAgentInitArgs('/workspace/project'));
      assertEquals(commands[0].options?.signal, signal);
      assertEquals(commands.length, 1);
    } finally {
      Deno.Command = OriginalCommand;
      if (prior === undefined) Deno.env.delete('NETSCRIPT_ASPIRE_CLI');
      else Deno.env.set('NETSCRIPT_ASPIRE_CLI', prior);
    }
  });
}
