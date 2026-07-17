import { extname, relative, resolve, SEPARATOR } from '@std/path';
import {
  type DocsCorpusPort,
  DocsCorpusUnavailableError,
  type DocsDocument,
  type DocsSearchMatch,
  type DocsSection,
  type DocsSummary,
  MAX_INDEXED_DOC_LENGTH,
  slugifyDocsHeading,
} from '../domain/docs-corpus-port.ts';

const EXCLUDED_DIRECTORIES = new Set(['_plan', '_data', '_components', '_includes']);

interface CachedDocument {
  readonly mtime: number;
  readonly document: DocsDocument;
}

/** Options for a filesystem-backed public documentation corpus. */
export interface FilesystemDocsCorpusOptions {
  /** Absolute or working-directory-relative root containing public Markdown. */
  readonly root: string;
  /** Maximum Markdown characters retained per document. */
  readonly maxDocumentLength?: number;
}

/** Lazily index a public Markdown tree with per-file mtime reuse. */
export class FilesystemDocsCorpus implements DocsCorpusPort {
  readonly #root: string;
  readonly #maxDocumentLength: number;
  #cache = new Map<string, CachedDocument>();
  #documents = new Map<string, DocsDocument>();

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

  /** Rank current public documents using weighted lexical matches. */
  async search(query: string): Promise<readonly DocsSearchMatch[]> {
    await this.#refresh();
    const terms = tokenize(query);
    if (terms.length === 0) return [];
    return [...this.#documents.values()].map((document) => rankDocument(document, terms))
      .filter((match): match is DocsSearchMatch => match !== undefined)
      .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
  }

  /** Retrieve the current public document matching a normalized slug. */
  async get(slug: string): Promise<DocsDocument | undefined> {
    await this.#refresh();
    return this.#documents.get(normalizeSlug(slug));
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
    const documents = new Map<string, DocsDocument>();
    for await (const path of walkMarkdown(rootReal)) {
      if (!isPublicDocsPath(relative(rootReal, path))) continue;
      const realPath = await Deno.realPath(path);
      if (!isWithinRoot(rootReal, realPath)) continue;
      seen.add(realPath);
      const stat = await Deno.stat(realPath);
      const mtime = stat.mtime?.getTime() ?? 0;
      let cached = this.#cache.get(realPath);
      if (!cached || cached.mtime !== mtime) {
        const source = await Deno.readTextFile(realPath);
        cached = {
          mtime,
          document: parseMarkdownDocument(
            slugFromPath(relative(rootReal, realPath)),
            source,
            this.#maxDocumentLength,
          ),
        };
        this.#cache.set(realPath, cached);
      }
      documents.set(cached.document.slug, cached.document);
    }
    for (const path of this.#cache.keys()) if (!seen.has(path)) this.#cache.delete(path);
    if (documents.size === 0) {
      throw new DocsCorpusUnavailableError(this.#root);
    }
    this.#documents = documents;
  }
}

async function* walkMarkdown(directory: string): AsyncGenerator<string> {
  const entries = [];
  for await (const entry of Deno.readDir(directory)) entries.push(entry);
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.name.startsWith('_')) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory) {
      if (!EXCLUDED_DIRECTORIES.has(entry.name)) yield* walkMarkdown(path);
    } else if ((entry.isFile || entry.isSymlink) && extname(entry.name).toLowerCase() === '.md') {
      yield path;
    }
  }
}

/** Parse one Markdown source into the shared docs document contract. */
export function parseMarkdownDocument(
  slug: string,
  source: string,
  maxLength: number,
): DocsDocument {
  const { attributes, body } = parseFrontMatter(source);
  const content = body.slice(0, maxLength);
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

function parseFrontMatter(source: string): { attributes: Record<string, string>; body: string } {
  if (!source.startsWith('---\n') && !source.startsWith('---\r\n')) {
    return { attributes: {}, body: source };
  }
  const lines = source.split(/\r?\n/);
  const end = lines.indexOf('---', 1);
  if (end < 0) return { attributes: {}, body: source };
  const attributes: Record<string, string> = {};
  for (const line of lines.slice(1, end)) {
    const match = /^(title|description):\s*(.*)$/.exec(line);
    if (match?.[1] && match[2] !== undefined) attributes[match[1]] = unquote(match[2].trim());
  }
  return { attributes, body: lines.slice(end + 1).join('\n').trimStart() };
}

function parseSections(content: string): DocsSection[] {
  const matches = [...content.matchAll(/^(#{1,6})\s+(.+?)\s*#*\s*$/gm)];
  return matches.map((match, index) => {
    const heading = match[2]!.trim();
    const start = (match.index ?? 0) + match[0].length;
    const next = matches.slice(index + 1).find((candidate) =>
      candidate[1]!.length <= match[1]!.length
    );
    const end = next?.index ?? content.length;
    return {
      heading,
      slug: slugifyDocsHeading(heading),
      level: match[1]!.length,
      content: content.slice(start, end).trim(),
    };
  });
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
  const firstTerm = terms.find((term) => body.includes(term))!;
  return { slug: document.slug, title: document.title, snippet: snippet(body, firstTerm), score };
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

function snippet(content: string, term: string): string {
  const index = Math.max(0, content.indexOf(term));
  const start = Math.max(0, index - 80);
  const end = Math.min(content.length, index + term.length + 120);
  return `${start > 0 ? '…' : ''}${oneLine(content.slice(start, end))}${
    end < content.length ? '…' : ''
  }`;
}

function slugFromPath(path: string): string {
  const normalized = path.split(SEPARATOR).join('/').replace(/\.md$/i, '');
  const withoutIndex = normalized === 'index' ? 'index' : normalized.replace(/\/index$/, '');
  return normalizeSlug(withoutIndex);
}

/** Normalize a docs lookup slug. */
export function normalizeSlug(slug: string): string {
  return slug.trim().replace(/^\/+|\/+$/g, '').replace(/\.md$/i, '') || 'index';
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
