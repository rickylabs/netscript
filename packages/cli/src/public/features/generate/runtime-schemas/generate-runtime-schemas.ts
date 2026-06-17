import { dirname, resolve } from '@std/path';
import { UseCase } from '../../../../kernel/application/abstracts/use-case.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';

const WINDOWS_ABSOLUTE_PATH_PATTERN = /^[A-Za-z]:[\\/]/;

/** Runtime config schema declared by a plugin. */
export interface RuntimeConfigSchemaContribution {
  /** Runtime config topic name. */
  readonly topic: string;

  /** Optional schema description. */
  readonly description?: string;

  /** JSON Schema document. */
  readonly schema: Record<string, unknown>;
}

/** Plugin schema contribution set. */
export interface PluginRuntimeConfigSchemas {
  /** Plugin package or registry name. */
  readonly pluginName: string;

  /** Runtime config schema declarations. */
  readonly schemas: readonly RuntimeConfigSchemaContribution[];
}

/** Configured output path for a runtime config topic. */
export interface RuntimeConfigSchemaPath {
  /** Schema output path relative to the project root. */
  readonly schemaPath: string;
}

/** Request for generating runtime config schema files. */
export interface GenerateConfigSchemaRequest {
  /** Absolute project root. */
  readonly projectRoot: string;

  /** Plugin schema contributions. */
  readonly plugins: readonly PluginRuntimeConfigSchemas[];

  /** Configured output paths by topic. */
  readonly runtimeConfigPaths: Readonly<Record<string, RuntimeConfigSchemaPath>>;

  /** Preview writes without changing files. */
  readonly dryRun: boolean;

  /** Overwrite existing files even if content matches. */
  readonly force: boolean;
}

/** Planned schema file write. */
export interface ConfigSchemaWrite {
  /** Runtime config topic name. */
  readonly topic: string;

  /** Plugin that owns the schema. */
  readonly pluginName: string;

  /** Absolute output path. */
  readonly outputPath: string;

  /** Serialized JSON Schema content. */
  readonly content: string;
}

/** Result of generating runtime config schema files. */
export interface GenerateConfigSchemaResult {
  /** Schema writes considered by the flow. */
  readonly files: readonly ConfigSchemaWrite[];

  /** Files written or that would be written in dry-run mode. */
  readonly written: readonly ConfigSchemaWrite[];

  /** Files skipped because content was unchanged. */
  readonly skipped: readonly ConfigSchemaWrite[];
}

/** Dependencies for runtime config schema generation. */
export interface GenerateConfigSchemaDependencies {
  /** Filesystem used for writes and unchanged checks. */
  readonly fs: FileSystemPort;
}

/** Public runtime-schema generation use case. */
export class GenerateRuntimeSchemasUseCase
  extends UseCase<GenerateConfigSchemaRequest, GenerateConfigSchemaResult> {
  readonly id = 'public.generate.runtime-schemas';

  constructor(private readonly dependencies: GenerateConfigSchemaDependencies) {
    super();
  }

  execute(request: GenerateConfigSchemaRequest): Promise<GenerateConfigSchemaResult> {
    return executeGenerateConfigSchema(request, this.dependencies);
  }
}

/** Generate runtime config JSON Schema files from plugin declarations. */
export async function generateConfigSchema(
  request: GenerateConfigSchemaRequest,
  dependencies: GenerateConfigSchemaDependencies,
): Promise<GenerateConfigSchemaResult> {
  return await new GenerateRuntimeSchemasUseCase(dependencies).execute(request);
}

async function executeGenerateConfigSchema(
  request: GenerateConfigSchemaRequest,
  dependencies: GenerateConfigSchemaDependencies,
): Promise<GenerateConfigSchemaResult> {
  const files = planConfigSchemaWrites(request);
  const written: ConfigSchemaWrite[] = [];
  const skipped: ConfigSchemaWrite[] = [];

  for (const file of files) {
    if (request.dryRun) {
      written.push(file);
      continue;
    }

    if (!request.force && await dependencies.fs.exists(file.outputPath)) {
      const existing = await dependencies.fs.readFile(file.outputPath);
      if (existing === file.content) {
        skipped.push(file);
        continue;
      }
    }

    await dependencies.fs.createDir(dirname(file.outputPath));
    await dependencies.fs.writeFile(file.outputPath, file.content);
    written.push(file);
  }

  return { files, written, skipped };
}

/** Plan runtime config JSON Schema file writes from plugin declarations. */
export function planConfigSchemaWrites(
  request: Pick<
    GenerateConfigSchemaRequest,
    'projectRoot' | 'plugins' | 'runtimeConfigPaths'
  >,
): readonly ConfigSchemaWrite[] {
  const topicOwners = new Map<string, string[]>();
  const files: ConfigSchemaWrite[] = [];

  for (const plugin of request.plugins) {
    for (const schema of plugin.schemas) {
      const owners = topicOwners.get(schema.topic) ?? [];
      owners.push(plugin.pluginName);
      topicOwners.set(schema.topic, owners);

      const configured = request.runtimeConfigPaths[schema.topic];
      const outputPath = configured
        ? resolveProjectPath(request.projectRoot, configured.schemaPath)
        : resolveProjectPath(request.projectRoot, schema.topic, 'runtime', 'schema.json');

      files.push({
        topic: schema.topic,
        pluginName: plugin.pluginName,
        outputPath,
        content: JSON.stringify(schema.schema, null, 2) + '\n',
      });
    }
  }

  for (const [topic, owners] of topicOwners) {
    if (owners.length > 1) {
      throw new Error(
        `Runtime config topic "${topic}" is declared by multiple plugins: ${owners.join(', ')}.`,
      );
    }
  }

  return files;
}

function resolveProjectPath(projectRoot: string, ...segments: string[]): string {
  const firstSegment = segments[0];
  if (firstSegment && WINDOWS_ABSOLUTE_PATH_PATTERN.test(firstSegment)) {
    return firstSegment.replaceAll('\\', '/');
  }

  if (!WINDOWS_ABSOLUTE_PATH_PATTERN.test(projectRoot)) {
    return resolve(projectRoot, ...segments);
  }

  const normalizedRoot = projectRoot.replaceAll('\\', '/').replace(/\/+$/, '');
  const normalizedSegments = segments
    .map((segment) => segment.replaceAll('\\', '/').replace(/^\/+/, '').replace(/\/+$/, ''))
    .filter((segment) => segment.length > 0);

  return [normalizedRoot, ...normalizedSegments].join('/');
}
