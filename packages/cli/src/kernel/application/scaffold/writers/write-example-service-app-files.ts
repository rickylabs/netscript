import { join } from '@std/path';
import { toCamelCase } from '@std/text';
import type {
  ExampleServiceAppTemplateAssets,
  ResourceSliceTemplateAssets,
} from '../../../adapters/templates/scaffold-template-assets.ts';
import { createResourceSliceTemplateRenderer } from '../../../adapters/templates/scaffold-template-assets.ts';
import { DenoGeneratedSourceFormatter } from '../../../adapters/runtime/process/deno-generated-source-formatter.ts';
import { planResourceSlice } from '../../resource-slice/plan-resource-slice.ts';
import { renderResourceSlice } from '../../resource-slice/render-resource-slice.ts';
import {
  normalizeResourceSliceInput,
  type ResourceSliceCandidateLeaf,
  type ResourceSlicePlan,
} from '../../resource-slice/resource-slice-contract.ts';
import type { InitPipelineContext } from '../context.ts';

interface ExampleServiceAppFilesInput {
  readonly context: InitPipelineContext;
  readonly appTemplateVars: Record<string, string>;
  readonly templates: ExampleServiceAppTemplateAssets;
  readonly resourceTemplates: ResourceSliceTemplateAssets;
  readonly write: (targetPath: string, content: string) => Promise<void>;
  readonly appDir: string;
  readonly serviceExampleDir: string;
  readonly serviceExampleLibDir: string;
  readonly telemetryExampleDir: string;
  readonly telemetryExampleComponentsDir: string;
  readonly telemetryExampleSharedDir: string;
}

/** Build init's fixed `--form --partial` resource-slice preset. */
export function planExampleServiceResourceSlice(
  appTemplateVars: Record<string, string>,
): ResourceSlicePlan {
  const serviceName = appTemplateVars.serviceName;
  return planResourceSlice(normalizeResourceSliceInput({
    resource: serviceName,
    app: appTemplateVars.appName,
    route: `/examples/${serviceName}`,
    variants: ['form', 'partial'],
    client: {
      serviceName,
      moduleSpecifier: `@app/routes/examples/${serviceName}/(_lib)/service-query.ts`,
      queryFactoryName: `${toCamelCase(serviceName)}Queries`,
    },
    procedure: { path: ['list'], kind: 'query' },
  }));
}

/** Render init's canonical leaves through the shared resource-slice authority. */
export async function renderExampleServiceResourceSlice(
  context: Pick<InitPipelineContext, 'templateAdapter' | 'process'>,
  appTemplateVars: Record<string, string>,
  templates: ResourceSliceTemplateAssets,
): Promise<readonly ResourceSliceCandidateLeaf[]> {
  return await renderResourceSlice(
    planExampleServiceResourceSlice(appTemplateVars),
    templates,
    createResourceSliceTemplateRenderer(
      context.templateAdapter,
      new DenoGeneratedSourceFormatter(context.process),
    ),
  );
}

/** Write Fresh example-service files when init includes the service demo. */
export async function writeExampleServiceAppFiles(
  input: ExampleServiceAppFilesInput,
): Promise<void> {
  const { context, appTemplateVars, write } = input;
  const {
    appExampleServiceQueryTemplate,
    appTelemetryExampleIndexTemplate,
    appTelemetryExampleViewTemplate,
    appTelemetryExampleSharedTemplate,
  } = input.templates;
  await write(
    join(input.serviceExampleDir, 'README.md'),
    `# Example service screen

Copy the architecture: contract-derived query factories, \`definePage\` layers, the server/island boundary, a managed form, and a deferred partial.

Delete or replace the sample data: example records, labels, and demonstration-only controls are placeholders for your domain.
`,
  );
  await write(
    join(input.serviceExampleLibDir, 'service-query.ts'),
    await context.templateAdapter.render(
      appExampleServiceQueryTemplate,
      appTemplateVars,
    ),
  );
  const leaves = await renderExampleServiceResourceSlice(
    context,
    appTemplateVars,
    input.resourceTemplates,
  );
  for (const leaf of leaves) {
    await write(join(input.appDir, leaf.path), leaf.content);
  }
  await write(
    join(input.telemetryExampleDir, 'index.tsx'),
    await context.templateAdapter.render(
      appTelemetryExampleIndexTemplate,
      appTemplateVars,
    ),
  );
  await write(
    join(input.telemetryExampleComponentsDir, 'telemetry-view.tsx'),
    await context.templateAdapter.render(
      appTelemetryExampleViewTemplate,
      appTemplateVars,
    ),
  );
  await write(
    join(input.telemetryExampleSharedDir, 'telemetry-trace.ts'),
    await context.templateAdapter.render(
      appTelemetryExampleSharedTemplate,
      appTemplateVars,
    ),
  );
}
