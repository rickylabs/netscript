type PlaceholderAllowance = {
  readonly token: string;
  readonly maxOccurrences: number;
  readonly reason: string;
};

const DOCUMENTED_PLACEHOLDER_ALLOWANCES: Readonly<Record<string, readonly PlaceholderAllowance[]>> =
  {
    'reference/cli/index.html': [
      {
        token: '{{var}}',
        maxOccurrences: 1,
        reason: 'documents the scaffold string-template syntax',
      },
      {
        token: '{{var | pipe}}',
        maxOccurrences: 3,
        reason: 'documents the scaffold string-template pipe syntax',
      },
    ],
  };

async function collectHtmlFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(root)) {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory) files.push(...await collectHtmlFiles(path));
    else if (entry.isFile && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

export async function assertNoLiteralVentoPlaceholders(siteRoot: string): Promise<{
  filesScanned: number;
  allowancesUsed: number;
}> {
  const files = await collectHtmlFiles(siteRoot);
  const failures: string[] = [];
  let allowancesUsed = 0;

  for (const path of files) {
    const relativePath = path.slice(siteRoot.length + 1).replaceAll('\\', '/');
    const allowances = DOCUMENTED_PLACEHOLDER_ALLOWANCES[relativePath] ?? [];
    const allowanceCounts = new Map<string, number>();
    const html = await Deno.readTextFile(path);

    for (const match of html.matchAll(/\{\{[^{}]*\}\}/g)) {
      const token = match[0];
      const allowance = allowances.find((entry) => entry.token === token);
      const used = allowanceCounts.get(token) ?? 0;
      if (allowance && used < allowance.maxOccurrences) {
        allowanceCounts.set(token, used + 1);
        allowancesUsed++;
        continue;
      }
      failures.push(`${relativePath}: ${token}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Rendered pages leak literal Vento placeholders:\n${failures.join('\n')}`);
  }

  return { filesScanned: files.length, allowancesUsed };
}
