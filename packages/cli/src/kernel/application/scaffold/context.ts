import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { InitOptions, ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
import type { ScaffolderPort, TemplatePort } from '../../ports/template-port.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import type { ProcessPort } from '../../ports/process-port.ts';
import type { JsrResolverPort } from '../../ports/jsr-resolver-port.ts';

/** Dependencies used by init application services. */
export interface InitPipelineContext {
  /** File and directory writer for scaffold operations. */
  readonly scaffolder: ScaffolderPort;
  /** Filesystem reader for validation and normalization. */
  readonly fs: FileSystemPort;
  /** String template renderer. */
  readonly templateAdapter: TemplatePort;
  /** External process runner. */
  readonly process: ProcessPort;
  /** Registry import resolver for public scaffold output. */
  readonly jsrResolver: JsrResolverPort;
  /** Current working directory provider. */
  readonly cwd: () => string;
  /** Resolve mode-specific fields supplied by the outer command layer. */
  readonly resolveModeFields: (options: InitOptions) => Record<string, unknown>;
  /** Whether generated workspace members should reference copied packages. */
  readonly packagesAsWorkspaceMembers: (options: ValidatedInitOptions) => boolean;
  /** Optional package workspace scaffold phase supplied by the outer command layer. */
  readonly scaffoldWorkspacePackages: (
    options: ValidatedInitOptions,
  ) => Promise<ScaffoldResult>;
}
