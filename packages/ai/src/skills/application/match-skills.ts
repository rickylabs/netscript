import type { SkillEmbeddingProvider, SkillMatch, SkillSummary } from '../domain/types.ts';

/** Rank summaries using case-insensitive exact and substring tag triggers. */
export function matchByTags(
  skills: readonly SkillSummary[],
  triggers: readonly string[],
): readonly SkillMatch[] {
  const queries = triggers.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  return skills.flatMap((skill) => {
    let score = 0;
    for (const tag of skill.tags) {
      const candidate = tag.toLowerCase();
      for (const query of queries) {
        if (candidate === query) score = Math.max(score, 1);
        else if (candidate.includes(query) || query.includes(candidate)) {
          score = Math.max(score, 0.5);
        }
      }
    }
    return score > 0 ? [{ skill, score, modes: ['tag'] as const }] : [];
  }).sort(compareMatches);
}

/** Rank summaries by cosine similarity using an injected embedding provider. */
export async function matchBySemantic(
  skills: readonly SkillSummary[],
  query: string,
  embeddings: SkillEmbeddingProvider,
  model?: string,
): Promise<readonly SkillMatch[]> {
  if (skills.length === 0 || !query.trim()) return [];
  const texts = [query, ...skills.map(summaryText)];
  const response = await embeddings.embed(texts, model ? { model } : undefined);
  if (response.embeddings.length !== texts.length) {
    throw new TypeError('Embedding provider returned an unexpected vector count.');
  }
  const queryVector = response.embeddings[0] ?? [];
  return skills.map((skill, index) => ({
    skill,
    score: cosine(queryVector, response.embeddings[index + 1] ?? []),
    modes: ['semantic'] as const,
  })).filter((match) => match.score > 0).sort(compareMatches);
}

function summaryText(skill: SkillSummary): string {
  return `${skill.name}\n${skill.description}\n${skill.tags.join(' ')}`;
}

function cosine(left: readonly number[], right: readonly number[]): number {
  if (left.length === 0 || left.length !== right.length) {
    throw new TypeError('Embedding vectors must have equal non-zero dimensions.');
  }
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index++) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    dot += a * b;
    leftMagnitude += a * a;
    rightMagnitude += b * b;
  }
  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator === 0 ? 0 : Math.max(-1, Math.min(1, dot / denominator));
}

export function compareMatches(left: SkillMatch, right: SkillMatch): number {
  return right.score - left.score || left.skill.id.localeCompare(right.skill.id);
}
