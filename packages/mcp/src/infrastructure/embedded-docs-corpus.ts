import {
  type DocsCorpusPort,
  type DocsDocument,
  type DocsSearchMatch,
  type DocsSummary,
  MAX_INDEXED_DOC_LENGTH,
} from '../domain/docs-corpus-port.ts';
import {
  normalizeSlug,
  parseMarkdownDocument,
  rankDocument,
  tokenize,
  toSummary,
} from './filesystem-docs-corpus.ts';

/** One Markdown asset shipped with the package. */
export interface EmbeddedDocsSource {
  /** Stable document slug. */
  readonly slug: string;
  /** Markdown source text. */
  readonly source: string;
}

/** Options for a package-shipped, in-memory documentation corpus. */
export interface EmbeddedDocsCorpusOptions {
  /** Markdown assets embedded by the package composition root. */
  readonly documents: readonly EmbeddedDocsSource[];
  /** Maximum Markdown characters retained per document. */
  readonly maxDocumentLength?: number;
}

/** Immutable docs corpus backed by Markdown assets imported with the package. */
export class EmbeddedDocsCorpus implements DocsCorpusPort {
  readonly #documents: ReadonlyMap<string, DocsDocument>;

  /** Parse the supplied package assets once at composition time. */
  constructor(options: EmbeddedDocsCorpusOptions) {
    const maxLength = options.maxDocumentLength ?? MAX_INDEXED_DOC_LENGTH;
    this.#documents = new Map(options.documents.map((document) => {
      const slug = normalizeSlug(document.slug);
      return [slug, parseMarkdownDocument(slug, document.source, maxLength)];
    }));
  }

  /** List embedded document summaries in stable slug order. */
  list(): Promise<readonly DocsSummary[]> {
    return Promise.resolve(
      [...this.#documents.values()].map(toSummary).sort((left, right) =>
        left.slug.localeCompare(right.slug)
      ),
    );
  }

  /** Rank embedded documents using the shared lexical index rules. */
  search(query: string): Promise<readonly DocsSearchMatch[]> {
    const terms = tokenize(query);
    if (terms.length === 0) {
      return Promise.resolve([]);
    }
    return Promise.resolve(
      [...this.#documents.values()].map((document) => rankDocument(document, terms))
        .filter((match): match is DocsSearchMatch => match !== undefined)
        .sort((left, right) => right.score - left.score || left.slug.localeCompare(right.slug)),
    );
  }

  /** Retrieve an embedded document by normalized slug. */
  get(slug: string): Promise<DocsDocument | undefined> {
    return Promise.resolve(this.#documents.get(normalizeSlug(slug)));
  }
}
