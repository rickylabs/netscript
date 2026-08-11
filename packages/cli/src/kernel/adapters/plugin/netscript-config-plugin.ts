/** Insert a plugin module specifier into a generated `netscript.config.ts` source string. */
export function insertPluginSpecifier(source: string, quotedSpecifier: string): string {
  const inlinePluginsPattern = /plugins:\s*\[\s*\]/;
  if (inlinePluginsPattern.test(source)) {
    return source.replace(inlinePluginsPattern, `plugins: [${quotedSpecifier}]`);
  }

  const multilinePluginsPattern = /(plugins:\s*\[\s*)([\s\S]*?)(\s*\])/;
  const multilineMatch = source.match(multilinePluginsPattern);
  if (multilineMatch) {
    const rawBody = multilineMatch[2].replace(/\s*$/, '');
    const body = rawBody.trim();
    const separator = rawBody.trimEnd().endsWith(',') ? '' : ',';
    const nextBody = body.length === 0
      ? `\n    ${quotedSpecifier},`
      : `${rawBody}${separator}\n    ${quotedSpecifier},`;
    return source.replace(
      multilinePluginsPattern,
      `${multilineMatch[1]}${nextBody}${multilineMatch[3]}`,
    );
  }

  const databaseBlock = '  databases: {\n    config: [],\n  },';
  if (source.includes(databaseBlock)) {
    return source.replace(databaseBlock, `${databaseBlock}\n  plugins: [${quotedSpecifier}],`);
  }

  return source;
}

/** Read literal plugin module specifiers from a generated `netscript.config.ts` source string. */
export function extractPluginSpecifiers(source: string): readonly string[] {
  const pluginsPattern = /plugins:\s*\[([\s\S]*?)\]/;
  const body = source.match(pluginsPattern)?.[1];
  if (body === undefined) return [];

  return [...body.matchAll(/(['"])(.*?)\1/g)].map((match) => match[2]);
}

/** Remove exact plugin module specifiers from a generated `netscript.config.ts` source string. */
export function removePluginSpecifiers(
  source: string,
  specifiers: readonly string[],
): string {
  const pluginsPattern = /(plugins:\s*\[)([\s\S]*?)(\])/;
  const match = source.match(pluginsPattern);
  if (!match) return source;

  const targets = new Set(specifiers);
  const entries = match[2].match(/(['"])(.*?)\1\s*,?/g) ?? [];
  const retained = entries.filter((entry) => {
    const value = entry.match(/^(['"])(.*?)\1/)?.[2];
    return value === undefined || !targets.has(value);
  }).map((entry) => entry.replace(/\s*,?$/, ''));

  const body = retained.length === 0
    ? ''
    : `\n    ${retained.join(',\n    ')},\n  `;
  return source.replace(pluginsPattern, `${match[1]}${body}${match[3]}`);
}
