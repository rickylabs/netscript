import { dirname } from '@std/path';

/**
 * check-caveat-refs.ts — verify every `<!-- caveat: … -->` marker in docs Markdown
 * references a resolvable target: a GitHub issue (`gh:#N`) or an existing
 * `arch-debt:<ID>` in `.llm/harness/debt/arch-debt.md`. Exits 1 and lists offenders
 * when any marker is unresolved.
 *
 * Perms: --allow-read (docs Markdown + arch-debt.md).
 *
 * Usage:
 *   deno run --allow-read .llm/tools/docs/check-caveat-refs.ts [docs-root]
 *   deno run --allow-read .llm/tools/docs/check-caveat-refs.ts --help
 *
 * docs-root defaults to the current directory.
 */

const markerPattern = /<!--\s*caveat\s*:\s*([\s\S]*?)-->/g;
const archDebtIdPattern = /`([^`]+)`/g;

function printHelp(): void {
  console.log(
    [
      'check-caveat-refs.ts — verify docs caveat markers reference resolvable targets',
      '',
      'Usage:',
      '  deno run --allow-read .llm/tools/docs/check-caveat-refs.ts [docs-root]',
      '',
      'Arguments:',
      '  docs-root   Markdown root to scan (default: current directory)',
      '  --help, -h  show this help',
      '',
      'Exit codes: 0 = all caveat markers resolve · 1 = one or more unresolved.',
    ].join('\n'),
  );
}

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    printHelp();
    Deno.exit(0);
  }

  const rootArg = Deno.args[0] ?? '.';
  const docsRoot = await absolutePath(rootArg);
  const docsRootPrefix = docsRoot.endsWith('/') ? docsRoot : `${docsRoot}/`;
  const archDebtPath = await findArchDebtPath(Deno.cwd());
  const archDebtIds = await readArchDebtIds(archDebtPath);
  const markdownFiles = await walkMarkdownFiles(docsRoot);

  const toDisplayPath = (file: string): string => {
    const relative = file.startsWith(docsRootPrefix) ? file.slice(docsRootPrefix.length) : file;
    return relative.replaceAll('\\', '/');
  };

  const unresolved = new Map<string, string[]>();
  let markerCount = 0;
  const pagesWithMarkers = new Set<string>();

  for (const file of markdownFiles) {
    const markdown = await Deno.readTextFile(file);
    const refs = caveatRefsIn(markdown);

    if (refs.length > 0) {
      pagesWithMarkers.add(toDisplayPath(file));
    }

    for (const ref of refs) {
      markerCount++;
      if (!resolves(ref, archDebtIds)) {
        addUnresolved(unresolved, toDisplayPath(file), ref);
      }
    }
  }

  if (unresolved.size > 0) {
    console.error('Unresolved caveat references:');
    for (const [file, refs] of [...unresolved.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      console.error(`  ${file}`);
      for (const ref of refs.toSorted()) {
        console.error(`    - ${ref}`);
      }
    }
    Deno.exit(1);
  }

  console.log(
    `${markerCount} caveat markers across ${pagesWithMarkers.size} pages — all references resolve`,
  );
}

async function absolutePath(path: string): Promise<string> {
  try {
    return await Deno.realPath(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`Docs source directory does not exist: ${path}`);
    }
    throw error;
  }
}

async function findArchDebtPath(startDir: string): Promise<string> {
  let current = await Deno.realPath(startDir);

  while (true) {
    const candidate = `${current}/.llm/harness/debt/arch-debt.md`;
    try {
      const stat = await Deno.stat(candidate);
      if (stat.isFile) {
        return candidate;
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }

    const parent = dirname(current);
    if (parent === current) {
      console.error(
        'Unable to locate .llm/harness/debt/arch-debt.md by walking up from the current directory.',
      );
      Deno.exit(2);
    }
    current = parent;
  }
}

async function readArchDebtIds(path: string): Promise<Set<string>> {
  const ids = new Set<string>();
  const archDebt = await Deno.readTextFile(path);

  for (const line of archDebt.split(/\r?\n/)) {
    if (!line.startsWith('#')) {
      continue;
    }

    let match: RegExpExecArray | null;
    archDebtIdPattern.lastIndex = 0;
    while ((match = archDebtIdPattern.exec(line)) !== null) {
      ids.add(match[1]);
    }
  }

  return ids;
}

async function walkMarkdownFiles(dir: string): Promise<string[]> {
  const found: string[] = [];

  for await (const entry of Deno.readDir(dir)) {
    if (entry.name === '_plan' || entry.name === 'reference') {
      continue;
    }

    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      found.push(...await walkMarkdownFiles(path));
    } else if (entry.isFile && entry.name.endsWith('.md')) {
      found.push(path);
    }
  }

  return found;
}

function caveatRefsIn(markdown: string): string[] {
  const refs: string[] = [];
  let match: RegExpExecArray | null;

  markerPattern.lastIndex = 0;
  while ((match = markerPattern.exec(markdown)) !== null) {
    refs.push(match[1].trim());
  }

  return refs;
}

function resolves(ref: string, archDebtIds: Set<string>): boolean {
  if (/^gh:#\d+$/.test(ref)) {
    return true;
  }

  if (ref.startsWith('arch-debt:')) {
    const id = ref.slice('arch-debt:'.length).trim();
    return id.length > 0 && archDebtIds.has(id);
  }

  return false;
}

function addUnresolved(unresolved: Map<string, string[]>, file: string, ref: string): void {
  const refs = unresolved.get(file) ?? [];
  refs.push(ref);
  unresolved.set(file, refs);
}
