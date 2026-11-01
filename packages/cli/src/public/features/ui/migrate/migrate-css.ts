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

interface Compound {
  classes: string[];
  parent?: Compound;
}

function selectors(source: string): string {
  let i = 0;
  let compound: Compound = { classes: [] };
  const contexts: { outer: Compound; inherits: boolean }[] = [];
  const tokens: { start: number; end: number; token: string; compound: Compound }[] = [];
  let bracketDepth = 0;
  // Keep compound references until every class is known, including classes after a pseudo-function.
  while (i < source.length) {
    if (source.slice(i, i + 2) === '/*') {
      i = source.indexOf('*/', i + 2) + 2;
      continue;
    }
    if (source[i] === "'" || source[i] === '"') {
      i = quotedEnd(source, i);
      continue;
    }
    if (source.slice(i, i + 4).toLowerCase() === 'url(') {
      let end = i + 4;
      while (end < source.length && source[end] !== ')') {
        if (source[end] === '\\') end += 2;
        else if (source[end] === "'" || source[end] === '"') end = quotedEnd(source, end);
        else end++;
      }
      i = end + 1;
      continue;
    }
    if (source[i] === '[') bracketDepth++;
    if (source[i] === ']') bracketDepth--;
    if (!bracketDepth && source[i] === '(') {
      const inherits = /:(?:is|where|not)$/.test(source.slice(0, i));
      contexts.push({ outer: compound, inherits });
      compound = { classes: [], parent: inherits ? compound : undefined };
    }
    if (!bracketDepth && source[i] === ')') {
      compound = contexts.pop()?.outer ?? { classes: [] };
    }
    if (!bracketDepth && source[i] === ',') {
      const context = contexts.at(-1);
      compound = { classes: [], parent: context?.inherits ? context.outer : undefined };
    }
    if (!bracketDepth && /[\s>+~]/.test(source[i]) && !/[,(]$/.test(source.slice(0, i).trimEnd())) {
      compound = { classes: [] };
    }
    const match = !bracketDepth && source[i] === '.'
      ? /^\.((?:[\w-]|\\.)+)/.exec(source.slice(i))
      : null;
    if (!match) {
      i++;
      continue;
    }
    compound.classes.push(match[1]);
    tokens.push({ start: i, end: i + match[0].length, token: match[1], compound });
    i += match[0].length;
  }
  let output = '';
  let start = 0;
  for (const entry of tokens) {
    const { token, compound, end } = entry;
    const classes: string[] = [];
    for (let context: Compound | undefined = compound; context; context = context.parent) {
      classes.unshift(...context.classes);
    }
    const rule = variantRules[token] ?? stateRule(token, classes.join(' '));
    output += source.slice(start, entry.start);
    const original = source.slice(entry.start, end);
    if (rule) {
      const aliasSuffix = `,:where(.${rule.base})[${rule.attribute}='${rule.value}'])`;
      const alreadyAliased = layoutBases.has(rule.base) &&
        source.slice(0, entry.start).trimEnd().endsWith(':is(') &&
        source.slice(end).replace(/\s+/g, '').replaceAll('"', "'").startsWith(aliasSuffix);
      output += alreadyAliased
        ? original
        : layoutBases.has(rule.base)
        ? `:is(.${token}, :where(.${rule.base})[${rule.attribute}='${rule.value}'])`
        : token === 'ns-btn--icon'
        ? ":where(.ns-btn):is([data-size='icon'], [data-icon='true'])"
        : token.startsWith('is-')
        ? `[${rule.attribute}='${rule.value}']`
        : `:where(.${rule.base})[${rule.attribute}='${rule.value}']`;
    } else output += original;
    start = end;
  }
  return output + source.slice(start);
}
