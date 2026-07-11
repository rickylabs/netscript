import type { SkillDocument } from '../domain/types.ts';

const REQUIRED_KEYS = ['id', 'name', 'tags', 'description'] as const;
const ALLOWED_KEYS = new Set<string>(REQUIRED_KEYS);

/** Parse and validate the blessed `SKILL.md` frontmatter and body. */
export function parseSkillMarkdown(markdown: string): SkillDocument {
  const normalized = markdown.replaceAll('\r\n', '\n');
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/.exec(normalized);
  if (!match) throw new TypeError('SKILL.md must begin with a closed frontmatter block.');

  const values = parseFrontmatter(match[1] ?? '');
  for (const key of REQUIRED_KEYS) {
    if (!values.has(key)) throw new TypeError(`SKILL.md frontmatter is missing "${key}".`);
  }

  const id = scalar(values, 'id');
  const name = scalar(values, 'name');
  const description = scalar(values, 'description');
  const tags = parseTags(values.get('tags') ?? []);
  const body = (match[2] ?? '').trim();
  if (!id || !name || !description) {
    throw new TypeError('Skill id, name, and description must not be empty.');
  }
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(id)) {
    throw new TypeError('Skill id contains unsupported characters.');
  }
  if (tags.length === 0) throw new TypeError('Skill tags must contain at least one tag.');
  if (!body) throw new TypeError('Skill body must not be empty.');

  return { id, name, tags, description, body };
}

function parseFrontmatter(frontmatter: string): Map<string, string | string[]> {
  const values = new Map<string, string | string[]>();
  let listKey: string | undefined;
  for (const rawLine of frontmatter.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const item = /^-\s+(.+)$/.exec(line);
    if (item && listKey) {
      (values.get(listKey) as string[]).push(unquote(item[1] ?? ''));
      continue;
    }
    const field = /^([A-Za-z][\w-]*):(?:\s*(.*))?$/.exec(line);
    if (!field) throw new TypeError(`Malformed SKILL.md frontmatter line: "${rawLine}".`);
    const key = field[1] ?? '';
    if (!ALLOWED_KEYS.has(key)) throw new TypeError(`Unknown SKILL.md frontmatter field "${key}".`);
    if (values.has(key)) throw new TypeError(`Duplicate SKILL.md frontmatter field "${key}".`);
    const value = (field[2] ?? '').trim();
    if (key === 'tags' && value === '') {
      values.set(key, []);
      listKey = key;
    } else {
      values.set(key, unquote(value));
      listKey = undefined;
    }
  }
  return values;
}

function scalar(values: Map<string, string | string[]>, key: string): string {
  const value = values.get(key);
  if (typeof value !== 'string') throw new TypeError(`Skill ${key} must be a scalar string.`);
  return value.trim();
}

function parseTags(value: string | string[]): readonly string[] {
  let tags: string[];
  if (Array.isArray(value)) tags = value;
  else {
    if (!value.startsWith('[') || !value.endsWith(']')) {
      throw new TypeError('Skill tags must be a bracket array or YAML list.');
    }
    tags = value.slice(1, -1).split(',').map((tag) => unquote(tag.trim()));
  }
  const normalized = tags.map((tag) => tag.trim());
  if (normalized.some((tag) => !tag || !/^[\w.-]+$/.test(tag))) {
    throw new TypeError('Skill tags contain an empty or malformed tag.');
  }
  if (new Set(normalized.map((tag) => tag.toLowerCase())).size !== normalized.length) {
    throw new TypeError('Skill tags must be unique.');
  }
  return normalized;
}

function unquote(value: string): string {
  const quote = value.at(0);
  return quote && (quote === '"' || quote === "'") && value.at(-1) === quote
    ? value.slice(1, -1)
    : value;
}
