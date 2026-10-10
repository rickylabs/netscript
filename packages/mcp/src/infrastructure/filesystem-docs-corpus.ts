import { extname, relative, resolve, SEPARATOR } from '@std/path';
import {
  type DocsCorpusPort,
  DocsCorpusUnavailableError,
  type DocsDocument,
  DocsDocumentTooLargeError,
  type DocsSearchMatch,
  type DocsSection,
  type DocsSummary,
  MAX_INDEXED_DOC_LENGTH,
  normalizeDocsSlug,
  slugifyDocsHeading,
} from '../domain/docs/docs-corpus-port.ts';
import { docSourceBlocks } from '../domain/docs/faithful-extraction.ts';
import { GuidanceIndex } from '../domain/docs/guidance-index.ts';
import type { GuidanceResult } from '../domain/docs/guidance-contract.ts';

const EXCLUDED_DIRECTORIES = new Set(['_plan', '_data', '_components', '_includes']);

interface CachedSource {
  readonly mtime: number;
  readonly source: string;
}

/** Options for a filesystem-backed public documentation corpus. */
export interface FilesystemDocsCorpusOptions {
  /** Absolute or working-directory-relative root containing public Markdown. */
  readonly root: string;
  /** Source admission ceiling; oversized documents are rejected individually, never truncated. */
  readonly maxDocumentLength?: number;
}

/** Raw Markdown source input prior to alias resolution. */
export interface RawDocsSource {
  readonly slug: string;
  readonly source: string;
}

/** Result of indexing and alias resolution across docs sources. */
export interface DocsCorpusIndexedState {
  readonly documents: Map<string, DocsDocument>;
  readonly aliases: Map<string, string>;
  readonly rejected: Map<string, DocsDocumentTooLargeError>;
}

/** Lazily index a public Markdown tree with per-file mtime reuse. */
export class FilesystemDocsCorpus implements DocsCorpusPort {
  readonly #root: string;
  readonly #maxDocumentLength: number;
  #cache = new Map<string, CachedSource>();
  #documents = new Map<string, DocsDocument>();
  #aliases = new Map<string, string>();
  #rejected = new Map<string, DocsDocumentTooLargeError>();
  #guidance = new GuidanceIndex([]);
  #fingerprint: string | undefined;

  /** Configure a corpus rooted at a public Markdown directory. */
  constructor(options: FilesystemDocsCorpusOptions) {
    this.#root = resolve(options.root);
    this.#maxDocumentLength = options.maxDocumentLength ?? MAX_INDEXED_DOC_LENGTH;
  }

  /** List current public document summaries in stable slug order. */
  async list(): Promise<readonly DocsSummary[]> {
    await this.#refresh();
    return [...this.#documents.values()].map(toSummary).sort((a, b) =>
      a.slug.localeCompare(b.slug)
    );
  }

