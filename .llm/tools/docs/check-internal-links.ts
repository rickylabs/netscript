/**
 * check-internal-links.ts — verify every internal `href` in a built docs site
 * resolves to an emitted page (or index directory), accounting for the site's
 * base path and validating fragment anchors (#anchor). Exits 1 and lists the
 * offenders when any internal link is unresolved.
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
  'jsr:',
  'npm:',
];

export interface CheckInternalLinksResult {
  internalLinkCount: number;
  htmlFilesCount: number;
  unresolved: Map<string, Set<string>>;
}

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

export async function checkInternalLinks(
  rootArg: string = 'docs/site/_site',
): Promise<CheckInternalLinksResult> {
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

  const pageAnchors = new Map<string, Set<string>>();
  const htmlContents = new Map<string, string>();

  for (const htmlFile of htmlFiles) {
    const html = await Deno.readTextFile(htmlFile);
    const sourcePath = toSitePath(htmlFile);
    htmlContents.set(sourcePath, html);
    pageAnchors.set(sourcePath, extractAnchors(html));
  }

  for (const htmlFile of htmlFiles) {
    const sourcePath = toSitePath(htmlFile);
    const html = htmlContents.get(sourcePath)!;

    const sourceDir = sourcePath.endsWith('/index.html')
      ? sourcePath.slice(0, -'index.html'.length)
      : sourcePath.slice(0, sourcePath.lastIndexOf('/') + 1) || '/';

    for (const href of hrefsIn(html)) {
      if (!isInternalLink(href)) {
        continue;
      }

      internalLinkCount++;

      const resolved = resolveInternalHref(href, sourcePath, sourceDir, basePath);
      if (!resolved) {
        addUnresolved(unresolved, sourcePath, href);
        continue;
      }

      const { filePath, directoryPath, targetSitePath, fragment } = resolved;

      const pageExists = hasExtension(targetSitePath)
        ? (emittedFiles.has(filePath) || emittedFiles.has(targetSitePath))
        : (indexDirectories.has(directoryPath) || emittedFiles.has(filePath) ||
          emittedFiles.has(targetSitePath));
      if (!pageExists) {
        addUnresolved(unresolved, sourcePath, href);
        continue;
      }

      if (fragment) {
        const htmlKey = emittedFiles.has(filePath)
          ? filePath
          : (emittedFiles.has(targetSitePath) ? targetSitePath : null);
        if (htmlKey && pageAnchors.has(htmlKey)) {
          const anchors = pageAnchors.get(htmlKey)!;
          let decodedFragment = fragment;
          try {
            decodedFragment = decodeURIComponent(fragment);
          } catch {
            // fallback if URI decoding fails
          }
          if (!anchors.has(fragment) && !anchors.has(decodedFragment)) {
            addUnresolved(unresolved, sourcePath, href);
          }
        }
      }
    }
  }

  return {
    internalLinkCount,
    htmlFilesCount: htmlFiles.length,
    unresolved,
  };
}

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    printHelp();
    Deno.exit(0);
  }

  const rootArg = Deno.args[0] ?? 'docs/site/_site';
  const result = await checkInternalLinks(rootArg);

  if (result.unresolved.size > 0) {
    console.error('Unresolved internal links:');
    for (
      const [source, hrefs] of [...result.unresolved.entries()].sort(([a], [b]) =>
        a.localeCompare(b)
      )
    ) {
      console.error(`  ${source}`);
      for (const href of [...hrefs].sort()) {
        console.error(`    - ${href}`);
      }
    }
    Deno.exit(1);
  }

  console.log(
    `${result.internalLinkCount} internal links across ${result.htmlFilesCount} pages — all resolve`,
  );
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

export function isInternalLink(href: string): boolean {
  const normalized = href.trim().toLowerCase();
  return normalized.length > 0 &&
    !href.startsWith('//') &&
    !skippedSchemes.some((scheme) => normalized.startsWith(scheme));
}

export function extractAnchors(html: string): Set<string> {
  const anchors = new Set<string>();
  const attributePattern = /\b(?:id|name)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi;
  let match: RegExpExecArray | null;
  while ((match = attributePattern.exec(html)) !== null) {
    const val = match[1] ?? match[2] ?? match[3];
    if (val) {
      anchors.add(val);
    }
  }
  return anchors;
}

export function resolveRelativePath(sourceDir: string, relativePath: string): string {
  const stack = sourceDir.split('/').filter(Boolean);
  const parts = relativePath.split('/');
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  const joined = stack.join('/');
  const trailingSlash =
    (relativePath.endsWith('/') || relativePath === '.' || relativePath.endsWith('/.')) ? '/' : '';
  return `/${joined}${trailingSlash}`;
}

export function resolveInternalHref(
  href: string,
  sourcePath: string,
  sourceDir: string,
  basePath: string,
):
  | { filePath: string; directoryPath: string; targetSitePath: string; fragment?: string }
  | undefined {
  const [pathAndQuery, fragment] = href.split('#', 2);
  let rawPath = pathAndQuery.split('?', 1)[0].trim();

  if (basePath !== '/' && (rawPath === basePath.slice(0, -1) || rawPath.startsWith(basePath))) {
    rawPath = rawPath === basePath.slice(0, -1) ? '/' : `/${rawPath.slice(basePath.length)}`;
  }

  let targetSitePath: string;
  if (rawPath === '') {
    targetSitePath = sourcePath;
  } else if (rawPath.startsWith('/')) {
    targetSitePath = rawPath;
  } else {
    targetSitePath = resolveRelativePath(sourceDir, rawPath);
  }

  if (targetSitePath === '/') {
    return { filePath: '/index.html', directoryPath: '/', targetSitePath, fragment };
  }

  if (targetSitePath.endsWith('/')) {
    return {
      filePath: `${targetSitePath}index.html`,
      directoryPath: targetSitePath,
      targetSitePath,
      fragment,
    };
  }

  if (hasExtension(targetSitePath)) {
    const directoryPath = targetSitePath.slice(0, targetSitePath.lastIndexOf('/') + 1) || '/';
    return { filePath: targetSitePath, directoryPath, targetSitePath, fragment };
  }

  return {
    filePath: `${targetSitePath}/index.html`,
    directoryPath: `${targetSitePath}/`,
    targetSitePath,
    fragment,
  };
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
