/** Maximum source characters retained for one indexed document. */
export const MAX_INDEXED_DOC_LENGTH = 100_000;

/** Heading and stable fragment identifier within a document. */
export interface DocsSection {
  /** Heading text shown to readers. */
  readonly heading: string;
  /** URL-compatible heading identifier. */
  readonly slug: string;
  /** Heading depth from one through six. */
  readonly level: number;
  /** Bounded Markdown belonging to this section. */
  readonly content: string;
}

/** Public documentation summary. */
export interface DocsSummary {
  /** Path-derived public document identifier. */
  readonly slug: string;
  /** Human-readable document title. */
  readonly title: string;
  /** One-line document description. */
  readonly description: string;
  /** Headings available for section retrieval. */
  readonly sections: readonly Pick<DocsSection, 'heading' | 'slug' | 'level'>[];
}

/** Indexed public documentation document. */
export interface DocsDocument extends DocsSummary {
  /** Bounded Markdown body without front matter. */
  readonly content: string;
  /** Indexed section bodies. */
  readonly sectionContents: readonly DocsSection[];
}

/** Ranked documentation search result. */
export interface DocsSearchMatch {
  /** Matching document identifier. */
  readonly slug: string;
  /** Matching document title. */
  readonly title: string;
  /** Short context around a lexical match. */
  readonly snippet: string;
  /** Positive lexical relevance score. */
  readonly score: number;
}

/** Indexed public documentation capability consumed by docs flows. */
export interface DocsCorpusPort {
  /** List indexed public document summaries. */
  list(): Promise<readonly DocsSummary[]>;
  /** Search indexed public documents by lexical relevance. */
  search(query: string): Promise<readonly DocsSearchMatch[]>;
  /** Retrieve one indexed public document by slug. */
  get(slug: string): Promise<DocsDocument | undefined>;
}

/** Convert public heading text into its stable section identifier. */
export function slugifyDocsHeading(value: string): string {
  return value.toLocaleLowerCase().trim()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-|-$/g, '');
}
