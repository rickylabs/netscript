import { UsageError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import type { ResourceSliceOptionalVariant } from '../../../../kernel/application/resource-slice/resource-slice-contract.ts';
import type { GenerateResourceRequest } from './generate-resource.ts';

/** Parsed options accepted by `generate resource`. */
export interface GenerateResourceCommandInput {
  readonly app?: string;
  readonly client?: string;
  readonly dryRun?: boolean;
  readonly force?: boolean;
  readonly form?: boolean;
  readonly json?: boolean;
  readonly partial?: boolean;
  readonly procedure: string;
  readonly projectRoot?: string;
  readonly route?: string;
  readonly stream?: boolean;
}

/** Map parsed resource flags to the application request. */
export function toGenerateResourceRequest(
  resource: string,
  input: GenerateResourceCommandInput,
): GenerateResourceRequest {
  if (!input.procedure.trim()) {
    throw new UsageError(1, 'The --procedure option must name a query procedure.');
  }
  const variants: ResourceSliceOptionalVariant[] = [];
  if (input.form) variants.push('form');
  if (input.partial) variants.push('partial');
  if (input.stream) variants.push('stream');

  return {
    resource,
    app: input.app,
    client: input.client,
    procedure: input.procedure,
    projectRoot: input.projectRoot,
    route: input.route,
    variants,
    dryRun: input.dryRun ?? false,
    force: input.force ?? false,
  };
}
