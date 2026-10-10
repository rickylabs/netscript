/** Add the root guidance import once, preserving the existing Claude instructions verbatim. */
export function mergeClaudeGuidance(content: string, bootstrap: string): string {
  let fence: { readonly marker: string; readonly length: number } | undefined;
  for (const line of content.split(/\r?\n/)) {
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
    if (!fence && line.trim() === '@AGENTS.md') return content;
  }
  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  return `${bootstrap.trimEnd()}${newline}${content ? newline : ''}${content}`;
}
