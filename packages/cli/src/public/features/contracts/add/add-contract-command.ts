import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
/**
 * @module public/features/contract-add-command
 *
 * Cliffy command for adding a contract to an existing workspace.
 */

import { Command } from '@cliffy/command';
import { join } from '@std/path';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { Scaffolder } from '../../../../kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { createContractScaffolder } from '../../../../kernel/adapters/contracts/contract-scaffolder.ts';
import { DefaultContractTemplateRegistry } from '../../../../kernel/adapters/contracts/templates/contract-template-registry.ts';
import { DEFAULT_CONTRACT_VERSION } from '../../../../kernel/adapters/contracts/types.ts';
import { ContractVersionRegistry } from '../../../../kernel/adapters/contracts/version-registry.ts';
import { ContractWorkspaceResolver } from '../../../../kernel/adapters/contracts/workspace-resolver.ts';
import { findProjectRoot } from '../../../../kernel/adapters/config/deploy-config.ts';
import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../../../kernel/constants/scaffold/scaffold-files.ts';
import { SCAFFOLD_VALIDATION } from '../../../../kernel/constants/scaffold/scaffold-validation.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { AddContractInput } from './add-contract-input.ts';

function assertContractName(name: string): void {
  if (!SCAFFOLD_VALIDATION.NAME_PATTERN.test(name)) {
    throw new ScaffoldValidationError(
      `Invalid contract name "${name}". Names must be kebab-case and start with a letter.`,
      { name },
    );
  }
}

async function resolveProjectRoot(pathFlag: string | undefined): Promise<string> {
  const projectRoot = pathFlag ? await findProjectRoot(pathFlag) : await findProjectRoot();
  if (projectRoot === null) {
    throw new ScaffoldValidationError(
      'NetScript workspace root not found. Run this command inside a workspace or pass --path.',
    );
  }
  return projectRoot;
}

async function readProjectName(projectRoot: string, fs: DenoFileSystem): Promise<string> {
  const contractsDenoJson = join(
    projectRoot,
    SCAFFOLD_DIRS.CONTRACTS,
    SCAFFOLD_FILES.DENO_JSON,
  );
  const content = await fs.readFile(contractsDenoJson);
  const config = JSON.parse(content) as Record<string, unknown>;
  const packageName = typeof config.name === 'string' ? config.name : undefined;
  const match = packageName?.match(/^@([^/]+)\/contracts$/);
  if (!match) {
    throw new ScaffoldValidationError(
      `Unable to infer project name from ${contractsDenoJson}. Expected @<project>/contracts.`,
      { packageName },
    );
  }
  return match[1];
}

/** `netscript contract add` command. */
export const contractAddCommand: Command<any, any, any, any, any, any, any, any> = new Command()
  .name('add')
  .description('Add a v1 contract to an existing NetScript workspace')
  .arguments('<name:string>')
  .option('--version <version:string>', 'Contract version to target', {
    default: DEFAULT_CONTRACT_VERSION,
  })
  .option('--path <path:string>', 'Workspace path to search from')
  .option('--force', 'Overwrite an existing contract file', { default: false })
  .action(async (flags: AddContractInput, name: string): Promise<void> => {
    assertContractName(name);
    if (flags.version !== DEFAULT_CONTRACT_VERSION) {
      throw new ScaffoldValidationError(
        `Unsupported contract version "${flags.version}". Only ${DEFAULT_CONTRACT_VERSION} is supported.`,
        { version: flags.version },
      );
    }

    const fs = new DenoFileSystem();
    const projectRoot = await resolveProjectRoot(flags.path);
    const projectName = await readProjectName(projectRoot, fs);
    const template = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(template, fs);
    const contractScaffolder = createContractScaffolder({
      scaffolder,
      templateAdapter: template,
      templateRegistry: new DefaultContractTemplateRegistry(),
      versionRegistry: new ContractVersionRegistry(fs),
      workspaceResolver: new ContractWorkspaceResolver(fs),
    });

    const result = await contractScaffolder.addServiceContract(
      {
        projectName,
        targetPath: projectRoot,
        importMode: 'jsr',
        force: flags.force ?? false,
      },
      {
        serviceName: name,
        version: DEFAULT_CONTRACT_VERSION,
      },
    );

    const created = result.scaffoldResult.filesCreated.length;
    const skipped = result.scaffoldResult.filesSkipped.length;
    outputText(`Added contract "${name}" (${created} written, ${skipped} skipped).`);
  });
