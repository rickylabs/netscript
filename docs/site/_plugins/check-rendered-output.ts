import { DOMParser } from 'lume/deps/dom.ts';

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

export async function assertRenderedHomepage(path: string): Promise<void> {
  const html = await Deno.readTextFile(path);
  const document = new DOMParser().parseFromString(html, 'text/html');
  if (!document) throw new Error(`Could not parse rendered homepage: ${path}`);

  const headings = [...document.querySelectorAll('main h2')].map((heading) =>
    heading.textContent.trim()
  );
  for (const expected of ['One definition, carried end to end', 'Where to go']) {
    if (!headings.includes(expected)) {
      throw new Error(`Rendered homepage is missing semantic h2: ${expected}`);
    }
  }
  const mainText = document.querySelector('main')?.textContent ?? '';
  if (['## One definition', '## Where to go'].some((marker) => mainText.includes(marker))) {
    throw new Error('Rendered homepage leaks a literal Markdown heading marker');
  }

  const destinations = document.querySelectorAll('nav.ns-destination-list li > a');
  if (destinations.length !== 5) {
    throw new Error(
      `Rendered homepage expected 5 semantic destination items, found ${destinations.length}`,
    );
  }
}

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

if (import.meta.main) {
  const homepagePath = Deno.args[0] ?? '_site/index.html';
  await assertRenderedHomepage(homepagePath);
  const separator = Math.max(homepagePath.lastIndexOf('/'), homepagePath.lastIndexOf('\\'));
  const siteRoot = separator === -1 ? '.' : homepagePath.slice(0, separator);
  const result = await assertNoLiteralVentoPlaceholders(siteRoot);
  console.log(
    `Rendered output: OK (homepage semantics; ${result.filesScanned} HTML files; ` +
      `${result.allowancesUsed} documented-syntax allowances)`,
  );
}
