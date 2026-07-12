import { green, red } from '@std/fmt/colors';

import { failDeployCommand } from '../../../../kernel/adapters/deploy/deploy-exit.ts';
import type {
  DeployOperation,
  DeployTargetRequestConfig,
} from '../../../../kernel/domain/deploy/deploy-target-port.ts';
import { outputError, outputText } from '../../../../kernel/presentation/output/default-output.ts';
import type { PublicCommandDependencies } from '../../root/public-command-dependencies.ts';

/** Parsed options shared by target lifecycle and secrets commands. */
export interface TargetOperationOptions {
  readonly projectRoot?: string;
  readonly outputDir?: string;
  readonly environment?: string;
  readonly clearCache?: boolean;
  readonly nonInteractive?: boolean;
  readonly secrets?: { operation: 'set' | 'get' | 'list'; key?: string; value?: string };
}

/** Route one parsed operation to the registry-resolved target adapter. */
export async function runTargetOperation(
  dependencies: PublicCommandDependencies,
  key: string,
  operation: DeployOperation,
  options: TargetOperationOptions,
): Promise<void> {
  const target = dependencies.deployTargets.get(key);
  if (!target || typeof target[operation] !== 'function') {
    outputError(red(`✗ Deploy target '${key}' does not support '${operation}'.`));
    failDeployCommand(`Unsupported deploy operation: ${key} ${operation}`);
  }
  const projectRoot = await dependencies.resolveProjectRoot(options.projectRoot);
  if (!projectRoot) {
    outputError(red('✗ Could not resolve a project root. Pass --project-root.'));
    failDeployCommand('Deploy command failed: project root not found.');
  }
  const targetConfig = await resolveTargetConfig(dependencies, key, projectRoot);
  try {
    const result = await target[operation]!({
      projectRoot,
      outputDir: options.outputDir ?? targetConfig?.outputPath,
      environment: options.environment,
      clearCache: options.clearCache,
      nonInteractive: options.nonInteractive,
      targetConfig,
      secrets: options.secrets,
    });
    outputText(green(`✓ ${result.message}`));
  } catch (error: unknown) {
    outputError(red(`✗ ${error instanceof Error ? error.message : String(error)}`));
    failDeployCommand('Deploy command failed.', { cause: error });
  }
}

async function resolveTargetConfig(
  dependencies: PublicCommandDependencies,
  key: string,
  projectRoot: string,
): Promise<DeployTargetRequestConfig | undefined> {
  try {
    const config = await dependencies.loadConfig({ cwd: projectRoot });
    const targets = config.deploy?.targets as
      | Record<string, DeployTargetRequestConfig | undefined>
      | undefined;
    const targetConfig = targets?.[key];
    const appHost = targetConfig?.appHost ?? config.aspire?.appHost;
    return targetConfig || appHost ? { ...targetConfig, appHost } : undefined;
  } catch {
    return undefined;
  }
}
