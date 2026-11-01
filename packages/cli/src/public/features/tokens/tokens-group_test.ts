import { assertEquals, assertStringIncludes } from '@std/assert';
import { MemoryFileSystemAdapter } from '../../../kernel/adapters/scaffold/memory-fs.ts';
import { createTokensCommand } from './tokens-group.ts';

Deno.test('tokens commands expose help and route app selection and flags through injected ports', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/app/deno.json', '{}');
  await fs.createDir('/app/routes');
  const selections: unknown[] = [];
  const builds: unknown[] = [];
  const messages: string[] = [];
  const command = createTokensCommand({
    fs,
    resolveUiAppRoot: (input) => {
      selections.push(input);
      return Promise.resolve('/app');
    },
    tokenEngine: {
      outputFiles: () => Promise.resolve([]),
      defaults: () =>
        Promise.resolve({
          preset: 'ns-one',
          presets: ['ns-one', 'studio-utility'],
          sources: {},
        }),
      build: (options) => {
        builds.push(options);
        return Promise.resolve({ preset: 'studio-utility', files: {} });
      },
    },
    print: (message) => messages.push(message),
  });
  command.getHelp({ colors: false });
  assertEquals(command.getCommands().map((entry) => entry.getName()), ['build', 'clean', 'init']);
  const build = command.getCommands()[0];
  assertStringIncludes(build.getHelp({ colors: false }), '--override');
  assertStringIncludes(command.getCommands()[2].getHelp({ colors: false }), '--force');
  await command.parse(['build', '--app', 'dashboard', '--preset', 'studio-utility']);
  assertEquals(selections, [{ projectRoot: undefined, app: 'dashboard' }]);
  assertEquals(builds, [{
    preset: 'studio-utility',
    sources: undefined,
    override: undefined,
    previews: undefined,
  }]);
  assertEquals(messages, ['Built 0 token assets for studio-utility.']);
});
