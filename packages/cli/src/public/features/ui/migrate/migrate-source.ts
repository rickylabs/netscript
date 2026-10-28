import { variantMigrations } from './variant-migration-data.ts';
import type { VariantMigrationResult } from './variant-migration-contract.ts';
import { balancedEnd, openingTags, quotedEnd } from './variant-lexical.ts';
import { stateRule, variantRules } from './variant-rules.ts';

/** Apply reviewed structural edits to copied components; ambiguous/customized hunks fail closed. */
export function migrateVariantSource(file: string, input: string): VariantMigrationResult {
  const source = input.replace(/\r\n/g, '\n');
  const migration = variantMigrations.find((candidate) => candidate.file === file);
  if (migration && /\bns-[\w-]+/.test(source)) {
    let content = source;
    for (const [index, edit] of migration.edits.entries()) {
      const first = content.indexOf(edit.before);
      if (first >= 0 && content.indexOf(edit.before, first + 1) < 0) {
        content = content.slice(0, first) + edit.after + content.slice(first + edit.before.length);
      } else if (first >= 0 || !edit.after || !content.includes(edit.after)) {
        return {
          content: input,
          diagnostics: [
            `Customized ${file}, source edit ${
              index + 1
            }; merge this component's variant migration manually.`,
          ],
        };
      }
    }
    return { content: restoreLines(content, input), diagnostics: [] };
  }
  try {
    return migrateLiterals(source, input);
  } catch (error) {
    return {
      content: input,
      diagnostics: [error instanceof Error ? error.message : String(error)],
    };
  }
}

function restoreLines(content: string, input: string): string {
  return input.includes('\r\n') ? content.replace(/\n/g, '\r\n') : content;
}

function migrateLiterals(source: string, input: string): VariantMigrationResult {
  let content = source;
  const diagnostics: string[] = [];
  for (const tag of [...openingTags(source)].reverse()) {
    const text = source.slice(tag.start, tag.end);
    const attributes = readAttributes(text);
    const classes = attributes.find((attribute) =>
      attribute.name === 'class' || attribute.name === 'className'
    );
    if (!classes) continue;
    if (!classes.literal) {
      if (
        /ns-[\w-]+--|is-(active|selected|open|visible)/.test(classes.value) ||
        /ns-[\w-]+--/.test(source)
      ) {
        diagnostics.push(
          'Dynamic legacy class expression: use the reviewed component migration or merge it manually.',
        );
      }
      continue;
    }
    const values = new Map<string, string>();
    const kept = classes.value.split(/\s+/).filter((token) => {
      const rule = variantRules[token] ?? stateRule(token, classes.value);
      if (!rule) return true;
      const prior = values.get(rule.attribute);
      if (prior && prior !== rule.value) {
        throw new Error(`Conflicting legacy values for ${rule.attribute}`);
      }
      values.set(rule.attribute, rule.value);
      return false;
    });
    if (!values.size) continue;
    let added = '';
    for (const [name, value] of values) {
      const existing = attributes.find((attribute) => attribute.name === name);
      if (existing && (!existing.literal || existing.value !== value)) {
        throw new Error(`Conflicting ${name}; no files written.`);
      }
      if (!existing) added += ` ${name}='${value}'`;
    }
    const changed = text.slice(0, classes.start) + `${classes.name}='${kept.join(' ')}'${added}` +
      text.slice(classes.end);
    content = content.slice(0, tag.start) + changed + content.slice(tag.end);
  }
  return { content: diagnostics.length ? input : restoreLines(content, input), diagnostics };
}

interface Attribute {
  name: string;
  start: number;
  end: number;
  value: string;
  literal: boolean;
}
function readAttributes(tag: string): Attribute[] {
  const attributes: Attribute[] = [];
  let i = /^<[\w.:-]+/.exec(tag)?.[0].length ?? 1;
  while (i < tag.length - 1) {
    if (tag[i] === '{') {
      i = balancedEnd(tag, i);
      continue;
    }
    const match = /^[\w:-]+/.exec(tag.slice(i));
    if (!match) {
      i++;
      continue;
    }
    const start = i;
    const name = match[0];
    i += name.length;
    while (/\s/.test(tag[i] ?? '')) i++;
    if (tag[i] !== '=') continue;
    i++;
    while (/\s/.test(tag[i] ?? '')) i++;
    const valueStart = i;
    const literal = tag[i] === "'" || tag[i] === '"';
    i = literal ? quotedEnd(tag, i) : tag[i] === '{' ? balancedEnd(tag, i) : i + 1;
    attributes.push({ name, start, end: i, value: tag.slice(valueStart + 1, i - 1), literal });
  }
  return attributes;
}
