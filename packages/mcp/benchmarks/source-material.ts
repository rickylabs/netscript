/** Independent benchmark inventory: deliberately does not import the production extractor. */
export interface SourceMaterial {
  readonly fences: readonly string[];
  readonly commands: readonly string[];
  readonly keys: readonly string[];
  readonly links: readonly string[];
}

/** Inventory exact fenced spans, CLI lines, config lines and Markdown/URL links in source. */
export function inventorySourceMaterial(source: string): SourceMaterial {
  const fences: string[] = [];
  const commands: string[] = [];
  const keys: string[] = [];
  let opened: { marker: string; start: number } | undefined;
  let offset = 0;
  for (const line of source.split(/(?<=\n)/)) {
    const trimmed = line.trim();
    const fence = /^(?:`{3,}|~{3,})/.exec(trimmed)?.[0];
    if (opened) {
      if (
        fence && fence[0] === opened.marker[0] && fence.length >= opened.marker.length &&
        !trimmed.slice(fence.length)
      ) {
        fences.push(source.slice(opened.start, offset + line.length));
        opened = undefined;
      }
    } else if (fence) {
      opened = { marker: fence, start: offset };
    }
    if (
      /^(?:\$\s+\S|(?:deno|netscript|npm|npx|pnpm|yarn|bun|docker|git|curl|aspire)\s+\S)/.test(
        trimmed,
      )
    ) {
      commands.push(line);
    }
    if (
      /^[\w.-]+\s*(?:=\s*\S|:\s*(?:["'[{]|https?:\/\/|true\b|false\b|null\b|[-+]?\d))/.test(trimmed)
    ) {
      keys.push(line);
    }
    offset += line.length;
  }
  if (opened) fences.push(source.slice(opened.start));
  const links = [...source.matchAll(/\[[^\]\n]+\]\([^\n]+?\)|https?:\/\/[^\s<>]+/g)].map((match) =>
    match[0]
  );
  return { fences, commands, keys, links };
}

/** Count retained occurrences, so one repeated snippet cannot stand in for several omitted copies. */
export function countRetainedMaterial(items: readonly string[], content: string): number {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  let retained = 0;
  for (const [item, expected] of counts) {
    let offset = 0;
    for (let found = 0; found < expected; found++) {
      const index = content.indexOf(item, offset);
      if (index < 0) break;
      retained++;
      offset = index + item.length;
    }
  }
  return retained;
}
