import { Command } from '@cliffy/command';
import { applyUiPreset } from '../../../../kernel/application/ui/v2/apply-preset.ts';
import type { UiRegistryDependencies } from '../../../../kernel/application/ui/v2/registry-client.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { requireUiAppRoot, type UiAppRootResolver } from '../../../presentation/support.ts';

/** Create the app-owned preset operation with injected registry/token edges. */
export function createUiApplyCommand(deps: {
  readonly installDependencies: UiRegistryDependencies;
  readonly resolveUiAppRoot: UiAppRootResolver;
  readonly print?: (message: string) => void;
}) {
  const print = deps.print ?? outputText;
  return new Command()
    .name('ui:apply')
    .description('Apply a token preset, font, or component style to a Fresh app')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--app <name:string>', 'Fresh app workspace name')
    .option(
      '--preset <code:string>',
      'Preset code, share URL, theme/preset JSON URL, or token preset id',
      {
        required: true,
      },
    )
    .option('--only <parts:string>', 'Limit changes to theme, font, or theme,font')
    .option('--json', 'Emit structured application results')
    .action(async (options) => {
      const root = await requireUiAppRoot(deps.resolveUiAppRoot, options);
      const result = await applyUiPreset(
        { root, preset: options.preset, only: options.only },
        deps.installDependencies,
      );
      if (options.json) print(JSON.stringify(result, null, 2));
      else {
        print(`Applied UI preset; component style: ${result.style}.`);
        for (const file of result.files) print(`Built ${file}`);
      }
    });
}
