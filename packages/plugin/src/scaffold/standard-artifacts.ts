import type { ScaffoldArtifact } from './artifact.ts';

/** Standard root artifacts every generated plugin scaffold emits first. */
export interface StandardScaffoldArtifactsSpec {
  /** Kebab-case plugin directory name under `plugins/`. */
  readonly pluginName: string;
  /** Rendered `scaffold.plugin.json` content. */
  readonly manifestJson: string;
  /** Rendered generated-package `deno.json` content. */
  readonly denoJson: string;
  /** Rendered generated-package `mod.ts` content. */
  readonly modTs: string;
}

/**
 * Build the standard first artifacts for generated plugin packages.
 *
 * @param spec - Plugin-specific rendered content for the standard root files.
 * @returns Artifacts for `scaffold.plugin.json`, `deno.json`, and `mod.ts` in stable order.
 *
 * @example
 * ```ts
 * import { buildStandardScaffoldArtifacts } from "@netscript/plugin/scaffold";
 *
 * const artifacts = buildStandardScaffoldArtifacts({
 *   pluginName: "example",
 *   manifestJson: "{}\n",
 *   denoJson: "{}\n",
 *   modTs: "export {};\n",
 * });
 * ```
 */
export function buildStandardScaffoldArtifacts(
  spec: StandardScaffoldArtifactsSpec,
): readonly ScaffoldArtifact[] {
  const pluginRoot = `plugins/${spec.pluginName}`;
  return [
    {
      path: `${pluginRoot}/scaffold.plugin.json`,
      content: spec.manifestJson,
    },
    {
      path: `${pluginRoot}/deno.json`,
      content: spec.denoJson,
    },
    {
      path: `${pluginRoot}/mod.ts`,
      content: spec.modTs,
    },
  ];
}
