/** Package operands and placeholders rejected by the public `plugin update <name>` surface. */
const PLUGIN_UPDATE_PACKAGE_EXAMPLE =
  /\bnetscript\s+plugin\s+update\s+["']?(?:@|jsr:|<(?:pkg|package|specifier)>)/g;

/** Guard inline, HTML-table and fenced CLI examples against the installed-name update contract. */
export function checkCliExamples(source: string, sourcePath: string): void {
  const normalized = source.replaceAll('\r\n', '\n').replaceAll('\r', '\n')
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"').replaceAll('&#39;', "'");
  for (const match of normalized.matchAll(PLUGIN_UPDATE_PACKAGE_EXAMPLE)) {
    const line = normalized.slice(0, match.index).split('\n').length;
    throw new Error(
      `${sourcePath}:${line}: plugin update requires an installed plugin name, not a package specifier; use netscript plugin update workers (see netscript plugin update --help)`,
    );
  }
}
