import { assertEquals } from '@std/assert';
import { ASPIRE_WORKFLOW_SKILLS } from '../../features/agent/init/aspire-agent-initializer.ts';
import {
  aspireAgentInitArgs,
  DenoAspireAgentInitializer,
} from './deno-aspire-agent-initializer.ts';

Deno.test('Aspire agent init selects only the four non-colliding workflow skills', () => {
  const args = aspireAgentInitArgs('/workspace/project');
  assertEquals(args, [
    'agent',
    'init',
    '--non-interactive',
    '--nologo',
    '--workspace-root',
    '/workspace/project',
    '--skill-locations',
    'standard,claudecode',
    '--skills',
    'aspire-init,aspire-orchestration,aspire-monitoring,aspire-deployment',
  ]);
  const selected = args[args.indexOf('--skills') + 1].split(',');
  assertEquals(selected, ASPIRE_WORKFLOW_SKILLS);
  assertEquals(selected.includes('aspire'), false);
  assertEquals(selected.includes('all'), false);
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
