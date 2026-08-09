import {
  GUIDANCE_MAX_CODE_CHARACTERS,
  GUIDANCE_MAX_CODE_EXCERPTS_PER_RECOMMENDATION,
  type GuidanceCodeExcerpt,
  type GuidanceLinkRelation,
} from './guidance-contract.ts';
import type { DocsDocument, DocsSection } from './docs-corpus-port.ts';
import { normalizeDocsSlug, slugifyDocsHeading } from './docs-corpus-port.ts';
import { tokenizeGuidance } from './guidance-result.ts';

/** One normalized direct internal documentation route. */
export interface GuidanceLinkEdge {
  readonly targetSlug: string;
  readonly targetSection?: string;
  readonly relation: GuidanceLinkRelation;
}

/** One parsed section consumed by the deterministic ranker. */
export interface IndexedGuidanceSection {
  readonly id: string;
  readonly slug: string;
  readonly section: string;
  readonly heading: string;
  readonly title: string;
  readonly content: string;
  readonly tokens: readonly string[];
  readonly tokenCounts: ReadonlyMap<string, number>;
  readonly code: readonly GuidanceCodeExcerpt[];
  readonly links: readonly GuidanceLinkEdge[];
}

/** Parse canonical documentation into immutable section records. */
export function indexGuidanceDocuments(
  documents: Iterable<DocsDocument>,
): IndexedGuidanceSection[] {
  return [...documents].flatMap(indexDocument);
}

function indexDocument(document: DocsDocument): IndexedGuidanceSection[] {
  const sections = document.sectionContents.length > 0
    ? document.sectionContents
    : [{ heading: document.title, slug: 'overview', level: 1, content: document.content }];
  return sections.map((section) => indexSection(document, section));
}

function indexSection(document: DocsDocument, section: DocsSection): IndexedGuidanceSection {
  const slug = normalizeDocsSlug(document.slug);
  const citation = { slug, section: section.slug, heading: section.heading };
  const tokens = tokenizeGuidance(
    `${document.title} ${section.heading} ${slug} ${section.slug} ${section.content}`,
  );
  return {
    id: `${slug}#${section.slug}`,
    slug,
    section: section.slug,
    heading: section.heading,
    title: document.title,
    content: section.content,
    tokens,
    tokenCounts: tokenCounts(tokens),
    code: parseCodeExcerpts(section.content, citation),
    links: parseInternalLinks(section.content, slug, inferLinkRelation(section.heading)),
  };
}

function parseCodeExcerpts(
  content: string,
  source: GuidanceCodeExcerpt['source'],
): readonly GuidanceCodeExcerpt[] {
  const excerpts: GuidanceCodeExcerpt[] = [];
  for (const match of content.matchAll(/```([\w.+-]*)[^\S\r\n]*\r?\n([\s\S]*?)```/g)) {
    excerpts.push({
      language: match[1] || 'text',
      code: (match[2] ?? '').trim().slice(0, GUIDANCE_MAX_CODE_CHARACTERS),
      source,
    });
  }
  for (
    const match of content.matchAll(
      /lang\s*:\s*["']([^"']+)["'][\s\S]*?code\s*:\s*("(?:\\.|[^"\\])*")/g,
    )
  ) {
    try {
      const code = JSON.parse(match[2] ?? '""');
      if (typeof code === 'string') {
        excerpts.push({
          language: match[1] ?? 'text',
          code: code.slice(0, GUIDANCE_MAX_CODE_CHARACTERS),
          source,
        });
      }
    } catch {
      // Malformed Vento data is prose, not an uncited executable example.
    }
  }
  return excerpts.slice(0, GUIDANCE_MAX_CODE_EXCERPTS_PER_RECOMMENDATION);
}

function parseInternalLinks(
  content: string,
  sourceSlug: string,
  relation: GuidanceLinkRelation,
): readonly GuidanceLinkEdge[] {
  const edges: GuidanceLinkEdge[] = [];
  for (const match of content.matchAll(/\[[^\]]+\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)) {
    const target = match[1];
    if (!target || /^(?:https?:|mailto:|tel:)/i.test(target)) continue;
    const resolved = resolveInternalTarget(sourceSlug, target);
    if (resolved) edges.push({ ...resolved, relation });
  }
  return edges;
}

function resolveInternalTarget(
  sourceSlug: string,
  target: string,
): Pick<GuidanceLinkEdge, 'targetSlug' | 'targetSection'> | undefined {
  try {
    const base = new URL(`https://docs.invalid/${sourceSlug}`);
    const resolved = new URL(target, base);
    if (resolved.origin !== base.origin) return undefined;
    const targetSlug = target.startsWith('#')
      ? sourceSlug
      : normalizeDocsSlug(decodeURIComponent(resolved.pathname));
    const fragment = decodeURIComponent(resolved.hash.slice(1));
    return {
      targetSlug,
      ...(fragment ? { targetSection: slugifyDocsHeading(fragment) } : {}),
    };
  } catch {
    return undefined;
  }
}

function tokenCounts(tokens: readonly string[]): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  return counts;
}

function inferLinkRelation(heading: string): GuidanceLinkRelation {
  if (/\b(?:before|prerequisites?|requirements?)\b/i.test(heading)) return 'prerequisite';
  if (/\bnext\b/i.test(heading)) return 'next';
  return 'related';
}
