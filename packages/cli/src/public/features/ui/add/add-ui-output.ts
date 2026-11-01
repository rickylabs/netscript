import type { UiScaffoldResult } from '../../../../kernel/application/ui/page/web-scaffold.ts';
import type { UiRegistryInstallPlan } from '../../../../kernel/application/ui/v2/install-registry.ts';

/** Render scaffold plans without exposing filesystem adapters to command presentation. */
export function reportScaffold(
  result: UiScaffoldResult,
  dryRun: boolean,
  print: (message: string) => void,
): void {
  const verb = dryRun ? 'Planned' : 'Generated';
  for (const file of result.files) print(`${verb} ${file.role}: ${file.path}`);
  for (const step of result.nextSteps) print(`Next: ${step}`);
}

/** Render installed-file counts or explicit read-only diffs without printing authentication settings. */
export function reportUiRegistry(
  result: UiRegistryInstallPlan,
  options: { diff?: boolean; json?: boolean },
  print: (message: string) => void,
): void {
  if (options.json) {
    print(
      JSON.stringify(
        {
          items: result.entries.map((entry) => entry.ref),
          copiedFiles: result.copiedFiles,
          drifted: result.drifted,
          diffs: result.diffs,
        },
        null,
        2,
      ),
    );
  } else if (options.diff) {
    if (!result.diffs.length) print('No registry file differences.');
    for (const diff of result.diffs) {
      print(`${diff.localEdited ? 'local-edit' : 'upstream'}\t${diff.path}`);
      if (diff.localDiff) print(diff.localDiff);
      if (diff.registryDiff) print(diff.registryDiff);
    }
  } else {
    print(`Installed ${result.entries.length} Fresh UI registry items.`);
    print(`Copied ${result.copiedFiles.length} files.`);
    for (const path of result.drifted) print(`Skipped locally edited copy: ${path}`);
  }
}
