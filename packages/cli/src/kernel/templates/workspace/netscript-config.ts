import { SCAFFOLD_DEFAULTS } from '../../constants/scaffold/scaffold-defaults.ts';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import type { NetScriptConfigGenOptions } from '../../domain/scaffold/scaffold-options.ts';
import { TEMPLATE_KEYS } from '../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../adapters/templates/template-asset.ts';

/**
 * Generates the `netscript.config.ts` file content for a new workspace.
 *
 * Produces a valid TypeScript source file that imports `defineConfig` from
 * either a local path or the published `@netscript/config` package, depending
 * on the chosen import mode.
 *
 * @param options - Configuration options controlling the generated output.
 * @returns A string containing valid TypeScript source code for `netscript.config.ts`.
 */
export function generateNetScriptConfig(options: NetScriptConfigGenOptions): string {
  const jsrComment = options.importMode === 'jsr'
    ? `// TODO: When @netscript packages are published to JSR, this import will resolve.\n` +
      `// For local monorepo development, re-run with: netscript init workspace-source\n`
    : '';

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedWorkspaceNetscriptConfig1, {
    __slot0__: String(jsrComment),
    __slot1__: "'@netscript/config'",
    __slot2__: String(options.name),
    __slot3__: String(SCAFFOLD_DEFAULTS.VERSION),
    __slot4__: String(SCAFFOLD_DIRS.SERVICES),
    __slot5__: String(SCAFFOLD_DIRS.APPS),
    __slot6__: String(SCAFFOLD_DIRS.CONTRACTS),
    __slot7__: String(SCAFFOLD_DIRS.PLUGINS),
    __slot8__: String(SCAFFOLD_DEFAULTS.LOG_LEVEL),
    __slot9__: String(SCAFFOLD_DEFAULTS.LOG_FORMAT),
    __slot10__: String(SCAFFOLD_DEFAULTS.ASPIRE_APPHOST_PATH),
  });
}
