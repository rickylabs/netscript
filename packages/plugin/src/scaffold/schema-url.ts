/**
 * Build the published JSON Schema URL for scaffold plugin manifests.
 *
 * @param version - Published `@netscript/plugin` version containing the schema asset.
 * @returns JSR asset URL for the scaffold plugin manifest schema.
 */
export function scaffoldSchemaUrl(version: string): string {
  return `https://jsr.io/@netscript/plugin/${version}/schema/scaffold.plugin.schema.json`;
}
