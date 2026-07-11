import type { SkillContentSource, SkillSourceEntry, SkillSummary } from '../domain/types.ts';
import { parseSkillMarkdown } from '../application/parse-skill-markdown.ts';

/** Create an effect-free skill source from caller-supplied `SKILL.md` strings. */
export function createInMemorySkillContentSource(
  entries: readonly SkillSourceEntry[],
): SkillContentSource {
  const content = new Map<string, string>();
  const summaries: SkillSummary[] = [];
  for (const entry of entries) {
    if (content.has(entry.id)) throw new TypeError(`Duplicate skill source id "${entry.id}".`);
    const { body: _body, ...summary } = parseSkillMarkdown(entry.markdown);
    if (summary.id !== entry.id) {
      throw new TypeError(
        `Skill source id "${entry.id}" does not match frontmatter id "${summary.id}".`,
      );
    }
    content.set(entry.id, entry.markdown);
    summaries.push(summary);
  }
  const ordered = summaries.toSorted((left, right) => left.id.localeCompare(right.id));
  return {
    list(): Promise<readonly SkillSummary[]> {
      return Promise.resolve(ordered);
    },
    load(id: string): Promise<string | undefined> {
      return Promise.resolve(content.get(id));
    },
  };
}
