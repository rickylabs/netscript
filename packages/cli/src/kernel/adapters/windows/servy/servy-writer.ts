/** Write Servy XML config files for Windows deployment targets. */
import { join } from '@std/path';
import type { CompileTarget } from '../../../domain/deploy/compile-target.ts';
import { buildServyConfig, type BuildServyConfigOptions } from './servy-config.ts';
import { generateServyXml } from './servy-xml.ts';

// ============================================================================
// BATCH WRITER
// ============================================================================

/**
 * Generate and write Servy XML files for all compile targets.
 *
 * @param targets - Compile targets to generate configs for
 * @param configDir - Directory to write XML files into (.deploy/windows/config/)
 * @param options - Servy config build options
 * @returns Array of written file paths
 */
export async function writeServyConfigs(
  targets: CompileTarget[],
  configDir: string,
  options: BuildServyConfigOptions,
): Promise<string[]> {
  await Deno.mkdir(configDir, { recursive: true });

  const written: string[] = [];

  for (const target of targets) {
    const servyConfig = buildServyConfig(target, options);
    const xml = generateServyXml(servyConfig);
    const xmlPath = join(configDir, `${target.name}.xml`);
    await Deno.writeTextFile(xmlPath, xml);
    written.push(xmlPath);
  }

  return written;
}
