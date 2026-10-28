import type { VariantMigrationResult } from './variant-migration-contract.ts';
import { quotedEnd } from './variant-lexical.ts';
import { layoutBases, stateRule, variantRules } from './variant-rules.ts';

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
  let compound: string[] = [];
  const contexts: string[][] = [];
  let bracketDepth = 0;
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
    if (source[i] === '[') bracketDepth++;
    if (source[i] === ']') bracketDepth--;
    if (!bracketDepth && source[i] === '(') {
      contexts.push([...compound]);
      if (!/:(?:is|where|not)$/.test(source.slice(0, i))) compound = [];
    }
    if (!bracketDepth && source[i] === ')') compound = contexts.pop() ?? [];
    if (!bracketDepth && source[i] === ',') compound = contexts.at(-1)?.slice() ?? [];
    if (!bracketDepth && /[\s>+~]/.test(source[i]) && !/[,(]$/.test(source.slice(0, i).trimEnd())) {
      compound = [];
    }
    const match = !bracketDepth && source[i] === '.'
      ? /^\.((?:[\w-]|\\.)+)/.exec(source.slice(i))
      : null;
    if (!match) {
      output += source[i++];
      continue;
    }
    const token = match[1];
    const rule = variantRules[token] ?? stateRule(token, compound.join(' '));
    compound.push(token);
    if (rule) {
      const aliasSuffix = `,:where(.${rule.base})[${rule.attribute}='${rule.value}'])`;
      const alreadyAliased = layoutBases.has(rule.base) &&
        source.slice(0, i).trimEnd().endsWith(':is(') &&
        source.slice(i + match[0].length).replace(/\s+/g, '').replaceAll('"', "'").startsWith(
          aliasSuffix,
        );
      output += alreadyAliased
        ? match[0]
        : layoutBases.has(rule.base)
        ? `:is(.${token}, :where(.${rule.base})[${rule.attribute}='${rule.value}'])`
        : token === 'ns-btn--icon'
        ? ":where(.ns-btn):is([data-size='icon'], [data-icon='true'])"
        : token.startsWith('is-')
        ? `[${rule.attribute}='${rule.value}']`
        : `:where(.${rule.base})[${rule.attribute}='${rule.value}']`;
    } else output += match[0];
    i += match[0].length;
  }
  return output;
}
