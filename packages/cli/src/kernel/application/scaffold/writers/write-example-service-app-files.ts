import { join } from '@std/path';
import type { ExampleServiceAppTemplateAssets } from '../../../adapters/templates/scaffold-template-assets.ts';
import type { InitPipelineContext } from '../context.ts';

interface ExampleServiceAppFilesInput {
  readonly context: InitPipelineContext;
  readonly appTemplateVars: Record<string, string>;
  readonly templates: ExampleServiceAppTemplateAssets;
  readonly write: (targetPath: string, content: string) => Promise<void>;
  readonly libDir: string;
  readonly serviceExampleDir: string;
  readonly serviceExampleComponentsDir: string;
  readonly serviceExampleIslandsDir: string;
  readonly serviceExampleSharedDir: string;
  readonly serviceExamplePartialDir: string;
  readonly telemetryExampleDir: string;
  readonly telemetryExampleComponentsDir: string;
  readonly telemetryExampleSharedDir: string;
}

/** Write Fresh example-service files when init includes the service demo. */
export async function writeExampleServiceAppFiles(
  input: ExampleServiceAppFilesInput,
): Promise<void> {
  const { context, appTemplateVars, write } = input;
  const {
    appExampleServiceHeroTemplate,
    appExampleServiceLabPanelTemplate,
    appExampleServiceNotesCardTemplate,
    appExampleServicePageLayoutTemplate,
    appExampleServiceShowcaseSharedTemplate,
    appExampleServiceShowcaseTemplate,
    appExampleServiceSummaryCardTemplate,
    appExampleServiceSummaryPanelTemplate,
    appExampleServiceTemplate,
    appServiceExampleIndexTemplate,
    appServiceExampleLayoutTemplate,
    appServiceSummaryPartialTemplate,
    appTelemetryExampleIndexTemplate,
    appTelemetryExampleViewTemplate,
    appTelemetryExampleSharedTemplate,
  } = input.templates;
  await write(
    join(input.libDir, 'example-service.ts'),
    await context.templateAdapter.render(appExampleServiceTemplate, appTemplateVars),
  );
  await write(
    join(input.serviceExampleComponentsDir, 'hero.tsx'),
    await context.templateAdapter.render(appExampleServiceHeroTemplate, appTemplateVars),
  );
  await write(
    join(input.serviceExampleComponentsDir, 'lab-panel.tsx'),
    await context.templateAdapter.render(appExampleServiceLabPanelTemplate, appTemplateVars),
  );
  await write(
    join(input.serviceExampleComponentsDir, 'notes-card.tsx'),
    await context.templateAdapter.render(appExampleServiceNotesCardTemplate, appTemplateVars),
  );
  await write(
    join(input.serviceExampleComponentsDir, 'page-layout.tsx'),
    await context.templateAdapter.render(appExampleServicePageLayoutTemplate, appTemplateVars),
  );
  await write(
    join(input.serviceExampleComponentsDir, 'summary-card.tsx'),
    await context.templateAdapter.render(appExampleServiceSummaryCardTemplate, appTemplateVars),
  );
  await write(
    join(input.serviceExampleComponentsDir, 'summary-panel.tsx'),
    await context.templateAdapter.render(appExampleServiceSummaryPanelTemplate, appTemplateVars),
  );
  await write(
    join(input.serviceExampleIslandsDir, 'ServiceShowcaseLab.tsx'),
    await context.templateAdapter.render(appExampleServiceShowcaseTemplate, appTemplateVars),
  );
  await write(
    join(input.serviceExampleSharedDir, 'service-showcase.ts'),
    await context.templateAdapter.render(appExampleServiceShowcaseSharedTemplate, appTemplateVars),
  );
  await write(
    join(input.serviceExamplePartialDir, 'summary.tsx'),
    await context.templateAdapter.render(appServiceSummaryPartialTemplate, appTemplateVars),
  );
  await write(
    join(input.serviceExampleDir, 'index.tsx'),
    await context.templateAdapter.render(appServiceExampleIndexTemplate, appTemplateVars),
  );
  await write(
    join(input.serviceExampleDir, 'index.layout.tsx'),
    await context.templateAdapter.render(appServiceExampleLayoutTemplate, appTemplateVars),
  );
  await write(
    join(input.telemetryExampleDir, 'index.tsx'),
    await context.templateAdapter.render(appTelemetryExampleIndexTemplate, appTemplateVars),
  );
  await write(
    join(input.telemetryExampleComponentsDir, 'telemetry-view.tsx'),
    await context.templateAdapter.render(appTelemetryExampleViewTemplate, appTemplateVars),
  );
  await write(
    join(input.telemetryExampleSharedDir, 'telemetry-trace.ts'),
    await context.templateAdapter.render(appTelemetryExampleSharedTemplate, appTemplateVars),
  );
}
