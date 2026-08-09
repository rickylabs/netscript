import { isRecord } from '../../domain/schema.ts';
import {
  GUIDANCE_DEFAULT_RECOMMENDATIONS,
  GUIDANCE_MAX_CODE_CHARACTERS,
  GUIDANCE_MAX_CODE_EXCERPTS_PER_RECOMMENDATION,
  GUIDANCE_MAX_EXCERPT_CHARACTERS,
  GUIDANCE_MAX_FALLBACK_CHARACTERS,
  GUIDANCE_MAX_INTENT_CHARACTERS,
  GUIDANCE_MAX_RECOMMENDATIONS,
  GUIDANCE_MAX_RELATED_LINKS,
  GUIDANCE_MAX_WHY_CHARACTERS,
  type GuidanceCodeExcerpt,
  type GuidanceRecommendation,
  type GuidanceRelatedLink,
  type GuidanceResult,
} from '../../domain/docs/guidance-contract.ts';
import {
  type DocsCorpusPort,
  DocsCorpusUnavailableError,
} from '../../domain/docs/docs-corpus-port.ts';
import type { ToolExecutionResult, ToolFlow } from '../../domain/tool-types.ts';

/** Create the bounded intent-aware documentation flow. */
export function createFindGuidanceFlow(port: Pick<DocsCorpusPort, 'findGuidance'>): ToolFlow {
  return async (input: unknown): Promise<ToolExecutionResult> => {
    if (!isRecord(input) || typeof input.intent !== 'string') {
      return invalidInput('intent must be a non-empty string');
    }
    const intent = input.intent.trim();
    if (!intent || intent.length > GUIDANCE_MAX_INTENT_CHARACTERS) {
      return invalidInput(
        `intent must contain 1-${GUIDANCE_MAX_INTENT_CHARACTERS} characters`,
      );
    }
    const requestedLimit = input.limit;
    if (
      requestedLimit !== undefined &&
      (typeof requestedLimit !== 'number' || !Number.isInteger(requestedLimit) ||
        requestedLimit < 1 || requestedLimit > GUIDANCE_MAX_RECOMMENDATIONS)
    ) {
      return invalidInput(`limit must be an integer from 1-${GUIDANCE_MAX_RECOMMENDATIONS}`);
    }
    const limit = requestedLimit === undefined
      ? GUIDANCE_DEFAULT_RECOMMENDATIONS
      : requestedLimit as number;
    try {
      return { ok: true, value: boundGuidanceResult(await port.findGuidance(intent), limit) };
    } catch (error) {
      if (error instanceof DocsCorpusUnavailableError) {
        return { ok: false, error: { code: error.code, message: error.message } };
      }
      return {
        ok: false,
        error: {
          code: 'docs_corpus_error',
          message: 'The documentation corpus could not complete the guidance request.',
        },
      };
    }
  };
}

function boundGuidanceResult(result: GuidanceResult, limit: number): GuidanceResult {
  let truncated = result.truncated || result.recommendations.length > limit ||
    result.related.length > GUIDANCE_MAX_RELATED_LINKS;
  const recommendations = result.recommendations.slice(0, limit).map((recommendation) => {
    const bounded = boundRecommendation(recommendation);
    truncated ||= bounded.truncated;
    return bounded.value;
  });
  const related = result.related.slice(0, GUIDANCE_MAX_RELATED_LINKS).map((link) =>
    boundRelatedLink(link)
  );
  const fallback = result.fallback === undefined
    ? undefined
    : boundString(result.fallback, GUIDANCE_MAX_FALLBACK_CHARACTERS);
  truncated ||= fallback !== undefined && fallback !== result.fallback;
  return {
    intent: boundString(result.intent, GUIDANCE_MAX_INTENT_CHARACTERS),
    confidence: result.confidence,
    recommendations,
    related,
    ...(fallback === undefined ? {} : { fallback }),
    truncated,
  };
}

function boundRecommendation(
  recommendation: GuidanceRecommendation,
): { readonly value: GuidanceRecommendation; readonly truncated: boolean } {
  const why = boundString(recommendation.why, GUIDANCE_MAX_WHY_CHARACTERS);
  const excerpt = boundString(recommendation.excerpt, GUIDANCE_MAX_EXCERPT_CHARACTERS);
  const code = recommendation.code.slice(0, GUIDANCE_MAX_CODE_EXCERPTS_PER_RECOMMENDATION).map(
    boundCodeExcerpt,
  );
  return {
    value: { ...recommendation, why, excerpt, code },
    truncated: why !== recommendation.why || excerpt !== recommendation.excerpt ||
      code.length !== recommendation.code.length ||
      code.some((entry, index) => entry.code !== recommendation.code[index]?.code),
  };
}

function boundCodeExcerpt(excerpt: GuidanceCodeExcerpt): GuidanceCodeExcerpt {
  return { ...excerpt, code: boundString(excerpt.code, GUIDANCE_MAX_CODE_CHARACTERS) };
}

function boundRelatedLink(link: GuidanceRelatedLink): GuidanceRelatedLink {
  return { ...link };
}

function boundString(value: string, maximum: number): string {
  return value.length <= maximum ? value : value.slice(0, maximum);
}

function invalidInput(message: string): ToolExecutionResult {
  return { ok: false, error: { code: 'invalid_input', message } };
}
