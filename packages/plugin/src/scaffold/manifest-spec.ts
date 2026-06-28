import { PLUGIN_MANIFEST_SCHEMA_VERSION } from '../protocol/mod.ts';
import type {
  PluginManifestCapabilities,
  PluginManifestOfficialSource,
  PluginManifestPostScript,
  PluginManifestProvider,
  PluginManifestScaffolder,
} from '../protocol/mod.ts';
import { formatManifestJson, type JsonValue, normalizeJson } from './json-format.ts';

/**
 * Version-independent specification of a plugin's `scaffold.plugin.json` manifest.
 *
 * A spec carries every field of the published installer manifest except the package `version` and
 * the `@netscript/plugin` peer-dependency range, which {@linkcode buildScaffoldPluginJson} injects
 * from the version argument. Keeping the spec version-free lets each plugin own a single typed data
 * value while the published manifest stays pinned to the build version.
 */
export interface PluginScaffoldManifestSpec {
  /** Published plugin package name (for example `@netscript/plugin-workers`). */
  readonly name: string;
  /** Human-readable plugin name. */
  readonly displayName: string;
  /** Human-readable plugin description. */
  readonly description: string;
  /** Additional peer-dependency ranges beyond the implicit `@netscript/plugin` entry. */
  readonly extraPeerDependencies?: Readonly<Record<string, string>>;
  /** Static capability summary used before plugin code executes. */
  readonly capabilities: PluginManifestCapabilities;
  /** Plugin-owned scaffold entrypoint metadata. */
  readonly scaffolder: PluginManifestScaffolder;
  /** Optional plugin-owned scripts executed after a successful scaffold. */
  readonly postScripts?: readonly PluginManifestPostScript[];
  /** Provider metadata retained for first-party compatibility. */
  readonly provider?: PluginManifestProvider;
  /** Source metadata retained for first-party compatibility. */
  readonly officialSource?: PluginManifestOfficialSource;
}

/**
 * Render a plugin's `scaffold.plugin.json` from its typed spec and the build version.
 *
 * The output is byte-identical to a `deno fmt`-formatted manifest: two-space indentation, objects
 * always on multiple lines, arrays collapsed onto a single line when they fit within a 100-column
 * line, and a trailing newline. Key order follows the published manifest contract
 * (`schemaVersion`, `name`, `version`, `displayName`, `description`, `peerDependencies`,
 * `capabilities`, `scaffolder`, optional `postScripts`, optional `provider`, optional
 * `officialSource`).
 *
 * @param spec The version-independent manifest specification for the plugin.
 * @param version The published package version applied to `version` and the `@netscript/plugin`
 *   peer-dependency range.
 * @returns The manifest JSON text, including the trailing newline.
 * @example
 * ```ts
 * import { buildScaffoldPluginJson } from '@netscript/plugin/scaffold';
 *
 * const json = buildScaffoldPluginJson(workersSpec, '0.0.1-alpha.12');
 * await Deno.writeTextFile('scaffold.plugin.json', json);
 * ```
 */
export function buildScaffoldPluginJson(
  spec: PluginScaffoldManifestSpec,
  version: string,
): string {
  const manifest: Record<string, JsonValue> = {
    schemaVersion: PLUGIN_MANIFEST_SCHEMA_VERSION,
    name: spec.name,
    version,
    displayName: spec.displayName,
    description: spec.description,
    peerDependencies: {
      '@netscript/plugin': version,
      ...(spec.extraPeerDependencies ?? {}),
    },
    capabilities: normalizeJson(spec.capabilities),
    scaffolder: normalizeJson(spec.scaffolder),
  };

  if (spec.postScripts !== undefined) {
    manifest.postScripts = normalizeJson(spec.postScripts);
  }
  if (spec.provider !== undefined) {
    manifest.provider = normalizeJson(spec.provider);
  }
  if (spec.officialSource !== undefined) {
    manifest.officialSource = normalizeJson(spec.officialSource);
  }

  return formatManifestJson(manifest);
}
