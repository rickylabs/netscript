import { isRecord } from '../../domain/schema.ts';
import {
  type DocsCorpusPort,
  DocsCorpusUnavailableError,
} from '../../domain/docs/docs-corpus-port.ts';
import type { ToolExecutionResult, ToolFlow } from '../../domain/tool-types.ts';
import { createFindGuidanceFlow } from './find-guidance-flow.ts';
import { createGetDocFlow } from './get-doc-flow.ts';

const DEFAULT_LIST_LIMIT = 20;
const DEFAULT_SEARCH_LIMIT = 10;
const MAX_LIST_LIMIT = 100;
const MAX_SEARCH_LIMIT = 20;

/** Selection state reported by list_docs so callers can detect fallback degradation. */
export interface DocsCorpusSelection {
  readonly kind: 'filesystem' | 'embedded';
  readonly root: string | null;
}

/** Create the bounded public documentation tool flows. */
export function createDocsFlows(
  corpus: DocsCorpusPort,
  selection?: DocsCorpusSelection,
): Readonly<Record<'list_docs' | 'search_docs' | 'get_doc' | 'find_guidance', ToolFlow>> {
  return {
    find_guidance: createFindGuidanceFlow(corpus),
    list_docs: async (input): Promise<ToolExecutionResult> => {
      const limit = boundedLimit(input, DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT);
      try {
        const allDocs = await corpus.list();
        const docs = allDocs.slice(0, limit).map(({ slug, title, description }) => ({
          slug,
          title,
          description,
        }));
        return {
          ok: true,
          value: {
            count: docs.length,
            docs,
            ...(selection ? { corpus: { ...selection, documentCount: allDocs.length } } : {}),
          },
        };
      } catch (error) {
        return corpusFailure(error);
      }
    },
    search_docs: async (input): Promise<ToolExecutionResult> => {
      if (!isRecord(input) || typeof input.query !== 'string' || !input.query.trim()) {
        return invalidInput('query must be a non-empty string');
      }
      const limit = boundedLimit(input, DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT);
      try {
        const matches = (await corpus.search(input.query)).slice(0, limit);
        return { ok: true, value: { count: matches.length, matches } };
      } catch (error) {
        return corpusFailure(error);
      }
    },
    get_doc: createGetDocFlow(corpus),
  };
}

function boundedLimit(input: unknown, fallback: number, maximum: number): number {
  return isRecord(input) && Number.isInteger(input.limit)
    ? Math.min(maximum, Math.max(1, input.limit as number))
    : fallback;
}

function invalidInput(message: string): ToolExecutionResult {
  return { ok: false, error: { code: 'invalid_input', message } };
}

function corpusFailure(error: unknown): ToolExecutionResult {
  if (error instanceof DocsCorpusUnavailableError) {
    return { ok: false, error: { code: error.code, message: error.message } };
  }
  return {
    ok: false,
    error: {
      code: 'docs_corpus_error',
      message: 'The documentation corpus could not complete the request.',
    },
  };
}
