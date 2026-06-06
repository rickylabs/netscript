import { resolve } from '@std/path';
import { discoverWorkspace, findMember, getMemberEntrypoint } from './mod.ts';

const projectRoot = resolve(import.meta.dirname ?? '.', '..', '..');

Deno.test('discoverWorkspace finds standardized project members', async () => {
  const workspace = await discoverWorkspace(projectRoot);

  const config = findMember(workspace, '@netscript/config');
  const sagas = findMember(workspace, '@netscript/plugin-sagas');
  const workers = findMember(workspace, '@netscript/plugin-workers');

  if (!config || config.path !== 'packages/config') {
    throw new Error('Expected @netscript/config workspace member at packages/config');
  }

  if (!sagas || sagas.path !== 'plugins/sagas') {
    throw new Error('Expected @netscript/plugin-sagas workspace member at plugins/sagas');
  }

  if (!workers || getMemberEntrypoint(workers) !== './mod.ts') {
    throw new Error('Expected @netscript/plugin-workers workspace member to export ./mod.ts');
  }
});
