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
import { fileHeader } from '../_utils.ts';
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

  for (const [toolIndex, [name, entry]] of entries.entries()) {
    const id = `tool_${toolIndex}`;
    const taskName = entry.TaskName ?? name;
    const workdir = `${SCAFFOLD_DIRS.TOOLS}/${name}`;
    const databaseKey = entry.Database ?? '';

    const lines: string[] = [];
    lines.push(`  // --- tool ${toolIndex} ---`);

    // Skip disabled entries
    lines.push(`  if (config.Tools[${JSON.stringify(name)}]?.Enabled !== false) {`);

    // Resolve working directory
    if (name === 'prisma-studio') {
      lines.push(
        `    const ${id}_workdir = resolvePrismaStudioWorkdir(appHostDir, config, ${
          JSON.stringify(databaseKey)
        });`,
      );
    } else {
      lines.push(
        `    const ${id}_workdir = resolveWorkspacePath(appHostDir, ${JSON.stringify(workdir)});`,
      );
    }

    lines.push(
      `    const ${id}_errorFile = resolveToolErrorFile(${id}_workdir, ${JSON.stringify(name)});`,
    );
    lines.push(`    await rm(${id}_errorFile, { force: true });`);

    // Register via the generated runner so the first stderr line remains
    // available after a failed executable exits.
    lines.push(
      `    let ${id} = await builder.addExecutable(${
        JSON.stringify(name)
      }, 'deno', ${id}_workdir, ['run', '--allow-run', '--allow-write', toolRunnerPath, ${id}_errorFile, ${
        JSON.stringify(taskName)
      }]);`,
    );
    // Database dependency — named database or primary fallback
    if (entry.Database) {
      lines.push(``);
      lines.push(`    // Named database dependency`);
      lines.push(
        `    ${id} = await attachToolDatabase(${id}, config, infrastructure, ${
          JSON.stringify(entry.Database)
        });`,
      );
    } else {
      lines.push(``);
      lines.push(`    // Primary database dependency (fallback)`);
      lines.push(`    ${id} = await attachToolDatabase(${id}, config, infrastructure);`);
    }

    lines.push(``);
    lines.push(`    monitorToolFailure(builder, ${id}, ${id}_errorFile);`);

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
