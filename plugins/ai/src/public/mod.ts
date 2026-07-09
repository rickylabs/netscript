/**
 * @module @netscript/plugin-ai/public
 *
 * Public plugin manifest and constants for the NetScript AI plugin.
 *
 * The AI plugin is intentionally **thin**: it owns no runtime AI logic. The
 * engine lives in `@netscript/ai` and the durable-chat runtime in
 * `@netscript/fresh/ai`; this manifest only declares the plugin's contribution
 * axes (its `ai` runtime-config topic and the `/v1/ai` contract version) and its
 * scaffolder, which emits app-owned userland glue that imports those installed
 * dependencies directly.
 *
 * @example Load the plugin manifest
 * ```ts
 * import { aiPlugin } from "@netscript/plugin-ai";
 *
 * console.log(aiPlugin.name); // "@netscript/plugin-ai"
 * ```
 */

import { definePlugin, type PluginManifest } from '@netscript/plugin';
import { AI_PLUGIN_ID, AI_PLUGIN_VERSION, AI_WORKSPACE_NAME } from '../constants.ts';

export type { PluginManifest } from '@netscript/plugin';

/**
 * Host permissions the scaffolded in-process AI chat route needs at runtime:
 * `--allow-net` to reach the model provider, `--allow-env` to read provider API
 * keys, and `--allow-read` for durable-session materialization.
 */
const AI_RUNTIME_PERMISSIONS = ['--allow-net', '--allow-env', '--allow-read'] as const;

const aiManifest: PluginManifest = definePlugin(AI_PLUGIN_ID, AI_PLUGIN_VERSION)
  .withDisplayName('AI Chat')
  .withType('utility')
  .withDescription(
    'Thin connector and scaffolder wiring an app-owned, in-process AI chat, tool, and agent surface onto @netscript/ai.',
  )
  .withAuthor('NetScript Team')
  .withLicense('Apache-2.0')
  .withTags(['ai', 'chat', 'agent', 'tools', 'llm', 'streaming'])
  .withPermissions(AI_RUNTIME_PERMISSIONS)
  .withContractVersions([{ version: 'v1', loader: './contracts/v1/mod.ts' }])
  .withRuntimeConfigTopics([{ name: AI_WORKSPACE_NAME }])
  .withHooks({
    setup: (ctx): void => {
      ctx.logger.info('AI plugin loaded', {
        pluginRoot: ctx.pluginRoot ?? '',
        projectRoot: ctx.projectRoot,
        isDev: ctx.isDev ?? false,
      });
    },
    teardown: (ctx): void => {
      ctx.logger.info('AI plugin unloaded');
    },
  })
  .withMetadata({
    repository: 'https://github.com/rickylabs/netscript-start',
    documentation: 'https://netscript.dev/plugins/ai',
    features: [
      'In-process AI chat route (no gateway hop)',
      'Durable chat sessions via @netscript/fresh/ai',
      'Standard-Schema AI tools',
      'Bounded, cancellable agent loop',
      'App-owned thread persistence (opt-in)',
    ],
    requirements: {
      deno: '>=2.0.0',
      netscript: '>=1.0.0',
    },
  })
  .build();

/** Plugin manifest for the NetScript AI plugin. */
export const aiPlugin: PluginManifest = aiManifest;

/**
 * Typed handle to the AI plugin manifest. Mirrors `workersPlugin` /
 * `WorkersPluginManifest`: a named alias consumers can annotate a host plugin
 * list with without importing the full builder surface.
 */
export type AiPluginManifest = PluginManifest;

export {
  AI_PLUGIN_ID,
  AI_PLUGIN_VERSION,
  AI_WORKSPACE_NAME,
  type AiPluginId,
  type AiWorkspaceName,
} from '../constants.ts';
