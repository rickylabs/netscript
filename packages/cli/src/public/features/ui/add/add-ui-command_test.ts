import { assertStringIncludes } from 'jsr:@std/assert@^1';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { createUiAddCommand } from './add-ui-command.ts';

Deno.test('ui:add help explains the page island query-loader triad', () => {
  const command = createUiAddCommand({
    installDependencies: { fs: new DenoFileSystem() },
    resolveUiAppRoot: () => Promise.resolve('/workspace'),
  });
  const help = command.getHelp().replace(/\s+/g, ' ');

  assertStringIncludes(
    help,
    'Creates one data-screen unit: typed page route + colocated hydrating island + query loader.',
  );
  assertStringIncludes(help, 'Use it when a route will load data and hydrate an interactive region.');
  assertStringIncludes(
    help,
    'Use a registry item when the route already exists and you only need an app-owned component',
  );
});
