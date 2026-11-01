import type { GuidanceResult } from './guidance-contract.ts';
import type { IndexedGuidanceSection } from './guidance-parser.ts';
import { guidanceContentTerms } from './guidance-terms.ts';
import { guidanceOneLine, toGuidanceRecommendation } from './guidance-result.ts';

/** Recognize generated component identities without maintaining a second registry inventory. */
export function componentGuidance(
  sections: readonly IndexedGuidanceSection[],
  intent: string,
  hasWorkflowConcept: boolean,
): GuidanceResult | undefined {
  const explicit = /fresh\s*ui|\bcomponents?\b|\bprops?\b|\bkeyboard\b|\bshortcuts?\b|ui:add/i.test(
    intent,
  );
  if (hasWorkflowConcept && !explicit) return undefined;
  if (!explicit) return undefined;
  const query = words(intent);
  const candidates = new Map<string, { alias: string; sections: IndexedGuidanceSection[] }>();
  for (const section of sections) {
    const name = section.slug.replace(/^pages\//, '').match(/^design-system\/components\/([^/]+)$/)
      ?.[1];
    if (!name) continue;
    const aliases = [name.replaceAll('-', ' '), name.replaceAll('-', ''), section.title];
    const alias = aliases.filter((value) => query.includes(words(value)))
      .sort((a, b) => b.length - a.length)[0];
    if (!alias) continue;
    const previous = candidates.get(section.slug);
    if (previous) previous.sections.push(section);
    else candidates.set(section.slug, { alias, sections: [section] });
  }
  const match =
    [...candidates.values()].sort((a, b) =>
      b.alias.length - a.alias.length || a.sections[0]!.slug.localeCompare(b.sections[0]!.slug)
    )[0];
  if (!match) return undefined;
  const preferred = /keyboard|shortcut/i.test(intent)
    ? 'keyboard'
    : /\bprops?\b|attributes?|options?/i.test(intent)
    ? 'props'
    : /install|\badd\b|ui:add/i.test(intent)
    ? 'install'
    : /tokens?|theme|colou?r/i.test(intent)
    ? 'tokens'
    : 'usage-and-examples';
  const ordered = [...match.sections].sort((a, b) =>
    Number(b.section === preferred) - Number(a.section === preferred) ||
    a.level - b.level || a.section.localeCompare(b.section)
  );
  return {
    intent: guidanceOneLine(intent),
    confidence: 'medium',
    recommendations: ordered.map((entry) =>
      toGuidanceRecommendation(entry, guidanceContentTerms(match.alias))
    ),
    related: [],
    truncated: false,
  };
}

function words(value: string): string {
  return ' ' + value.toLocaleLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, ' ').trim() + ' ';
}
