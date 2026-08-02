import { assertEquals } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';

import { createGeneratePluginRegistriesCommand } from './generate-plugin-registries-command.ts';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';

describe('generate plugin registries command', () => {
  it('runs the authoritative generator for the resolved project root', async () => {
    const calls: Array<{ dryRun: boolean; projectRoot: string }> = [];
    const output: string[] = [];
    const command = createGeneratePluginRegistriesCommand({
      resolveProjectRoot: (root) => Promise.resolve(root),
      walker: { walk: () => Promise.resolve([]) },
      extractor: { extract: () => Promise.resolve([]) },
      emitter: { emit: () => Promise.resolve([]) },
      fs: new MemoryFileSystemAdapter(),
      generate: (input) => {
        calls.push(input);
        return Promise.resolve([
          { path: '.netscript/generated/plugin-example/registry.ts', plugin: 'example', registrableItems: 2 },
        ]);
      },
      print: (message) => output.push(message),
    });

    await command.parse(['--project-root', '/workspace/app', '--verbose']);

    assertEquals(calls, [{ dryRun: false, projectRoot: '/workspace/app' }]);
    assertEquals(output, [
      'Plugin registry generation complete: 1 written.',
      '.netscript/generated/plugin-example/registry.ts',
    ]);
  });
});
