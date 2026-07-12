/** Synchronize generated AI registries after a resource mutation. */

import { artifactText } from '@netscript/plugin/adapter';
import { LocalProjectFiles } from '@netscript/plugin/cli';
import type { PluginCommandContext } from '@netscript/plugin/adapter';
import { barrelScaffolder, DEFAULT_BARREL_INPUT } from '../adapter/resources/mod.ts';
import { AI_AGENTS_TARGET, AI_TOOLS_TARGET, compileAiRegistry } from './ai-registry-compiler.ts';

/** Rebuild tool/agent registries and the app AI composition root. */
export async function syncAiProject(context: PluginCommandContext): Promise<void> {
  const files = new LocalProjectFiles(context.workspaceRoot);
  await compileAiRegistry(files, AI_TOOLS_TARGET);
  await compileAiRegistry(files, AI_AGENTS_TARGET);
  const [barrel] = barrelScaffolder.emit(DEFAULT_BARREL_INPUT);
  await files.writeTextFile(barrel.path, artifactText(barrel));
}
