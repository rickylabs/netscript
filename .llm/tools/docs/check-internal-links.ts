/**
 * check-internal-links.ts — verify every internal `href` in a built docs site
 * resolves to an emitted page (or index directory), accounting for the site's
 * base path. Exits 1 and lists the offenders when any internal link is unresolved.
 *
 * Perms: --allow-read (the built-site directory + `_config.ts`).
 *
 * Usage:
 *   deno run --allow-read .llm/tools/docs/check-internal-links.ts [site-root]
 *   deno run --allow-read .llm/tools/docs/check-internal-links.ts --help
 *
 * site-root defaults to `docs/site/_site`.
 */

const htmlHrefPattern = /\bhref\s*=\s*["']([^"']+)["']/gi;
const skippedSchemes = [
  'http://',
  'https://',
  'mailto:',
  'tel:',
  'javascript:',
];

function printHelp(): void {
  console.log(
    [
      'check-internal-links.ts — verify internal links in a built docs site resolve',
      '',
      'Usage:',
      '  deno run --allow-read .llm/tools/docs/check-internal-links.ts [site-root]',
      '',
      'Arguments:',
      '  site-root   built-site directory to scan (default: docs/site/_site)',
      '  --help, -h  show this help',
      '',
      'Exit codes: 0 = all internal links resolve · 1 = one or more unresolved.',
    ].join('\n'),
  );
}

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    printHelp();
    Deno.exit(0);
  }

  const rootArg = Deno.args[0] ?? 'docs/site/_site';
  const siteRoot = await absolutePath(rootArg);
  const siteRootPrefix = siteRoot.endsWith('/') ? siteRoot : `${siteRoot}/`;

  const files = await walkFiles(siteRoot);
  const emittedFiles = new Set<string>();
  const indexDirectories = new Set<string>();
  const htmlFiles: string[] = [];

  const toSitePath = (file: string): string => {
    if (file === siteRoot) {
      return '/';
    }
    const relative = file.startsWith(siteRootPrefix) ? file.slice(siteRootPrefix.length) : file;
    return `/${relative.replaceAll('\\', '/')}`;
  };

  for (const file of files) {
    const sitePath = toSitePath(file);
    emittedFiles.add(sitePath);

    if (sitePath.endsWith('/index.html')) {
      indexDirectories.add(sitePath.slice(0, -'index.html'.length));
    }

    if (sitePath.endsWith('.html')) {
      htmlFiles.push(file);
    }
  }

  const basePath = await detectBasePath(siteRoot, htmlFiles, emittedFiles, indexDirectories);
  const unresolved = new Map<string, Set<string>>();
  let internalLinkCount = 0;

  for (const htmlFile of htmlFiles) {
    const html = await Deno.readTextFile(htmlFile);
    const source = toSitePath(htmlFile);

    for (const href of hrefsIn(html)) {
      if (!isInternalLink(href)) {
        continue;
      }

      internalLinkCount++;

      const resolved = resolveInternalHref(href, basePath);
      if (!resolved) {
        addUnresolved(unresolved, source, href);
        continue;
      }

      if (!emittedFiles.has(resolved.filePath) && !indexDirectories.has(resolved.directoryPath)) {
        addUnresolved(unresolved, source, href);
      }
    }
  }

  if (unresolved.size > 0) {
    console.error('Unresolved internal links:');
    for (
      const [source, hrefs] of [...unresolved.entries()].sort(([a], [b]) => a.localeCompare(b))
    ) {
      console.error(`  ${source}`);
      for (const href of [...hrefs].sort()) {
        console.error(`    - ${href}`);
      }
    }
    Deno.exit(1);
  }

  console.log(`${internalLinkCount} internal links across ${htmlFiles.length} pages — all resolve`);
}

async function absolutePath(path: string): Promise<string> {
  try {
    return await Deno.realPath(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`Built-site directory does not exist: ${path}`);
    }
    throw error;
  }
}

async function walkFiles(dir: string): Promise<string[]> {
  const found: string[] = [];

  for await (const entry of Deno.readDir(dir)) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      found.push(...await walkFiles(path));
    } else if (entry.isFile) {
      found.push(path);
    }
  }

  return found;
}

function hrefsIn(html: string): string[] {
  const hrefs: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = htmlHrefPattern.exec(html)) !== null) {
    hrefs.push(match[1]);
  }

  return hrefs;
}

function isInternalLink(href: string): boolean {
  const normalized = href.trim().toLowerCase();
  return href.startsWith('/') &&
    !href.startsWith('//') &&
    !normalized.startsWith('#') &&
    !skippedSchemes.some((scheme) => normalized.startsWith(scheme));
}

function resolveInternalHref(
  href: string,
  basePath: string,
): { filePath: string; directoryPath: string } | undefined {
  let path = href.split('#', 1)[0].split('?', 1)[0];

  if (basePath !== '/' && (path === basePath.slice(0, -1) || path.startsWith(basePath))) {
    path = path === basePath.slice(0, -1) ? '/' : `/${path.slice(basePath.length)}`;
  }

  if (!path.startsWith('/')) {
    return undefined;
  }

  if (path === '/') {
    return { filePath: '/index.html', directoryPath: '/' };
  }

  if (path.endsWith('/')) {
    return { filePath: `${path}index.html`, directoryPath: path };
  }

  if (hasExtension(path)) {
    const directoryPath = path.slice(0, path.lastIndexOf('/') + 1) || '/';
    return { filePath: path, directoryPath };
  }

  return { filePath: `${path}/index.html`, directoryPath: `${path}/` };
}

function hasExtension(path: string): boolean {
  const lastSegment = path.slice(path.lastIndexOf('/') + 1);
  return /\.[^./]+$/.test(lastSegment);
}

function addUnresolved(unresolved: Map<string, Set<string>>, source: string, href: string): void {
  const hrefs = unresolved.get(source) ?? new Set<string>();
  hrefs.add(href);
  unresolved.set(source, hrefs);
}

async function detectBasePath(
  root: string,
  htmlFiles: string[],
  emittedFiles: Set<string>,
  indexDirectories: Set<string>,
): Promise<string> {
  const configBasePath = await basePathFromConfig(root);
  if (configBasePath) {
    return configBasePath;
  }

  const firstSegments = new Map<string, number>();
  for (const htmlFile of htmlFiles) {
    const html = await Deno.readTextFile(htmlFile);
    for (const href of hrefsIn(html)) {
      if (!isInternalLink(href)) {
        continue;
      }

      const path = href.split('#', 1)[0].split('?', 1)[0];
      const segment = path.split('/').filter(Boolean)[0];
      if (segment) {
        firstSegments.set(segment, (firstSegments.get(segment) ?? 0) + 1);
      }
    }
  }

  const likely = [...firstSegments.entries()]
    .filter(([segment]) =>
      !indexDirectories.has(`/${segment}/`) && !emittedFiles.has(`/${segment}`)
    )
    .sort(([, a], [, b]) => b - a)[0]?.[0];

  return likely ? `/${likely}/` : '/';
}

async function basePathFromConfig(root: string): Promise<string | undefined> {
  const configPath = `${root.replace(/\/_site\/?$/, '')}/_config.ts`;

  try {
    const config = await Deno.readTextFile(configPath);
    const locationMatch = config.match(/location:\s*new URL\(["']([^"']+)["']\)/);
    if (!locationMatch) {
      return undefined;
    }

    const pathname = new URL(locationMatch[1]).pathname;
    return pathname === '/' ? '/' : ensureSlashPath(pathname);
  } catch {
    return undefined;
  }
}

function ensureSlashPath(path: string): string {
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}
