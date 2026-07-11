import type {
  SkillContentSource,
  SkillLoaderOptions,
  SkillLoaderPort,
  SkillMatch,
  SkillQueryOptions,
} from '../domain/types.ts';
import { parseSkillMarkdown } from './parse-skill-markdown.ts';
import { compareMatches, matchBySemantic, matchByTags } from './match-skills.ts';

/** Compose a skill loader from an injected content source and optional embeddings. */
export function createSkillLoader(
  source: SkillContentSource,
  options: SkillLoaderOptions = {},
): SkillLoaderPort {
  return {
    list: () => source.list(),
    async load(id) {
      const markdown = await source.load(id);
      if (markdown === undefined) return undefined;
      const document = parseSkillMarkdown(markdown);
      if (document.id !== id) {
        throw new TypeError(
          `Loaded skill id "${document.id}" does not match requested id "${id}".`,
        );
      }
      return document;
    },
    async matchByTag(tags) {
      return matchByTags(await source.list(), tags);
    },
    async matchByQuery(query, queryOptions = {}) {
      const skills = await source.list();
      const tagMatches = matchByTags(skills, [...(queryOptions.tags ?? []), query]);
      const semanticMatches = queryOptions.semantic && options.embeddings
        ? await matchBySemantic(skills, query, options.embeddings, options.embeddingModel)
        : [];
      return combine(tagMatches, semanticMatches, queryOptions);
    },
  };
}

function combine(
  tagMatches: readonly SkillMatch[],
  semanticMatches: readonly SkillMatch[],
  options: SkillQueryOptions,
): readonly SkillMatch[] {
  const matches = new Map<string, SkillMatch>();
  for (const match of [...tagMatches, ...semanticMatches]) {
    const previous = matches.get(match.skill.id);
    matches.set(
      match.skill.id,
      previous
        ? {
          skill: match.skill,
          score: Math.max(previous.score, match.score),
          modes: [...new Set([...previous.modes, ...match.modes])],
        }
        : match,
    );
  }
  const minScore = options.minScore ?? 0;
  const sorted = [...matches.values()].filter((match) => match.score > minScore).sort(
    compareMatches,
  );
  return options.limit === undefined ? sorted : sorted.slice(0, Math.max(0, options.limit));
}
