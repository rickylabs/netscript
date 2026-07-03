/** Stable identifiers for the NetScript AI plugin.
 *
 * @module
 */

import denoJson from '../deno.json' with { type: 'json' };

/** Canonical plugin id used across the manifest, connector, and scaffolder. */
export const AI_PLUGIN_ID = '@netscript/plugin-ai' as const;

/** Runtime-config topic and generated userland workspace name for the plugin. */
export const AI_WORKSPACE_NAME = 'ai' as const;

/** Plugin package version, single-sourced from the package `deno.json`. */
export const AI_PLUGIN_VERSION: string = denoJson.version;

/** Literal type of the AI plugin id. */
export type AiPluginId = typeof AI_PLUGIN_ID;

/** Literal type of the AI workspace name. */
export type AiWorkspaceName = typeof AI_WORKSPACE_NAME;
