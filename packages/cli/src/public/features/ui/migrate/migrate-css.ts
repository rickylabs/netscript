import type { VariantMigrationResult } from './variant-migration-contract.ts';
import { quotedEnd } from './variant-lexical.ts';
import { stateRule, variantRules } from './variant-rules.ts';

/** Replace selector tokens while preserving specificity, strings, comments and declarations. */
export function migrateVariantCss(source: string): VariantMigrationResult {
  try {
    let content = '';
    let start = 0;
    let i = 0;
    while (i < source.length) {
      if (source.slice(i, i + 2) === '/*') {
        const end = source.indexOf('*/', i + 2);
        if (end < 0) throw new Error('Unterminated CSS comment');
        i = end + 2;
        continue;
      }
      if (source[i] === "'" || source[i] === '"') {
        i = quotedEnd(source, i);
        continue;
      }
      if ('{};'.includes(source[i])) {
        const segment = source.slice(start, i);
        content += (source[i] === '{' ? selectors(segment) : segment) + source[i];
        start = ++i;
        continue;
      }
      i++;
    }
    return { content: content + source.slice(start), diagnostics: [] };
  } catch (error) {
    return {
      content: source,
      diagnostics: [error instanceof Error ? error.message : String(error)],
    };
  }
}

function selectors(source: string): string {
  let output = '';
  let i = 0;
  while (i < source.length) {
    if (source.slice(i, i + 2) === '/*') {
      const end = source.indexOf('*/', i + 2) + 2;
      output += source.slice(i, end);
      i = end;
      continue;
    }
    if (source[i] === "'" || source[i] === '"') {
      const end = quotedEnd(source, i);
      output += source.slice(i, end);
      i = end;
      continue;
    }
    if (source.slice(i, i + 4).toLowerCase() === 'url(') {
      let end = i + 4;
      while (end < source.length && source[end] !== ')') {
        if (source[end] === '\\') end += 2;
        else if (source[end] === "'" || source[end] === '"') end = quotedEnd(source, end);
        else end++;
      }
      output += source.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    const match = source[i] === '.' ? /^\.([\w-]+)/.exec(source.slice(i)) : null;
    if (!match) {
      output += source[i++];
      continue;
    }
    const token = match[1];
    // State hooks belong to one selector branch, never a sibling after a comma.
    const branch = source.slice(source.lastIndexOf(',', i) + 1, i + match[0].length);
    const rule = variantRules[token] ?? stateRule(token, branch);
    if (rule) {
      output += token === 'ns-btn--icon'
        ? ":where(.ns-btn):is([data-size='icon'], [data-icon='true'])"
        : token.startsWith('is-')
        ? `[${rule.attribute}='${rule.value}']`
        : `:where(.${rule.base})[${rule.attribute}='${rule.value}']`;
    } else output += match[0];
    i += match[0].length;
  }
  return output;
}
