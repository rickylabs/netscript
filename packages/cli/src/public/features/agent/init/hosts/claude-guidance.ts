/** Add the root import and Claude routing instructions once, retaining existing content and its BOM. */
export function mergeClaudeGuidance(content: string, bootstrap: string): string {
  const bom = content.startsWith('\uFEFF') ? '\uFEFF' : '';
  const original = content.slice(bom.length);
  const newline = original.includes('\r\n') ? '\r\n' : '\n';
  const [importLine, ...routingLines] = bootstrap.trimEnd().split(/\r?\n/);
  const routing = routingLines.join(newline);
  let importEnd: number | undefined;
  let hasRouting = !routing;
  let fence: { readonly marker: string; readonly length: number } | undefined;
  for (const match of original.matchAll(/[^\r\n]*(?:\r\n|\n|$)/g)) {
    const line = match[0].replace(/\r?\n$/, '');
    const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (delimiter) {
      const marker = delimiter[1][0];
      const length = delimiter[1].length;
      if (!fence) fence = { marker, length };
      else if (marker === fence.marker && length >= fence.length && !delimiter[2].trim()) {
        fence = undefined;
      }
      continue;
    }
    if (fence) continue;
    if (importEnd === undefined && /^@(?:\.\/)?AGENTS\.md$/.test(line.trim())) {
      importEnd = match.index + match[0].length;
    }
    if (line.trim() === routing) hasRouting = true;
  }
  if (importEnd !== undefined) {
    if (hasRouting) return content;
    const before = original.slice(0, importEnd);
    const separator = before.endsWith('\n') ? '' : newline;
    return `${bom}${before}${separator}${routing}${newline}${original.slice(importEnd)}`;
  }
  const guidance = [importLine, ...(hasRouting ? [] : routingLines)].join(newline);
  return `${bom}${guidance}${newline}${original ? newline : ''}${original}`;
}
