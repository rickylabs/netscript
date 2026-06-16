import { resolve } from '@std/path';

import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { UiRegistryItem, UiRegistryManifest } from './registry.ts';

/** Write the target app's Fresh UI stylesheet aggregator. */
export async function writeStylesAggregator(input: {
  readonly registryRoot: string;
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
  const themeStylesPath = themeEntryStylesSource(input.registryRoot, themeItem);
  const themeStyles = await input.fs.readFile(themeStylesPath);
  const cssImports = [
    ...new Set(
      input.items.flatMap((item) =>
        item.css?.map((entry) => entry.content.trim()).filter((content) =>
          content.startsWith('@import ')
        ) ?? []
      ),
    ),
  ];
  const styles = composeStylesAggregator(themeStyles, cssImports);
  const target = resolve(input.projectRoot, 'assets', 'styles.css');
  await input.fs.writeFile(target, styles);
  return target;
}

function themeEntryStylesSource(registryRoot: string, themeItem: UiRegistryItem): string {
  const entry = themeItem.files.find((file) => file.target.endsWith('styles.css'));
  if (!entry) {
    throw new Error(`Fresh UI theme "${themeItem.name}" does not ship a styles.css entry file.`);
  }
  return resolve(registryRoot, entry.source);
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
