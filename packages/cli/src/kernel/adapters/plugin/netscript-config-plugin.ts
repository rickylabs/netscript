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
