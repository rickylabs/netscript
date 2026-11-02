import { decodeUiPreset } from '../../../packages/cli/src/kernel/domain/ui/ui-preset.ts';
import { COMPONENT_STYLES, type PresetCatalog } from './catalog.ts';

/** Reject choices the local CLI cannot reproduce instead of silently discarding them. */
export function supportedPreset(input: string, catalog: PresetCatalog): string {
  const choice = decodeUiPreset(input);
  if (!catalog.presets.some((preset) => preset.id === choice.theme)) {
    throw new Error('Choose a shipped theme preset.');
  }
  if (choice.style && !COMPONENT_STYLES.some((style) => style.id === choice.style)) {
    throw new Error('Only Utility component style is available.');
  }
  if (choice.font || choice.iconLibrary) {
    throw new Error('This builder uses the fonts and glyphs supplied by each preset.');
  }
  return choice.theme!;
}
