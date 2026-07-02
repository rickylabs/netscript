/**
 * @module
 *
 * Generator for `.helpers/register-tools.mts` — registers development tools
 * (e.g., Prisma Studio) with the Aspire SDK builder via `addExecutable()`.
 *
 * Tools are simple `deno task` wrappers and do NOT use `addDenoApp()`.
 * Each tool is registered as:
 * ```ts
 * builder.addExecutable(name, 'deno', workdir, ['task', taskName]);
 * ```
 *
 * Tools may optionally depend on a specific named database or fall back to
 * the primary database from infrastructure context.
 */

import type { RegisterToolsOptions } from '../types.ts';
import { fileHeader, safeIdentifier } from '../_utils.ts';
import { SCAFFOLD_ASPIRE_MODULES } from '../../../../constants/scaffold/scaffold-aspire.ts';
import { SCAFFOLD_DIRS } from '../../../../constants/scaffold/scaffold-dirs.ts';
import { TEMPLATE_KEYS } from '../../../../assets/manifest.ts';
import { renderTemplateAssetSync } from '../../../../adapters/templates/template-asset.ts';

/**
 * Generates the register-tools.mts file content.
 *
 * @param options - Tool entries from parsed config
 * @returns Generated TypeScript source as a string
 */
export function generateRegisterTools(options: RegisterToolsOptions): string {
  const { tools } = options;
  const entries = Object.entries(tools);

  const registrationBlocks: string[] = [];

  for (const [name, entry] of entries) {
    const id = safeIdentifier(name);
    const taskName = entry.TaskName ?? name;
    const workdir = `${SCAFFOLD_DIRS.TOOLS}/${name}`;
    const databaseKey = entry.Database ?? '';

    const lines: string[] = [];
    lines.push(`  // --- ${name} ---`);

    // Skip disabled entries
    lines.push(`  if (config.Tools['${name}']?.Enabled !== false) {`);

    // Resolve working directory
    if (name === 'prisma-studio') {
      lines.push(
        `    const ${id}_workdir = resolvePrismaStudioWorkdir(appHostDir, config, '${databaseKey}');`,
      );
    } else {
      lines.push(`    const ${id}_workdir = resolveWorkspacePath(appHostDir, '${workdir}');`);
    }

    // Register via addExecutable — tools are deno task wrappers
    lines.push(
      `    let ${id} = await builder.addExecutable('${name}', 'deno', ${id}_workdir, ['task', '--minimum-dependency-age=0', '${taskName}']);`,
    );
    lines.push(`    ${id} = await maybeWithProcessCommand(${id}, '${name}', '${taskName}');`);

    // Database dependency — named database or primary fallback
    if (entry.Database) {
      lines.push(``);
      lines.push(`    // Named database dependency: ${entry.Database}`);
      lines.push(
        `    ${id} = await attachToolDatabase(${id}, config, infrastructure, '${entry.Database}');`,
      );
    } else {
      lines.push(``);
      lines.push(`    // Primary database dependency (fallback)`);
      lines.push(`    ${id} = await attachToolDatabase(${id}, config, infrastructure);`);
    }

    lines.push(`  }`);

    registrationBlocks.push(lines.join('\n'));
  }

  return renderTemplateAssetSync(TEMPLATE_KEYS.generatedAspireHelpersGenerateRegisterTools1, {
    __slot0__: String(fileHeader('register-tools.mts')),
    __slot1__: String(SCAFFOLD_ASPIRE_MODULES.SDK_IMPORT_FROM_HELPERS),
    __slot2__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
    __slot3__: String(SCAFFOLD_ASPIRE_MODULES.ASPIRE_COMPAT_IMPORT),
    __slot4__: String(
      registrationBlocks.length > 0 ? registrationBlocks.join('\n\n') : '  // No tools configured',
    ),
    __slot5__: String(SCAFFOLD_DIRS.TOOLS),
    __slot6__: String(SCAFFOLD_DIRS.TOOLS),
  });
}
