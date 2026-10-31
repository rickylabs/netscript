import type { PreparedInitPreset } from '../../../kernel/application/ui/v2/presets/apply-init-preset.ts';
import { resolve } from '@std/path';

import type { DbEngineChoice } from '../../../kernel/domain/db-engine.ts';
import type { EditorChoice, InitResult } from '../../../kernel/domain/scaffold/workspace-config.ts';
import type { CopyLocalPackagesResult } from '../../ports/package-copier-port.ts';
import { syncPackages, type SyncPackagesRequest } from '../sync/packages/sync-packages.ts';

/** Request for `netscript-dev init`, excluding public-only mode flags. */
export interface MaintainerInitRequest {
  /** Project name in kebab-case. */
  readonly name: string;
  /** Optional application name override. */
  readonly appName?: string;
  /** Optional parent directory for the generated project. */
  readonly path?: string;
  /** Optional editor config to scaffold. */
  readonly editor?: EditorChoice;
  /** Overwrite an existing target directory without prompting. */
  readonly force: boolean;
  /** Skip interactive prompts. */
  readonly ci: boolean;
  /** Accept default answers without prompting. */
  readonly yes: boolean;
  /** Preview scaffold changes without writing files. */
  readonly dryRun: boolean;
  /** Emit a single machine-readable init result object. */
  readonly json?: boolean;
  /** Named scaffold preset to apply before generation. */
  readonly from?: string;
  /** UI preset code or portable JSON URL, applied after local package sync. */
  readonly preset?: string;
  /** Skip `git init` after scaffolding. */
  readonly noGit: boolean;
  /** Skip Aspire orchestration output. */
  readonly noAspire: boolean;
  /** Optional database engine selection. */
  readonly dbEngine?: DbEngineChoice;
  /** Whether to scaffold a shared cache resource. */
  readonly cache?: boolean;
  /** Whether to include an example oRPC service. */
  readonly includeExampleService?: boolean;
  /** Example service name override. */
  readonly serviceName?: string;
  /** Prisma model name override. */
  readonly modelName?: string;
  /** Example service port override. */
  readonly servicePort?: number;
}

/** Local-mode init request sent to the injected scaffold executor. */
export interface MaintainerInitExecutionRequest extends MaintainerInitRequest {
  /** Maintainer init always scaffolds with local imports. */
  readonly importMode: 'local';
  /** Relative import base written into the generated workspace. */
  readonly localBase: string;
  /** Absolute source monorepo root. */
  readonly sourceRoot: string;
}

/** Result of the maintainer init workflow. */
export interface MaintainerInitResult {
  /** Result of the shared scaffold execution. */
  readonly init: InitResult;
  /** Monorepo root used for local package sync. */
  readonly sourceRoot: string;
  /** Relative local import base written into the scaffold. */
  readonly localBase: string;
  /** Local package sync result, omitted for dry runs. */
  readonly packageSync?: CopyLocalPackagesResult;
}

/** Dependencies used by the maintainer init workflow. */
export interface MaintainerInitDependencies {
  /** Current working directory provider. */
  readonly cwd: () => string;
  /** Fetch and validate before scaffolding; apply the retained selection after local sync. */
  readonly preparePreset?: (preset: string) => Promise<PreparedInitPreset>;
  /** Detect a monorepo root from the requested scaffold location. */
  readonly detectMonorepoRoot: (startDir: string) => Promise<string | undefined>;
  /** Execute the shared scaffold workflow in local mode. */
  readonly runInit: (request: MaintainerInitExecutionRequest) => Promise<InitResult>;
  /** Copy local packages into the scaffold target after generation. */
  readonly syncPackages: (request: SyncPackagesRequest) => Promise<CopyLocalPackagesResult>;
}

/** Run maintainer init: local-mode scaffold plus local package sync. */
export async function orchestrateMaintainerInit(
  request: MaintainerInitRequest,
  dependencies: MaintainerInitDependencies,
): Promise<MaintainerInitResult> {
  const probeDir = request.path ? resolve(dependencies.cwd(), request.path) : dependencies.cwd();
  const sourceRoot = await dependencies.detectMonorepoRoot(probeDir);

  if (!sourceRoot) {
    throw new Error(
      'Maintainer init requires a NetScript monorepo checkout. ' +
        'Run the command inside the repo or choose a path beneath it.',
    );
  }

  let applyPreset: PreparedInitPreset | undefined;
  if (!request.dryRun && request.preset) {
    if (!dependencies.preparePreset) {
      throw new Error('Init UI preset dependencies are not configured');
    }
    applyPreset = await dependencies.preparePreset(request.preset);
  }

  const localBase = '.';
  const { preset: _preset, ...scaffoldRequest } = request;
  const init = await dependencies.runInit({
    ...scaffoldRequest,
    importMode: 'local',
    localBase,
    sourceRoot,
  });

  const packageSync = request.dryRun ? undefined : await syncPackages({
    sourceRoot,
    targetPath: init.targetPath,
    dbEngines: request.dbEngine && request.dbEngine !== 'none' ? [request.dbEngine] : undefined,
  }, {
    packageCopier: { copyLocalPackages: dependencies.syncPackages },
  });

  if (!request.dryRun && applyPreset && request.preset) {
    await applyPreset({
      projectRoot: init.targetPath,
      name: request.name,
      appName: request.appName,
      preset: request.preset,
    });
  }
  return {
    init,
    sourceRoot,
    localBase,
    packageSync,
  };
}
