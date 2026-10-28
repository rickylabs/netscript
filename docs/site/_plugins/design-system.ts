import { parse } from 'lume/deps/yaml.ts';

export const DESIGN_ROOT = '/design-system/';
export const SOURCE_ROOT =
  'https://raw.githubusercontent.com/rickylabs/netscript/main/docs/design-system/';
export const ASSET_ROOT = '/assets/design-system/';
export const SCHEMES = ['light', 'dark'] as const;
export const VALUE_GROUPS = ['colors', 'typography', 'rounded', 'spacing', 'components'] as const;

export interface Theme {
  id: string;
  name: string;
  description: string;
  version: string;
  values: Record<string, unknown>;
  yaml: string;
  body: string;
}

export interface Preview {
  id: string;
  name: string;
  theme: Theme;
  flavor?: string;
}

export interface DesignSources {
  guidelines: string;
  themes: Theme[];
  previews: Preview[];
  templates: { design: string; skill: string };
  imageSizes: Record<string, { width: number; height: number }>;
}

export interface ValueRow {
  path: string;
  value: string;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Refuse incomplete specifications instead of publishing silently empty tables. */
export function parseTheme(id: string, source: string): Theme {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`${id}: DESIGN.md requires YAML front matter`);
  const values = parse(match[1]);
  if (!isRecord(values)) throw new Error(`${id}: front matter must be a mapping`);
  for (const key of ['name', 'description', 'version']) {
    if (typeof values[key] !== 'string' || !values[key].trim()) {
      throw new Error(`${id}: missing ${key}`);
    }
  }
  for (const group of VALUE_GROUPS) {
    if (!isRecord(values[group]) || !Object.keys(values[group]).length) {
      throw new Error(`${id}: missing value group ${group}`);
    }
  }
  if (!/^## /m.test(match[2])) throw new Error(`${id}: missing specification sections`);
  return {
    id,
    name: String(values.name),
    description: String(values.description),
    version: String(values.version),
    values,
    yaml: match[1],
    body: match[2].trim(),
  };
}

/** Flatten all leaves, including future nested groups and arrays, without losing a value. */
export function valueRows(value: unknown, path = ''): ValueRow[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => valueRows(item, `${path}[${index}]`));
  }
  if (isRecord(value) && Object.keys(value).length) {
    return Object.entries(value).flatMap(([key, item]) =>
      valueRows(item, path ? `${path}.${key}` : key)
    );
  }
  return [{ path, value: value === null ? 'null' : String(value) }];
}

/** Project a numbered guidelines section while ignoring heading-like text in fenced examples. */
export function guidelineSection(source: string, number: number): string {
  const lines = source.split('\n');
  let start = -1;
  let fence = '';
  for (let index = 0; index < lines.length; index++) {
    const delimiter = lines[index].match(/^ {0,3}(`{3,}|~{3,})/);
    if (delimiter) {
      if (!fence) fence = delimiter[1];
      else if (delimiter[1][0] === fence[0] && delimiter[1].length >= fence.length) fence = '';
      continue;
    }
    if (fence) continue;
    const heading = lines[index].match(/^## (\d+)\. /);
    if (!heading) continue;
    if (start >= 0) return lines.slice(start, index).join('\n').trim();
    if (Number(heading[1]) === number) start = index;
  }
  if (start < 0) throw new Error(`GUIDELINES.md: missing section ${number}`);
  return lines.slice(start).join('\n').trim();
}

export function themeUrl(id: string): string {
  return `${DESIGN_ROOT}themes/${id}/`;
}

/** Studio flavors are authored in the specification, not a second hand-maintained catalog. */
export function themePreviews(themes: Theme[]): Preview[] {
  return themes.flatMap((theme) => {
    if (theme.id !== 'studio') return [{ id: theme.id, name: theme.name, theme }];
    const flavors = theme.body.match(/^## Flavors\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1];
    if (!flavors) throw new Error('studio: missing Flavors section');
    const headings = [...flavors.matchAll(/^### ([A-Za-z]+)\s/gm)];
    if (!headings.length) throw new Error('studio: missing flavor headings');
    return headings.map((match) => ({
      id: `studio-${match[1].toLowerCase()}`,
      name: `Studio · ${match[1]}`,
      theme,
      flavor: match[1].toLowerCase(),
    }));
  });
}

/** Build-time adapter: canonical text and supplied images are the only content inputs. */
export async function loadDesignSources(): Promise<DesignSources> {
  const root = new URL('../../design-system/', import.meta.url);
  const guidelines = await Deno.readTextFile(new URL('GUIDELINES.md', root));
  const directories: string[] = [];
  for await (const entry of Deno.readDir(new URL('themes/', root))) {
    if (entry.isDirectory && !entry.name.startsWith('_')) directories.push(entry.name);
  }
  // The canonical catalogue owns language order; newly added folders follow it alphabetically.
  const catalogue = guidelineSection(guidelines, 6).toLowerCase();
  const rank = (id: string) => {
    const position = catalogue.search(new RegExp(`\\| ${id}\\b`, 'i'));
    return position < 0 ? Number.MAX_SAFE_INTEGER : position;
  };
  directories.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const themes = await Promise.all(directories.map(async (id) => {
    await Deno.stat(new URL(`themes/${id}/SKILL.md`, root));
    return parseTheme(id, await Deno.readTextFile(new URL(`themes/${id}/DESIGN.md`, root)));
  }));
  const previews = themePreviews(themes);
  const dimensions: unknown = JSON.parse(
    await Deno.readTextFile(new URL('../assets/design-system/dimensions.json', import.meta.url)),
  );
  if (!isRecord(dimensions)) throw new Error('Image dimensions must be a mapping');
  const imageSizes: DesignSources['imageSizes'] = {};
  for (const [file, size] of Object.entries(dimensions)) {
    if (!isRecord(size) || typeof size.width !== 'number' || typeof size.height !== 'number') {
      throw new Error(`Invalid image dimensions: ${file}`);
    }
    imageSizes[file] = { width: size.width, height: size.height };
  }
  for (const preview of previews) {
    for (const scheme of SCHEMES) {
      const file = `${preview.id}--${scheme}.webp`;
      await Deno.stat(new URL(`../assets/design-system/${file}`, import.meta.url));
      const size = imageSizes[file];
      if (
        !size || !Number.isInteger(size.width) || !Number.isInteger(size.height) ||
        size.width <= 0 || size.height <= 0
      ) {
        throw new Error(`Missing or invalid image dimensions: ${file}`);
      }
    }
  }
  return {
    guidelines,
    themes,
    previews,
    templates: {
      design: await Deno.readTextFile(new URL('themes/_template/DESIGN.md', root)),
      skill: await Deno.readTextFile(new URL('themes/_template/SKILL.md', root)),
    },
    imageSizes,
  };
}
