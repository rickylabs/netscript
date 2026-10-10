import {
  type DocsCorpusPort,
  DocsCorpusUnavailableError,
  type DocsDocument,
  slugifyDocsHeading,
} from '../../domain/docs/docs-corpus-port.ts';
import {
  DOC_CONTENT_BUDGET,
  DOC_RETRIEVAL_VERSION,
  type DocRetrievalResult,
} from '../../domain/docs/doc-retrieval-contract.ts';
import { docContentBytes, extractDocContent } from '../../domain/docs/faithful-extraction.ts';
import { isRecord } from '../../domain/schema.ts';
import type { ToolFlow } from '../../domain/tool-types.ts';
import { docPageIdentity, fullDocPage } from './full-doc-pagination.ts';

/** Compose faithful document retrieval using the existing corpus port. */
export function createGetDocFlow(corpus: DocsCorpusPort): ToolFlow {
  const cache = new WeakMap<DocsDocument, Map<string, Promise<PreparedDoc>>>();
  return async (input) => {
    if (
      !isRecord(input) || typeof input.slug !== 'string' || !input.slug.trim() ||
      (input.full !== undefined && typeof input.full !== 'boolean') ||
      (input.cursor !== undefined && (typeof input.cursor !== 'string' || input.full !== true))
    ) {
      return failure('invalid_input', 'slug is required; cursor requires full: true.');
    }
    let document;
    try {
      document = await corpus.get(input.slug);
    } catch (error) {
      return error instanceof DocsCorpusUnavailableError
        ? failure(error.code, error.message)
        : failure('docs_corpus_error', 'The documentation corpus could not complete the request.');
    }
    if (!document) {
      return failure('doc_not_found', `No public document found for slug: ${input.slug}`);
    }
    const sectionSlug = typeof input.section === 'string' ? slugifyDocsHeading(input.section) : '';
    const section = sectionSlug
      ? document.sectionContents.find((entry) => entry.slug === sectionSlug)
      : undefined;
    if (sectionSlug && !section) {
      return failure(
        'section_not_found',
        `No section named ${input.section} exists in ${document.slug}`,
      );
    }
    const source = section?.content ?? document.content;
    const base = {
      contractVersion: DOC_RETRIEVAL_VERSION as typeof DOC_RETRIEVAL_VERSION,
      slug: document.slug,
      title: document.title,
      ...(section ? { section: section.heading } : {}),
      ...(document.redirectedFrom ? { redirectedFrom: document.redirectedFrom } : {}),
    };
    let prepared = cache.get(document);
    if (!prepared) {
      prepared = new Map();
      cache.set(document, prepared);
    }
    let pending = prepared.get(sectionSlug);
    if (!pending) {
      pending = prepareDoc(document.slug, sectionSlug, source);
      prepared.set(sectionSlug, pending);
    }
    const data = await pending;
    let value: DocRetrievalResult;
    if (input.full === true) {
      const page = fullDocPage(source, data.identity, input.cursor as string | undefined);
      if (!page) {
        return failure(
          'invalid_doc_cursor',
          'Cursor is invalid or the document changed; restart full retrieval without a cursor.',
        );
      }
      value = { ...base, mode: 'full', ...page };
    } else if (data.extract) {
      value = {
        ...base,
        mode: 'extract',
        ...data.extract,
        description: document.description,
        outline: document.sectionContents.map(({ heading, slug, content }) => ({
          heading,
          slug,
          characters: content.length,
        })),
      };
    } else {
      value = { ...base, mode: 'verbatim', content: source };
    }
    return { ok: true, value };
  };
}

interface PreparedDoc {
  readonly identity: string;
  readonly extract?: ReturnType<typeof extractDocContent>;
}

async function prepareDoc(slug: string, section: string, content: string): Promise<PreparedDoc> {
  return {
    identity: await docPageIdentity(slug, section, content),
    ...(docContentBytes(content) > DOC_CONTENT_BUDGET
      ? { extract: extractDocContent(content) }
      : {}),
  };
}

function failure(code: string, message: string) {
  return { ok: false as const, error: { code, message } };
}
