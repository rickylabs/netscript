import { regenerateAspireHelpers } from '../../../../kernel/adapters/service/workspace-mutator.ts';
import { UseCase } from '../../../../kernel/application/abstracts/use-case.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';

/** Request for regenerating Aspire helper files. */
export interface GenerateAspireRequest {
  /** Absolute project root. */
  readonly projectRoot: string;
}

/** Dependencies for Aspire helper generation. */
export interface GenerateAspireDependencies {
  /** Project filesystem. */
  readonly fs: FileSystemPort;

  /** Scaffold writer. */
  readonly scaffolder: ScaffolderPort;

  /** Template renderer. */
  readonly templateAdapter: TemplatePort;

  /** Optional helper regeneration override for tests. */
  readonly regenerateHelpers?: (
    projectRoot: string,
    fs: FileSystemPort,
    scaffolder: ScaffolderPort,
    templateAdapter: TemplatePort,
  ) => Promise<readonly string[]>;
}

/** Result of regenerating Aspire helper files. */
export interface GenerateAspireResult {
  /** Helper files written. */
  readonly helperFiles: readonly string[];
}

/** Public Aspire helper generation use case. */
export class GenerateAspireUseCase extends UseCase<GenerateAspireRequest, GenerateAspireResult> {
  readonly id = 'public.generate.aspire';

  constructor(private readonly dependencies: GenerateAspireDependencies) {
    super();
  }

  execute(request: GenerateAspireRequest): Promise<GenerateAspireResult> {
    return executeGenerateAspire(request, this.dependencies);
  }
}

/** Regenerate Aspire helper files for a project. */
export async function generateAspire(
  request: GenerateAspireRequest,
  dependencies: GenerateAspireDependencies,
): Promise<GenerateAspireResult> {
  return await new GenerateAspireUseCase(dependencies).execute(request);
}

async function executeGenerateAspire(
  request: GenerateAspireRequest,
  dependencies: GenerateAspireDependencies,
): Promise<GenerateAspireResult> {
  const regenerateHelpers = dependencies.regenerateHelpers ?? regenerateAspireHelpers;
  const helperFiles = await regenerateHelpers(
    request.projectRoot,
    dependencies.fs,
    dependencies.scaffolder,
    dependencies.templateAdapter,
  );
  return { helperFiles };
}
