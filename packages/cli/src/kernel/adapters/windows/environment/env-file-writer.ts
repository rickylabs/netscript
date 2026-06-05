import { join } from '@std/path';
import type { InfrastructureConfig } from '../../../domain/infrastructure-config.ts';
import type { CompileTarget } from '../../../domain/deploy/compile-target.ts';
import { generateEnvFileContent } from './env-file-content.ts';
import { readTemplateAsset } from '../../templates/template-asset.ts';

/** Write Windows deployment environment files to the deploy root. */
const ENV_TEMPLATE = new URL('../../assets/windows/env.template', import.meta.url);

// ============================================================================
// FILE WRITERS
// ============================================================================

/**
 * Write the `.env` file to the DEPLOY ROOT directory (NOT config/).
 *
 * Location: `.deploy/windows/.env`
 *
 * This is where the standalone script writes it and where operators
 * expect to find it on the target machine.
 *
 * @param deployDir  Absolute path to .deploy/windows/
 * @param allTargets All compiled service targets
 * @param infra      Resolved infrastructure config
 * @param connectionStrings  Raw connection strings from appsettings.json
 * @param options    Additional options (version, install dir, ports)
 * @returns Absolute path of the written file
 */
export async function writeEnvFile(
  deployDir: string,
  allTargets: CompileTarget[],
  infra: InfrastructureConfig,
  connectionStrings: Record<string, string>,
  options?: {
    version?: string;
    installDir?: string;
    dashboardPort?: number;
    dashboardOtlpPort?: number;
    otlpEndpoint?: string;
    otlpProtocol?: string;
  },
): Promise<string> {
  const content = generateEnvFileContent(allTargets, infra, connectionStrings, options ?? {});
  // Write to deploy ROOT, not config/
  const envPath = join(deployDir, '.env');
  await Deno.writeTextFile(envPath, content);
  return envPath;
}

/**
 * Write the `.env.template` file to the deploy root directory.
 *
 * Location: `.deploy/windows/.env.template`
 *
 * @param deployDir  Absolute path to .deploy/windows/
 * @returns Absolute path of the written file
 */
export async function writeEnvTemplate(
  deployDir: string,
): Promise<string> {
  const content = await readTemplateAsset(ENV_TEMPLATE);
  const templatePath = join(deployDir, '.env.template');
  await Deno.writeTextFile(templatePath, content);
  return templatePath;
}
