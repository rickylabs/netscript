import { validateConfiguredPluginComposition } from '../../../../kernel/adapters/config/plugin-registry.ts';
import { regenerateAspireHelpers } from '../../../../kernel/adapters/service/workspace-mutator.ts';
import { UseCase } from '../../../../kernel/application/abstracts/use-case.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import type { GeneratedSourceFormatterPort } from '../../../../kernel/ports/generated-source-formatter-port.ts';

/** Request for regenerating Aspire helper files. */
export interface GenerateAspireRequest {
  /** Absolute project root. */
  readonly projectRoot: string;
  /** Report helper changes without writing them. */
  readonly dryRun?: boolean;
  /** Rewrite identical helper files. */
  readonly force?: boolean;
}

/** Dependencies for Aspire helper generation. */
export interface GenerateAspireDependencies {
  /** Project filesystem. */
  readonly fs: FileSystemPort;

  /** Scaffold writer. */
  readonly scaffolder: ScaffolderPort;

  /** Template renderer. */
  readonly templateAdapter: TemplatePort;

  /** Injected pre-write canonicalizer for service-generation flows. */
  readonly formatter: GeneratedSourceFormatterPort;

  /**
   * Optional override for the configured-plugin composition check run before generation.
   *
   * Defaults to loading every configured plugin manifest and running `validatePluginComposition`.
   */
  readonly validateComposition?: (projectRoot: string) => Promise<void>;

  /** Optional helper regeneration override for tests. */
  readonly regenerateHelpers?: (
    projectRoot: string,
    fs: FileSystemPort,
    scaffolder: ScaffolderPort,
    templateAdapter: TemplatePort,
    options: {
      readonly dryRun?: boolean;
      readonly force?: boolean;
      readonly formatter: GeneratedSourceFormatterPort;
    },
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

/**
 * Regenerate Aspire helper files for a project.
 *
 * The configured plugins must first pass the shared `validatePluginComposition` check, the same
 * one the runtime host bootstrap runs; an invalid composition fails before any helper is written.
 */
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
  const validateComposition = dependencies.validateComposition ??
    ((projectRoot: string) => validateConfiguredPluginComposition(projectRoot));
  await validateComposition(request.projectRoot);

  const regenerateHelpers = dependencies.regenerateHelpers ?? regenerateAspireHelpers;
  const helperFiles = await regenerateHelpers(
    request.projectRoot,
    dependencies.fs,
    dependencies.scaffolder,
    dependencies.templateAdapter,
    {
      dryRun: request.dryRun,
      force: request.force,
      formatter: dependencies.formatter,
    },
  );
  return { helperFiles };
}
