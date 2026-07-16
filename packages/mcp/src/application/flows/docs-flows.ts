import { isRecord } from '../../domain/schema.ts';
import { type DocsCorpusPort, slugifyDocsHeading } from '../../domain/docs-corpus-port.ts';
import type { ToolExecutionResult, ToolFlow } from '../../domain/tool-types.ts';

const DEFAULT_LIST_LIMIT = 20;
const DEFAULT_SEARCH_LIMIT = 10;
const MAX_LIST_LIMIT = 100;
const MAX_SEARCH_LIMIT = 20;

/** Create the bounded public documentation tool flows. */
export function createDocsFlows(
  corpus: DocsCorpusPort,
): Readonly<Record<'list_docs' | 'search_docs' | 'get_doc', ToolFlow>> {
  return {
    list_docs: async (input): Promise<ToolExecutionResult> => {
      const limit = boundedLimit(input, DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT);
      const docs = (await corpus.list()).slice(0, limit).map(({ slug, title, description }) => ({
        slug,
        title,
        description,
      }));
      return { ok: true, value: { count: docs.length, docs } };
    },
    search_docs: async (input): Promise<ToolExecutionResult> => {
      if (!isRecord(input) || typeof input.query !== 'string' || !input.query.trim()) {
        return invalidInput('query must be a non-empty string');
      }
      const limit = boundedLimit(input, DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT);
      const matches = (await corpus.search(input.query)).slice(0, limit);
      return { ok: true, value: { count: matches.length, matches } };
    },
    get_doc: async (input): Promise<ToolExecutionResult> => {
      if (!isRecord(input) || typeof input.slug !== 'string' || !input.slug.trim()) {
        return invalidInput('slug must be a non-empty string');
      }
      const document = await corpus.get(input.slug);
      if (!document) {
        return {
          ok: false,
          error: {
            code: 'doc_not_found',
            message: `No public document found for slug: ${input.slug}`,
          },
        };
      }
      if (typeof input.section === 'string' && input.section.trim()) {
        const sectionSlug = slugifyDocsHeading(input.section);
        const section = document.sectionContents.find((candidate) =>
          candidate.slug === sectionSlug
        );
        if (!section) {
          return {
            ok: false,
            error: {
              code: 'section_not_found',
              message: `No section named ${input.section} exists in ${document.slug}`,
            },
          };
        }
        return {
          ok: true,
          value: {
            slug: document.slug,
            title: document.title,
            section: section.heading,
            content: section.content,
          },
        };
      }
      return {
        ok: true,
        value: { slug: document.slug, title: document.title, content: document.content },
      };
    },
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