  /** Capture complete indexed documents after one refresh for offline batch consumers. */
  async snapshot(): Promise<readonly DocsDocument[]> {
    await this.#refresh();
    return [...this.#documents.values()];
  }

  /** Rank current public documents using weighted lexical matches. */
  async search(query: string): Promise<readonly DocsSearchMatch[]> {
    await this.#refresh();
    const terms = tokenize(query);
    if (terms.length === 0) return [];
    return [...this.#documents.values()].map((document) => rankDocument(document, terms))
      .filter((match): match is DocsSearchMatch => match !== undefined)
      .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
  }

  /** Retrieve the current public document matching a normalized slug or alias. */
  async get(slug: string): Promise<DocsDocument | undefined> {
    await this.#refresh();
    const normalized = normalizeDocsSlug(slug);
    const canonicalSlug = this.#aliases.get(normalized) ?? normalized;
    const rejection = this.#rejected.get(canonicalSlug);
    if (rejection) throw rejection;
    const document = this.#documents.get(canonicalSlug);
    if (!document) return undefined;
    if (canonicalSlug !== normalized) {
      return { ...document, redirectedFrom: normalized };
    }
    return document;
  }

  /** Resolve current section-level guidance through the shared index. */
  async findGuidance(intent: string): Promise<GuidanceResult> {
    await this.#refresh();
    return this.#guidance.find(intent);
  }

  async #refresh(): Promise<void> {
    let rootReal: string;
    try {
      rootReal = await Deno.realPath(this.#root);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new DocsCorpusUnavailableError(this.#root);
      }
      throw error;
    }
    const seen = new Set<string>();
    const sources: RawDocsSource[] = [];
    const versions: string[] = [];
    const oversized = new Map<string, DocsDocumentTooLargeError>();
    for await (const path of walkDocsSources(rootReal)) {
      const relativePath = relative(rootReal, path);
      if (!isPublicDocsSource(relativePath) || !isPublicDocsPath(relativePath)) continue;
      const realPath = await Deno.realPath(path);
      if (!isWithinRoot(rootReal, realPath)) continue;
      seen.add(realPath);
      const stat = await Deno.stat(realPath);
      const slug = docsSlugFromPath(relativePath);
      const mtime = stat.mtime?.getTime() ?? 0;
      versions.push(`${slug}\0${realPath}\0${mtime}\0${stat.size}`);
      if (stat.size > this.#maxDocumentLength * 4) {
        oversized.set(slug, new DocsDocumentTooLargeError(slug, this.#maxDocumentLength));
        this.#cache.delete(realPath);
        continue;
      }
      let cached = this.#cache.get(realPath);
      if (!cached || cached.mtime !== mtime) {
        const source = await Deno.readTextFile(realPath);
        cached = { mtime, source };
        this.#cache.set(realPath, cached);
      }
      sources.push({ slug, source: cached.source });
    }
    for (const path of this.#cache.keys()) if (!seen.has(path)) this.#cache.delete(path);
    if (sources.length === 0 && oversized.size === 0) {
      throw new DocsCorpusUnavailableError(this.#root);
    }
    // Re-index only when a source was added, removed, renamed, or modified: parsing documents and
    // building the guidance index (IDF table, link graph) is per corpus load, not per request.
    const fingerprint = versions.join('\n');
    if (fingerprint === this.#fingerprint) return;
    const { documents, aliases, rejected } = processDocsSources(
      sources,
      this.#maxDocumentLength,
      oversized,
    );
    if (documents.size === 0 && rejected.size === 0) {
      throw new DocsCorpusUnavailableError(this.#root);
    }
    this.#documents = documents;
    this.#aliases = aliases;
    this.#rejected = rejected;
    this.#guidance = new GuidanceIndex(documents.values());
    this.#fingerprint = fingerprint;
  }
}

async function* walkDocsSources(directory: string): AsyncGenerator<string> {
  const entries = [];
  for await (const entry of Deno.readDir(directory)) entries.push(entry);
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.name.startsWith('_')) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory) {
      if (!EXCLUDED_DIRECTORIES.has(entry.name)) yield* walkDocsSources(path);
    } else if (
      (entry.isFile || entry.isSymlink) &&
      ['.md', '.txt'].includes(extname(entry.name).toLowerCase())
    ) {
      yield path;
    }
  }
}

/** Return whether a root can be indexed by the same policy used by the filesystem adapter. */
export function isIndexableDocsRoot(root: string): boolean {
  let rootReal: string;
  try {
    rootReal = Deno.realPathSync(resolve(root));
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
  const sources: RawDocsSource[] = [];
  for (const path of walkDocsSourcesSync(rootReal)) {
    const relativePath = relative(rootReal, path);
    if (!isPublicDocsSource(relativePath) || !isPublicDocsPath(relativePath)) continue;
    const realPath = Deno.realPathSync(path);
    if (!isWithinRoot(rootReal, realPath)) continue;
    if (Deno.statSync(realPath).size > MAX_INDEXED_DOC_LENGTH * 4) continue;
    sources.push({
      slug: docsSlugFromPath(relativePath),
      source: Deno.readTextFileSync(realPath),
    });
  }
  if (sources.length === 0) return false;
  try {
    return processDocsSources(sources).documents.size > 0;
  } catch {
    return false;
  }
}

function* walkDocsSourcesSync(directory: string): Generator<string> {
  const entries = [...Deno.readDirSync(directory)].sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.name.startsWith('_')) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory) {
      if (!EXCLUDED_DIRECTORIES.has(entry.name)) yield* walkDocsSourcesSync(path);
    } else if (
      (entry.isFile || entry.isSymlink) &&
      ['.md', '.txt'].includes(extname(entry.name).toLowerCase())
    ) {
      yield path;
    }
  }
}

/** Process raw docs sources into canonical documents and resolved alias mappings. */
export function processDocsSources(
  sources: readonly RawDocsSource[],
  maxDocumentLength: number = MAX_INDEXED_DOC_LENGTH,
  rejectedSources: ReadonlyMap<string, DocsDocumentTooLargeError> = new Map(),
): DocsCorpusIndexedState {
  const documents = new Map<string, DocsDocument>();
  const rawAliases = new Map<string, string>();
  const rejected = new Map(rejectedSources);

  for (const entry of sources) {
    const rawSlug = normalizeDocsSlug(entry.slug);
    if (entry.source.length > maxDocumentLength) {
      rejected.set(rawSlug, new DocsDocumentTooLargeError(rawSlug, maxDocumentLength));
      continue;
    }
    const fm = parseFrontMatter(entry.source);

    if (fm.layout === 'layouts/redirect.vto' || (fm.redirectTo && !fm.body.trim())) {
      if (fm.redirectTo) {
        const targetSlug = normalizeDocsSlug(fm.redirectTo);
        if (rawAliases.has(rawSlug) && rawAliases.get(rawSlug) !== targetSlug) {
          throw new Error(
            `Duplicate docs alias: '${rawSlug}' maps to both '${
              rawAliases.get(rawSlug)
            }' and '${targetSlug}'`,
          );
        }
        rawAliases.set(rawSlug, targetSlug);
      }
      continue;
    }

    const document = parseMarkdownDocument(rawSlug, entry.source, maxDocumentLength);
    documents.set(document.slug, document);

    if (fm.oldUrl) {
      const aliasSlug = normalizeDocsSlug(fm.oldUrl);
      if (rawAliases.has(aliasSlug) && rawAliases.get(aliasSlug) !== document.slug) {
        throw new Error(
          `Duplicate docs alias: '${aliasSlug}' maps to both '${
            rawAliases.get(aliasSlug)
          }' and '${document.slug}'`,
        );
      }
      rawAliases.set(aliasSlug, document.slug);
    }
  }

  for (const [aliasSlug] of rawAliases) {
    if (documents.has(aliasSlug)) {
      throw new Error(`Docs alias '${aliasSlug}' conflicts with canonical document`);
    }
  }

  const resolvedAliases = new Map<string, string>();
  for (const [aliasSlug, initialTarget] of rawAliases) {
    let current = initialTarget;
    const visited = [aliasSlug];
    while (rawAliases.has(current)) {
      if (visited.includes(current)) {
        throw new Error(`Docs alias cycle detected: ${[...visited, current].join(' -> ')}`);
      }
      visited.push(current);
      current = rawAliases.get(current)!;
    }
    if (documents.has(current) || rejected.has(current)) {
      resolvedAliases.set(aliasSlug, current);
    }
  }

  return { documents, aliases: resolvedAliases, rejected };
}

/** Parse one Markdown source into the shared docs document contract. */
export function parseMarkdownDocument(
  slug: string,
  source: string,
  maxLength: number,
): DocsDocument {
  const { attributes, body } = parseFrontMatter(source);
  if (source.length > maxLength) {
    throw new DocsDocumentTooLargeError(normalizeDocsSlug(slug), maxLength);
  }
  const content = body;
  const sections = parseSections(content);
  const firstHeading = sections.find((section) => section.level === 1)?.heading;
  const title = attributes.title || firstHeading || titleFromSlug(slug);
  const description = oneLine(attributes.description || firstParagraph(content));
  return {
    slug,
    title,
    description,
    content,
    sections: sections.map(({ heading, level, slug: sectionSlug }) => ({
      heading,
      level,
      slug: sectionSlug,
    })),
    sectionContents: sections,
  };
}

/** Parsed front matter metadata. */
export interface ParsedFrontMatter {
  readonly attributes: Record<string, string>;
  readonly body: string;
  readonly layout?: string;
  readonly redirectTo?: string;
  readonly oldUrl?: string;
}

/** Parse YAML front matter at the top of a Markdown source file. */
export function parseFrontMatter(source: string): ParsedFrontMatter {
  if (!source.startsWith('---\n') && !source.startsWith('---\r\n')) {
    return { attributes: {}, body: source };
  }
  const match = /^---\r?\n([\s\S]*?)^---(?:\r?\n|$)/m.exec(source);
  if (!match) return { attributes: {}, body: source };
  const lines = match[1]!.split(/\r?\n/);
  const attributes: Record<string, string> = {};
  for (const line of lines) {
    const match = /^([a-zA-Z0-9_-]+):\s*(.*)$/.exec(line);
    if (match?.[1] && match[2] !== undefined) attributes[match[1]] = unquote(match[2].trim());
  }
  return {
    attributes,
    body: source.slice(match[0].length),
    layout: attributes['layout'],
    redirectTo: attributes['redirectTo'],
    oldUrl: attributes['oldUrl'],
  };
}

function parseSections(content: string): DocsSection[] {
  const headings: Array<
    { heading: string; slug: string; level: number; start: number; end: number }
  > = [];
  const stack: number[] = [];
  let offset = 0;
  for (const block of docSourceBlocks(content)) {
    const start = content.indexOf(block.text, offset);
    offset = start + block.text.length;
    if (block.fenced) continue;
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(block.text.trimEnd());
    if (!match) continue;
    const level = match[1]!.length;
    while (stack.length && headings[stack.at(-1)!]!.level >= level) {
      headings[stack.pop()!]!.end = start;
    }
    const heading = match[2]!.trim();
    headings.push({
      heading,
      slug: slugifyDocsHeading(heading),
      level,
      start: offset,
      end: content.length,
    });
    stack.push(headings.length - 1);
  }
  return headings.map(({ heading, slug, level, start, end }) => ({
    heading,
    slug,
    level,
    content: content.slice(start, end).trim(),
  }));
}

/** Rank one parsed document against normalized lexical search terms. */
export function rankDocument(
  document: DocsDocument,
  terms: readonly string[],
): DocsSearchMatch | undefined {
  const title = document.title.toLocaleLowerCase();
  const headings = document.sections.map((section) => section.heading).join(' ')
    .toLocaleLowerCase();
  const body = document.content.toLocaleLowerCase();
  let score = 0;
  for (const term of terms) {
    score += occurrences(title, term) * 12;
    score += occurrences(headings, term) * 5;
    score += occurrences(body, term);
  }
  if (score === 0) return undefined;
  const firstTerm = terms.find((term) => body.includes(term)) ??
    terms.find((term) => headings.includes(term)) ??
    terms.find((term) => title.includes(term));
  return {
    slug: document.slug,
    title: document.title,
    snippet: snippet(document.content, firstTerm),
    score,
  };
}

/** Normalize a free-text docs query into unique lexical terms. */
export function tokenize(value: string): string[] {
  return [...new Set(value.toLocaleLowerCase().match(/[\p{Letter}\p{Number}]+/gu) ?? [])];
}

function occurrences(haystack: string, needle: string): number {
  let count = 0;
  let offset = 0;
  while ((offset = haystack.indexOf(needle, offset)) >= 0) {
    count++;
    offset += needle.length;
  }
  return count;
}

function snippet(content: string, term?: string): string {
  if (!content) return '';
  const index = term ? content.toLocaleLowerCase().indexOf(term.toLocaleLowerCase()) : -1;
  const startPos = index >= 0 ? index : 0;
  const termLen = (term && index >= 0) ? term.length : 0;
  const start = Math.max(0, startPos - 80);
  const end = Math.min(content.length, startPos + termLen + 120);
  return `${start > 0 ? '…' : ''}${oneLine(content.slice(start, end))}${
    end < content.length ? '…' : ''
  }`;
}

/** Convert a public docs source path into its shared canonical slug. */
export function docsSlugFromPath(path: string): string {
  return normalizeDocsSlug(path.split(SEPARATOR).join('/'));
}

/** Admit public Markdown plus exactly the root task-router file `llms.txt`. */
export function isPublicDocsSource(relativePath: string): boolean {
  const normalized = relativePath.split(SEPARATOR).join('/');
  return extname(normalized).toLocaleLowerCase() === '.md' || normalized === 'llms.txt';
}

function titleFromSlug(slug: string): string {
  const segment = slug.split('/').at(-1) ?? slug;
  return segment.split(/[-_]/).map((part) => part ? part[0]!.toUpperCase() + part.slice(1) : '')
    .join(' ');
}

function firstParagraph(content: string): string {
  return content.split(/\n\s*\n/).find((paragraph) => !paragraph.trimStart().startsWith('#')) ?? '';
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function unquote(value: string): string {
  const quote = value[0];
  return quote && quote === value.at(-1) && (quote === '"' || quote === "'")
    ? value.slice(1, -1)
    : value;
}

function isWithinRoot(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(`${root}${SEPARATOR}`);
}

function isPublicDocsPath(path: string): boolean {
  const segments = path.split(SEPARATOR);
  if (segments.at(-1)?.toLocaleLowerCase() === 'roadmap.md') return false;
  return !segments.some((segment, index) =>
    segment === 'architecture' && segments[index + 1] === 'doctrine'
  );
}

/** Remove document bodies for bounded listing responses. */
export function toSummary(document: DocsDocument): DocsSummary {
  const { content: _content, sectionContents: _sectionContents, ...summary } = document;
  return summary;
}
