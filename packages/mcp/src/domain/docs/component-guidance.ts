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
  const query = words(intent);
  const candidates = new Map<string, { alias: string; sections: IndexedGuidanceSection[] }>();
  for (const section of sections) {
    const name = componentPageName(section.slug);
    if (!name) continue;
    const aliases = [name.replaceAll('-', ' '), name.replaceAll('-', ''), section.title];
    const alias = aliases.filter((value) => {
      if (!query.includes(words(value))) return false;
      const identity = words(value).trim();
      const apiName = section.title.split(/\s+/)[0]!;
      const apiIdentity = /[a-z][A-Z]/.test(apiName) && intent.includes(apiName);
      const exactIdentity = query === words(value);
      // Spaced aliases can also describe ordinary tasks ("data table in Postgres").
      // Require nearby UI context; sentence-leading capitalisation is not an API signal.
      const context = new RegExp(
        `(?:fresh ui |ui add )${identity}\\b|\\b${identity} (?:component|props?|keyboard|shortcuts?)\\b|(?:component|props? (?:of|for)|keyboard (?:of|for)) (?:the )?${identity}\\b`,
      ).test(query);
      if (hasWorkflowConcept && !context && !apiIdentity && !exactIdentity) return false;
      const registryIdentity = name.includes('-') &&
        intent.toLowerCase().includes(name);
      const visualAction = new RegExp(`(?:theme|render) (?:the |a |an )?${identity} $`)
        .test(query);
      const namedUse = apiName !== apiName.toLowerCase() &&
        intent.trim().replace(/[?!.]+$/, '').endsWith(apiName) &&
        new RegExp(`(?:use|install|add) (?:the )?${identity} $`).test(query);
      return exactIdentity || apiIdentity || context || registryIdentity || visualAction ||
        namedUse;
    })
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

/** Recognize the generated reference namespace independently of optional corpus slug prefixes. */
export function componentPageName(slug: string): string | undefined {
  return slug.replace(/^pages\//, '').match(/^design-system\/components\/([^/]+)$/)?.[1];
}
