import { dirname, join } from '@std/path';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import type { ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
import { generateDenoJson } from '../../templates/workspace/deno-json.ts';
import { generateTsConfig } from '../../templates/workspace/tsconfig.ts';
import { generateNetScriptConfig } from '../../templates/workspace/netscript-config.ts';
import { generateReadme } from '../../templates/workspace/generate-readme.ts';
import { generateAspireCliTaskRunner } from '../../templates/workspace/aspire-cli-task.ts';
import { generateNodeModulesVerifier } from '../../templates/workspace/node-modules-verifier.ts';
import { generateDependencyClosureVerifier } from '../../templates/workspace/dependency-closure-verifier.ts';
import { generateQualityRunner } from '../../templates/workspace/quality-runner.ts';
import { generatePackageJson } from '../../templates/workspace/package-json.ts';
import { generateEditorConfigFiles } from '../../adapters/scaffold/editor-config.ts';
import { loadRootScaffoldTemplateAssets } from '../../adapters/templates/scaffold-template-assets.ts';
import { generateAppsettings } from '../../templates/aspire/generate-appsettings.ts';
import type { InitPipelineContext } from './context.ts';
import { createScaffoldPlan } from '../../domain/scaffold/scaffold-plan.ts';
import { netscriptJsrSpecifier } from '../../constants/jsr-specifiers.ts';

function generateAppStubDenoJson(name: string, appName: string): string {
  const config = {
    name: `@${name}/${appName}`,
    version: '0.0.0',
    exports: './main.ts',
  };
  return JSON.stringify(config, null, 2) + '\n';
}

function generateScaffoldSmokeTest(): string {
  return `Deno.test('generated workspace is testable', () => {});
`;
}

export async function scaffoldRoot(
  context: InitPipelineContext,
  options: ValidatedInitOptions,
): Promise<ScaffoldResult> {
  const start = performance.now();
  const filesCreated: string[] = [];
  const directoriesCreated: string[] = [];
  const filesSkipped: string[] = [];
  const targetPath = options.targetPath;
  const plan = createScaffoldPlan(options, {
    useWorkspacePackages: context.packagesAsWorkspaceMembers(options),
  });
  const {
    bareMetalDeployWorkflowTemplate,
    composeGhcrDeployWorkflowTemplate,
    denoDeployWorkflowTemplate,
    gitignoreTemplate,
  } = await loadRootScaffoldTemplateAssets();

  // Create root directory
  await context.scaffolder.createDir(targetPath);
  directoriesCreated.push(targetPath);

  // Scaffold apps/{appName}/ stub so the workspace member resolves.
  // Deno errors if a workspace array entry points to a directory that does
  // not contain a deno.json. Plan 2 will replace this stub with the real app.
  const appsDir = join(targetPath, SCAFFOLD_DIRS.APPS);
  await context.scaffolder.createDir(appsDir);
  directoriesCreated.push(appsDir);
  const appDir = join(appsDir, options.appName);
  await context.scaffolder.createDir(appDir);
  directoriesCreated.push(appDir);
  const appStubPath = join(appDir, SCAFFOLD_FILES.DENO_JSON);
  if (
    await context.scaffolder.writeFile(
      appStubPath,
      generateAppStubDenoJson(options.name, options.appName),
      options.force,
    )
  ) {
    filesCreated.push(appStubPath);
  } else {
    filesSkipped.push(appStubPath);
  }

  // 1. deno.json (Tier 1 — programmatic). Include services/<name> as a
  //    workspace member whenever the user opted in to the example service.
  const denoJsonContent = generateDenoJson({
    name: plan.name,
    appName: plan.appName,
    workspaceMembers: [...plan.workspaceMembers],
    importMode: options.importMode,
    localBase: options.localBase,
    // When the monorepo was detected we also copied packages/* into the
    // scaffold — enrol them as workspace members and drop the root
    // imports map accordingly.
    packagesAsWorkspaceMembers: plan.useWorkspacePackages,
    dbEngines: [...plan.dbEngines],
    noAspire: options.noAspire,
  });
  const denoJsonPath = join(targetPath, SCAFFOLD_FILES.DENO_JSON);
  if (
    await context.scaffolder.writeFile(
      denoJsonPath,
      denoJsonContent,
      options.force,
    )
  ) {
    filesCreated.push(denoJsonPath);
  } else {
    filesSkipped.push(denoJsonPath);
  }

  const packageJsonPath = join(targetPath, SCAFFOLD_FILES.PACKAGE_JSON);
  if (
    await context.scaffolder.writeFile(
      packageJsonPath,
      generatePackageJson(),
      options.force,
    )
  ) {
    filesCreated.push(packageJsonPath);
  } else {
    filesSkipped.push(packageJsonPath);
  }

  // TypeScript project boundary (Tier 1 — programmatic). Deno continues to
  // read deno.json; this file only stops Node-side tools walking above the project.
  const tsconfigPath = join(targetPath, SCAFFOLD_FILES.TSCONFIG_ROOT);
  if (
    await context.scaffolder.writeFile(
      tsconfigPath,
      generateTsConfig(),
      options.force,
    )
  ) {
    filesCreated.push(tsconfigPath);
  } else {
    filesSkipped.push(tsconfigPath);
  }

  // 2. netscript.config.ts (Tier 1 — programmatic)
  const configContent = generateNetScriptConfig({
    name: options.name,
    importMode: options.importMode,
    localBase: options.localBase,
  });
  const configPath = join(targetPath, SCAFFOLD_FILES.NETSCRIPT_CONFIG);
  if (
    await context.scaffolder.writeFile(configPath, configContent, options.force)
  ) {
    filesCreated.push(configPath);
  } else {
    filesSkipped.push(configPath);
  }

  // 3. .gitignore (Tier 2 — static, no variables)
  const gitignorePath = join(targetPath, SCAFFOLD_FILES.GITIGNORE);
  if (
    await context.scaffolder.writeFile(
      gitignorePath,
      gitignoreTemplate,
      options.force,
    )
  ) {
    filesCreated.push(gitignorePath);
  } else {
    filesSkipped.push(gitignorePath);
  }

  // 4. CI/CD workflow templates (Tier 2 — static, target-specific)
  const workflowFiles = [
    ['deploy-deno-deploy.yml', denoDeployWorkflowTemplate],
    ['deploy-bare-metal.yml', bareMetalDeployWorkflowTemplate],
  ] as const;
  const aspireWorkflowFiles = options.noAspire ? workflowFiles : [
    ['deploy-compose-ghcr.yml', composeGhcrDeployWorkflowTemplate],
    ...workflowFiles,
  ] as const;
  for (const [filename, content] of aspireWorkflowFiles) {
    const workflowPath = join(targetPath, '.github', 'workflows', filename);
    const renderedContent = content.replaceAll(
      '{{netscriptCliSpecifier}}',
      netscriptJsrSpecifier('cli'),
    );
    if (
      await context.scaffolder.writeFile(workflowPath, renderedContent, options.force)
    ) {
      filesCreated.push(workflowPath);
    } else {
      filesSkipped.push(workflowPath);
    }
  }

  // 5. Optional editor config files (Tier 1 — programmatic, answer-driven)
  for (const file of generateEditorConfigFiles(options.editor)) {
    const filePath = join(targetPath, file.path);
    const directory = dirname(filePath);
    if (!directoriesCreated.includes(directory)) {
      await context.scaffolder.createDir(directory);
      directoriesCreated.push(directory);
    }
    if (
      await context.scaffolder.writeFile(filePath, file.content, options.force)
    ) {
      filesCreated.push(filePath);
    } else {
      filesSkipped.push(filePath);
    }
  }

  // 6. README.md (Tier 1 — programmatic, answer-driven)
  //    Shows TS vs legacy AppHost commands, includes services/<name>
  //    and database sections when applicable.
  const readmeContent = generateReadme({
    name: options.name,
    appName: options.appName,
    noAspire: options.noAspire,
    serviceName: plan.service?.name,
    dbEngine: options.dbEngine,
  });
  const readmePath = join(targetPath, SCAFFOLD_FILES.README);
  if (
    await context.scaffolder.writeFile(readmePath, readmeContent, options.force)
  ) {
    filesCreated.push(readmePath);
  } else {
    filesSkipped.push(readmePath);
  }

  const netscriptDir = join(targetPath, SCAFFOLD_DIRS.NETSCRIPT);
  if (!directoriesCreated.includes(netscriptDir)) {
    await context.scaffolder.createDir(netscriptDir);
    directoriesCreated.push(netscriptDir);
  }
  const verifierPath = join(netscriptDir, SCAFFOLD_FILES.NODE_MODULES_VERIFIER);
  if (
    await context.scaffolder.writeFile(
      verifierPath,
      generateNodeModulesVerifier(),
      options.force,
    )
  ) {
    filesCreated.push(verifierPath);
  } else {
    filesSkipped.push(verifierPath);
  }

  const appNetscriptDir = join(appDir, SCAFFOLD_DIRS.NETSCRIPT);
  if (!directoriesCreated.includes(appNetscriptDir)) {
    await context.scaffolder.createDir(appNetscriptDir);
    directoriesCreated.push(appNetscriptDir);
  }
  const closureVerifierPath = join(
    appNetscriptDir,
    SCAFFOLD_FILES.DEPENDENCY_CLOSURE_VERIFIER,
  );
  if (
    await context.scaffolder.writeFile(
      closureVerifierPath,
      generateDependencyClosureVerifier(),
      options.force,
    )
  ) {
    filesCreated.push(closureVerifierPath);
  } else {
    filesSkipped.push(closureVerifierPath);
  }

  const qualityRunnerPath = join(netscriptDir, SCAFFOLD_FILES.QUALITY_RUNNER);
  if (
    await context.scaffolder.writeFile(
      qualityRunnerPath,
      generateQualityRunner(),
      options.force,
    )
  ) {
    filesCreated.push(qualityRunnerPath);
  } else {
    filesSkipped.push(qualityRunnerPath);
  }

  // 7. appsettings.json (Tier 1 — NetScript infrastructure config)
  //    Always generated at project root — consumed by helpers generator
  //    regardless of C# vs TS AppHost mode.
  //    No host port is pinned for the app or the example service: `env: 'PORT'`
  //    in register-apps/register-services lets Aspire allocate both the proxy
  //    port and the target port, which is what `aspire start --isolated` needs
  //    to place two workspaces on one machine (#952).
  if (!options.noAspire) {
    const aspireCliTaskPath = join(netscriptDir, SCAFFOLD_FILES.ASPIRE_CLI_TASK);
    if (
      await context.scaffolder.writeFile(
        aspireCliTaskPath,
        generateAspireCliTaskRunner(),
        options.force,
      )
    ) {
      filesCreated.push(aspireCliTaskPath);
    } else {
      filesSkipped.push(aspireCliTaskPath);
    }

    const appsettingsContent = generateAppsettings({
      name: options.name,
      appName: options.appName,
      dbEngine: options.dbEngine,
      cache: options.cache,
      cacheBackend: options.cacheBackend,
      service: plan.service,
    });
    const appsettingsPath = join(targetPath, SCAFFOLD_FILES.APPSETTINGS);
    if (
      await context.scaffolder.writeFile(
        appsettingsPath,
        appsettingsContent,
        options.force,
      )
    ) {
      filesCreated.push(appsettingsPath);
    } else {
      filesSkipped.push(appsettingsPath);
    }
  }

  const testsDir = join(targetPath, 'tests');
  if (!directoriesCreated.includes(testsDir)) {
    await context.scaffolder.createDir(testsDir);
    directoriesCreated.push(testsDir);
  }
  const smokeTestPath = join(testsDir, 'scaffold_test.ts');
  if (
    await context.scaffolder.writeFile(
      smokeTestPath,
      generateScaffoldSmokeTest(),
      options.force,
    )
  ) {
    filesCreated.push(smokeTestPath);
  } else {
    filesSkipped.push(smokeTestPath);
  }

  const durationMs = performance.now() - start;
  return {
    filesCreated,
    directoriesCreated,
    filesSkipped,
    totalOperations: filesCreated.length + directoriesCreated.length,
    durationMs,
  };
}

export async function scaffoldPackagesLocal(
  context: InitPipelineContext,
  options: ValidatedInitOptions,
): Promise<ScaffoldResult> {
  return await context.scaffoldWorkspacePackages(options);
}
