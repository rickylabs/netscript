import { DenoProcess } from '../../../kernel/adapters/runtime/process/deno-process.ts';
import { DenoFileSystem } from '../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { relative } from '@std/path';
import { Scaffolder } from '../../../kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../kernel/adapters/scaffold/template-adapter.ts';
import { emptyScaffoldResult } from '../../../kernel/application/scaffold/helpers.ts';
import { executeInit } from '../../../kernel/application/scaffold/orchestrate-init.ts';
import { JsrImportResolver } from '../../../public/adapters/jsr-import-resolver.ts';
import { createOfficialPluginCopier } from '../../infra/official-plugin-copier.ts';
import {
  computeLocalBase,
  createPackageCopier,
  detectMonorepoRoot,
  findOfficialPluginSourceRoot,
  getOfficialPluginSource,
} from '../../maintainer-api.ts';
import type { ReleaseEjectDependencies } from '../release/eject/release-eject.ts';
import type { MaintainerCliHost } from './maintainer-command-tree.ts';

/** Dependencies shared by maintainer command groups. */
export interface MaintainerCommandDependencies {
  /** Process adapter used by maintainer shell commands. */
  readonly process: DenoProcess;
  /** Dependencies for maintainer init. */
  readonly initDependencies: {
    readonly cwd: () => string;
    readonly detectMonorepoRoot: typeof detectMonorepoRoot;
    readonly runInit: Parameters<typeof executeInit>[0] extends never ? never
      : (request: Parameters<typeof executeInit>[1]) => ReturnType<typeof executeInit>;
    readonly syncPackages: ReturnType<typeof createPackageCopier>['copyLocalPackages'];
  };
  /** Dependencies for sync packages. */
  readonly syncPackagesDependencies: {
    readonly packageCopier: ReturnType<typeof createPackageCopier>;
  };
  /** Dependencies for sync plugin. */
  readonly syncPluginDependencies: {
    readonly getSource: typeof getOfficialPluginSource;
    readonly findSourceRoot: typeof findOfficialPluginSourceRoot;
    readonly copyPlugin: ReturnType<typeof createOfficialPluginCopier>;
  };
  /** Dependencies for sync templates. */
  readonly syncTemplatesDependencies: {
    readonly steps: readonly {
      readonly name: string;
      readonly run: (targetPath: string) => Promise<readonly string[]>;
    }[];
  };
  /** Dependencies for monorepo probing. */
  readonly probeDependencies: {
    readonly detectMonorepoRoot: typeof detectMonorepoRoot;
    readonly findOfficialPluginSourceRoot: typeof findOfficialPluginSourceRoot;
    readonly computeLocalBase: typeof computeLocalBase;
    readonly hasLocalImportResolver: true;
  };
  /** Dependencies for scaffold test execution. */
  readonly runScaffoldTestDependencies: { readonly process: DenoProcess };
  /** Dependencies for release eject. */
  readonly releaseEjectDependencies: ReleaseEjectDependencies;
}

/** Build the maintainer command dependency graph for one CLI invocation. */
export function createMaintainerCommandDependencies(
  host: MaintainerCliHost,
): MaintainerCommandDependencies {
  const fs = new DenoFileSystem();
  const process = new DenoProcess();
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);
  const packageCopier = createPackageCopier();
  const initDependencies = {
    cwd: host.cwd,
    detectMonorepoRoot,
    runInit: (request: Parameters<typeof executeInit>[1]) =>
      executeInit({
        scaffolder,
        fs,
        templateAdapter,
        process,
        jsrResolver: new JsrImportResolver(),
        cwd: host.cwd,
        resolveModeFields: (options) => ({
          localBase: options.localBase,
          sourceRoot: options.sourceRoot,
        }),
        packagesAsWorkspaceMembers: () => false,
        scaffoldWorkspacePackages: () => Promise.resolve(emptyScaffoldResult()),
      }, {
        ...request,
        sourceRoot: undefined,
      }),
    syncPackages: packageCopier.copyLocalPackages,
  };
  const syncPackagesDependencies = { packageCopier };
  const syncPluginDependencies = {
    getSource: getOfficialPluginSource,
    findSourceRoot: findOfficialPluginSourceRoot,
    copyPlugin: createOfficialPluginCopier(),
  };
  const syncTemplatesDependencies = {
    steps: [{
      name: 'aspire-helpers',
      run: async (targetPath: string) => {
        const result = await process.exec(
          'deno',
          [
            'run',
            '--allow-all',
            '.llm/tools/generate-helpers.ts',
            relative(host.cwd(), targetPath),
          ],
          { cwd: host.cwd() },
        );
        if (result.code !== 0) {
          throw new Error(result.stderr || result.stdout || 'Template sync failed.');
        }
        return parseGeneratedFiles(result.stdout);
      },
    }],
  };

  return {
    process,
    initDependencies,
    syncPackagesDependencies,
    syncPluginDependencies,
    syncTemplatesDependencies,
    probeDependencies: {
      detectMonorepoRoot,
      findOfficialPluginSourceRoot,
      computeLocalBase,
      hasLocalImportResolver: true,
    },
    runScaffoldTestDependencies: { process },
    releaseEjectDependencies: {
      cwd: host.cwd,
      fs,
      process,
      detectMonorepoRoot,
      initDependencies,
      syncPackagesDependencies,
      syncPluginDependencies,
      syncTemplatesDependencies,
    },
  };
}

function parseGeneratedFiles(stdout: string): readonly string[] {
  const files: string[] = [];
  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.endsWith(' bytes)')) continue;
    const openParen = trimmed.lastIndexOf(' (');
    if (openParen <= 2) continue;
    const path = trimmed.slice(2, openParen).trim();
    if (path.length > 0) {
      files.push(path);
    }
  }
  return files;
}
