/** Version of the faithful get_doc response and cursor contract. */
export const DOC_RETRIEVAL_VERSION = 2;
/** Maximum serialized content bytes in a default retrieval or full page. */
export const DOC_CONTENT_BUDGET: number = 12 * 1024;

/** Retrieval fidelity reported on every successful response. */
export type DocRetrievalMode = 'verbatim' | 'extract' | 'full';

/** Complete section navigation, including sections omitted from the extract. */
export interface DocOutlineEntry {
  readonly heading: string;
  readonly slug: string;
  readonly characters: number;
}

/** Versioned faithful retrieval response. */
export interface DocRetrievalResult {
  readonly contractVersion: typeof DOC_RETRIEVAL_VERSION;
  readonly slug: string;
  readonly title: string;
  readonly section?: string;
  readonly redirectedFrom?: string;
  readonly mode: DocRetrievalMode;
  readonly content: string;
  readonly description?: string;
  readonly outline?: readonly DocOutlineEntry[];
  readonly omitted?: { readonly blocks: number; readonly characters: number };
  readonly nextCursor?: string;
}
