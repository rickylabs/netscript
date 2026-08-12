import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { toFileUrl } from '@std/path/to-file-url';
import { resolveRegisteredPluginSource } from './registered-plugin-source.ts';

Deno.test('registered plugin source classifies explicit filesystem contracts as local', () => {
  const projectRoot = '/workspace/project';
  const source = resolveRegisteredPluginSource(projectRoot, './plugins/workers/mod.ts');
  assertEquals(source, {
    kind: 'local-workdir',
    configuredSpecifier: './plugins/workers/mod.ts',
    resolvedSpecifier: toFileUrl(join(projectRoot, 'plugins/workers/mod.ts')).href,
    workdir: 'plugins/workers',
    rootDir: join(projectRoot, 'plugins/workers'),
  });
});

Deno.test('registered plugin source classifies package contracts without consulting the filesystem', () => {
  const source = resolveRegisteredPluginSource(
    '/workspace/project',
    'jsr:@netscript/plugin-workers@0.0.5',
  );
  assertEquals(source, {
    kind: 'package',
    configuredSpecifier: 'jsr:@netscript/plugin-workers@0.0.5',
    resolvedSpecifier: 'jsr:@netscript/plugin-workers@0.0.5',
  });
});
