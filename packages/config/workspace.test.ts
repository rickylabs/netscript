import { resolve } from '@std/path';
import { discoverWorkspace, findMember, getMemberEntrypoint } from './mod.ts';

const projectRoot = resolve(import.meta.dirname ?? '.', '..', '..');

Deno.test('discoverWorkspace finds standardized project members', async () => {
  const workspace = await discoverWorkspace(projectRoot);

  const sagas = findMember(workspace, '@test-app/sagas');
  const triggers = findMember(workspace, '@test-app/triggers');
  const plugins = findMember(workspace, '@netscript/plugins');

  if (!sagas || sagas.path !== 'sagas') {
    throw new Error('Expected @test-app/sagas workspace member at sagas/');
  }

  if (!triggers || triggers.path !== 'triggers') {
    throw new Error('Expected @test-app/triggers workspace member at triggers/');
  }

  if (!plugins || getMemberEntrypoint(plugins) !== './registry.ts') {
    throw new Error('Expected @netscript/plugins workspace member to export ./registry.ts');
  }
});
