/** JSR scope and package that publishes the scaffold manifest JSON Schema. */
const SCAFFOLD_SCHEMA_PACKAGE = '@netscript/plugin';

/** Published file name of the scaffold manifest JSON Schema within the package. */
const SCAFFOLD_SCHEMA_FILE = 'scaffold.plugin.schema.json';

/**
 * Build the JSR URL of the `scaffold.plugin.json` JSON Schema for a given package version.
 *
 * The schema is published by `@netscript/plugin`, so a version-pinned JSR file URL lets a
 * userland-generated manifest reference an editor-validatable `$schema` that matches the exact
 * protocol version the plugin was scaffolded against.
 *
 * @param version The published `@netscript/plugin` version (for example `0.0.1-alpha.12`).
 * @returns The fully-qualified JSR URL of the scaffold manifest JSON Schema for that version.
 * @example
 * ```ts
 * import { scaffoldSchemaUrl } from '@netscript/plugin/scaffold';
 *
 * scaffoldSchemaUrl('0.0.1-alpha.12');
 * // "https://jsr.io/@netscript/plugin@0.0.1-alpha.12/scaffold.plugin.schema.json"
 * ```
 */
export function scaffoldSchemaUrl(version: string): string {
  return `https://jsr.io/${SCAFFOLD_SCHEMA_PACKAGE}@${version}/${SCAFFOLD_SCHEMA_FILE}`;
}
