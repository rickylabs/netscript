import { resolve } from '@std/path';
import { normalize as posixNormalize } from '@std/path/posix';

import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { UiRegistryItem, UiRegistryManifest } from './registry.ts';

/** Write the target app's Fresh UI stylesheet aggregator. */
export async function writeStylesAggregator(input: {
  readonly registryRoot?: string;
  readonly registryContent?: Readonly<Record<string, string>>;
  readonly projectRoot: string;
  readonly manifest: UiRegistryManifest;
  readonly items: readonly UiRegistryItem[];
  readonly fs: FileSystemPort;
}): Promise<string> {
  const themeItem = input.items.find((item) => item.kind === 'theme') ??
    input.manifest.items.find((item) => item.kind === 'theme');
  if (!themeItem) {
    throw new Error('Fresh UI registry manifest does not declare a theme item.');
  }
  const themeStylesSource = themeEntryStylesSource(themeItem);
  const themeStyles = input.registryContent
    ? readRegistryContent(input.registryContent, themeStylesSource)
    : await input.fs.readFile(resolve(input.registryRoot ?? '', themeStylesSource));
  const itemImports = input.items.flatMap((item) =>
    item.css?.map((entry) => entry.content.trim()).filter((content) =>
      content.startsWith('@import ')
    ) ?? []
  );
  const target = resolve(input.projectRoot, 'assets', 'styles.css');
  // Preserve CSS imports registered by earlier installs so that an incremental
  // `ui:add <item|collection>` appends its imports instead of regenerating the
  // aggregator from the theme base and dropping the foundation's imports.
  const existingImports = await readExistingPerItemImports(input.fs, target, themeStyles);
  const cssImports = [...new Set([...existingImports, ...itemImports])];
  const styles = composeStylesAggregator(themeStyles, cssImports);
  await input.fs.writeFile(target, styles);
  return target;
}

/**
 * Read the per-item `@import` lines a previous install wrote into the target
 * aggregator. Theme-base imports (the ones the theme's own `styles.css` ships)
 * are excluded so they are not duplicated below the generated marker.
 */
async function readExistingPerItemImports(
  fs: FileSystemPort,
  target: string,
  themeStyles: string,
): Promise<readonly string[]> {
  if (!(await fs.exists(target))) {
    return [];
  }
  const baseImports = new Set(
    themeStyles.replace(/\r\n/g, '\n').split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('@import ')),
  );
  const existing = await fs.readFile(target);
  return existing.replace(/\r\n/g, '\n').split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('@import ') && !baseImports.has(line));
}

function themeEntryStylesSource(themeItem: UiRegistryItem): string {
  const entry = themeItem.files.find((file) => file.target.endsWith('styles.css'));
  if (!entry) {
    throw new Error(`Fresh UI theme "${themeItem.name}" does not ship a styles.css entry file.`);
  }
  return entry.source;
}

function readRegistryContent(
  registryContent: Readonly<Record<string, string>>,
  source: string,
): string {
  const content = registryContent[posixNormalize(source)];
  if (content === undefined) {
    throw new Error(`Fresh UI registry content is missing: ${source}`);
  }
  return content;
}

function composeStylesAggregator(themeStyles: string, cssImports: readonly string[]): string {
  const lines = themeStyles.replace(/\r\n/g, '\n').split('\n');
  const importLines: string[] = [];
  let index = 0;
  while (index < lines.length && lines[index].startsWith('@import ')) {
    importLines.push(lines[index]);
    index += 1;
  }
  while (index < lines.length && lines[index].trim() === '') index += 1;
  const rest = lines.slice(index).join('\n').trimEnd();
  const importBlock = [
    ...importLines,
    '',
    '/* Per-item CSS - ui:init writes these @import lines. */',
    ...cssImports,
    '',
  ].join('\n');
  return `${importBlock}${rest}\n\n/* App-specific custom styles below. */\n`;
}
