/**
 * Load validated Agent Skills with progressive disclosure and optional semantic matching.
 *
 * @example
 * ```ts
 * import { createInMemorySkillContentSource, createSkillLoader } from '@netscript/ai/skills';
 *
 * const source = createInMemorySkillContentSource([{ id: 'review', markdown: `---
 * id: review
 * name: Code review
 * tags: [review, quality]
 * description: Reviews a change for correctness.
 * ---
 * Inspect the diff and report actionable findings.
 * ` }]);
 * const loader = createSkillLoader(source);
 * const matches = await loader.matchByTag(['review']);
 * ```
 *
 * @module
 */

export type {
  SkillContentSource,
  SkillDocument,
  SkillEmbeddingProvider,
  SkillLoaderOptions,
  SkillLoaderPort,
  SkillMatch,
  SkillMatchMode,
  SkillQueryOptions,
  SkillSourceEntry,
  SkillSummary,
} from './domain/types.ts';
export { SKILL_MATCH_MODES } from './domain/types.ts';
export { parseSkillMarkdown } from './application/parse-skill-markdown.ts';
export { matchBySemantic, matchByTags } from './application/match-skills.ts';
export { createSkillLoader } from './application/create-skill-loader.ts';
export { createInMemorySkillContentSource } from './adapters/in-memory-skill-content-source.ts';
