import { Command } from '@cliffy/command';
import {
  decodeUiPreset,
  UiPresetSchema,
  uiPresetUrl,
} from '../../../../../kernel/domain/ui/ui-preset.ts';
import { outputText } from '../../../../../kernel/presentation/output/default-output.ts';

/** Create offline preset decoding and shareable URL commands. */
export function createUiPresetCommand(print: (message: string) => void = outputText) {
  const decode = new Command().arguments('<code:string>').action((_options, code: string) => {
    print(JSON.stringify(decodeUiPreset(code), null, 2));
  });
  const url = new Command().arguments('[code:string]')
    .option('--theme <id:string>', 'Token preset id').option(
      '--style <reference:string>',
      'Style registry item',
    )
    .option('--font <reference:string>', 'Font registry item').option(
      '--icon-library <name:string>',
      'Icon library',
    )
    .action((options, code?: string) => {
      const preset = UiPresetSchema.parse({
        ...(code ? decodeUiPreset(code) : { version: 1, theme: 'studio-utility' }),
        ...(options.theme ? { theme: options.theme } : {}),
        ...(options.style ? { style: options.style } : {}),
        ...(options.font ? { font: options.font } : {}),
        ...(options.iconLibrary ? { iconLibrary: options.iconLibrary } : {}),
      });
      print(uiPresetUrl(preset));
    });
  return new Command().name('ui:preset').description('Decode and share UI presets').command(
    'decode',
    decode,
  ).command('url', url);
}
