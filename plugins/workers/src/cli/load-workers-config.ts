import { loadConfig } from '@netscript/config';
import { type WorkersConfigData, WorkersConfigSchema } from '@netscript/plugin-workers-core/config';

/** Load and normalize project policy; missing project configuration means no policy. */
export async function loadWorkersConfig(
  projectRoot: string,
): Promise<WorkersConfigData | undefined> {
  let workersSection: unknown;
  try {
    workersSection = (await loadConfig({ cwd: projectRoot })).workers;
  } catch (error) {
    if (isMissingProjectConfig(error)) return undefined;
    throw new Error(
      `Failed to load NetScript configuration from ${projectRoot}: ${errorMessage(error)}`,
      { cause: error },
    );
  }

  try {
    return WorkersConfigSchema.parse(workersSection);
  } catch (error) {
    throw new Error(
      `Invalid workers configuration in ${projectRoot}: ${errorMessage(error)}`,
      { cause: error },
    );
  }
}

function isMissingProjectConfig(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith('No config file found.');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
