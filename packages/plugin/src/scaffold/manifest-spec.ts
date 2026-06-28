import type {
  PluginManifestCapabilities,
  PluginManifestOfficialSource,
  PluginManifestPostScript,
  PluginManifestProvider,
  PluginManifestScaffolder,
} from '../protocol/mod.ts';
import { PLUGIN_MANIFEST_SCHEMA_VERSION } from '../protocol/mod.ts';
import { scaffoldSchemaUrl } from './schema-url.ts';

/** Data a plugin supplies to build its canonical `scaffold.plugin.json` manifest. */
export interface PluginScaffoldManifestSpec {
  /**
   * Optional caller-provided schema URL.
   *
   * Committed first-party manifests pass the repository-local relative schema path for editor
   * IntelliSense, while userland-generated manifests use the published JSR schema URL from
   * {@link scaffoldSchemaUrl} by default.
   */
  readonly schemaUrl?: string;
  /** Published plugin package name. */
  readonly name: string;
  /** Human-readable plugin name. */
  readonly displayName: string;
  /** Human-readable plugin description. */
  readonly description: string;
  /** Static capability summary used before plugin code executes. */
  readonly capabilities: PluginManifestCapabilities;
  /** Plugin-owned scaffold entrypoint metadata. */
  readonly scaffolder?: PluginManifestScaffolder;
  /** Optional plugin-owned scripts executed after a successful scaffold. */
  readonly postScripts?: readonly PluginManifestPostScript[];
  /** Existing provider metadata retained for first-party compatibility. */
  readonly provider?: PluginManifestProvider;
  /** Existing source metadata retained for first-party compatibility. */
  readonly officialSource?: PluginManifestOfficialSource;
}

/**
 * Build the canonical `scaffold.plugin.json` text for a plugin.
 *
 * The schema URL is caller-provided through `spec.schemaUrl`: repository-local committed manifests
 * can retain their relative `$schema`, and userland-generated manifests default to the JSR URL for
 * the supplied version.
 *
 * @param spec - Plugin-specific manifest data.
 * @param version - Published plugin and `@netscript/plugin` peer version.
 * @returns Pretty-printed manifest JSON with a trailing newline.
 *
 * @example
 * ```ts
 * import { buildScaffoldPluginJson } from "@netscript/plugin/scaffold";
 *
 * const json = buildScaffoldPluginJson({
 *   name: "@netscript/plugin-example",
 *   displayName: "Example",
 *   description: "Example plugin scaffold manifest.",
 *   capabilities: {
 *     hasDatabaseMigrations: false,
 *     hasRoutes: true,
 *     hasBackgroundWorkers: false,
 *   },
 * }, "0.0.1-alpha.12");
 * ```
 */
export function buildScaffoldPluginJson(
  spec: PluginScaffoldManifestSpec,
  version: string,
): string {
  const manifest = {
    $schema: spec.schemaUrl ?? scaffoldSchemaUrl(version),
    schemaVersion: PLUGIN_MANIFEST_SCHEMA_VERSION,
    name: spec.name,
    version,
    displayName: spec.displayName,
    description: spec.description,
    peerDependencies: {
      '@netscript/plugin': version,
    },
    capabilities: spec.capabilities,
    scaffolder: spec.scaffolder ?? standardScaffolder(),
    ...(spec.postScripts === undefined ? {} : { postScripts: spec.postScripts }),
    ...(spec.provider === undefined ? {} : { provider: spec.provider }),
    ...(spec.officialSource === undefined ? {} : { officialSource: spec.officialSource }),
  };

  return `${formatManifestJson(manifest)}\n`;
}

function standardScaffolder(): PluginManifestScaffolder {
  return {
    export: './scaffold',
    requiredPermissions: {
      net: [],
      read: ['<workspaceRoot>'],
      write: ['<workspaceRoot>'],
    },
  };
}

function formatManifestJson(value: unknown): string {
  return compactShortScalarArrays(JSON.stringify(value, null, 2));
}

function compactShortScalarArrays(json: string): string {
  const lines = json.split('\n');
  const output: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (!line.trimEnd().endsWith('[')) {
      output.push(line);
      continue;
    }

    const closeIndex = findScalarArrayClose(lines, index);
    if (closeIndex === undefined) {
      output.push(line);
      continue;
    }

    const closeLine = lines[closeIndex] ?? '';
    const suffix = closeLine.trimEnd().endsWith(',') ? ',' : '';
    const values = lines.slice(index + 1, closeIndex).map((valueLine) =>
      valueLine.trim().replace(/,$/, '')
    );
    const compactLine = `${line.trimEnd()}${values.join(', ')}]${suffix}`;

    if (compactLine.length <= 100) {
      output.push(compactLine);
      index = closeIndex;
      continue;
    }

    output.push(line);
  }

  return output.join('\n');
}

function findScalarArrayClose(lines: readonly string[], openIndex: number): number | undefined {
  for (let index = openIndex + 1; index < lines.length; index += 1) {
    const trimmed = lines[index]?.trim() ?? '';
    if (trimmed === ']' || trimmed === '],') {
      return index;
    }
    if (!isScalarJsonLine(trimmed)) {
      return undefined;
    }
  }
  return undefined;
}

function isScalarJsonLine(line: string): boolean {
  const value = line.replace(/,$/, '');
  return value === 'null' ||
    value === 'true' ||
    value === 'false' ||
    /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value) ||
    /^"(?:[^"\\]|\\.)*"$/.test(value);
}
