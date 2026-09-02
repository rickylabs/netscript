import type { ResourceSliceTemplateAssets } from '../../adapters/templates/scaffold-template-assets.ts';
import type { TemplatePort } from '../../ports/template-port.ts';
import type {
  ResourceSliceCandidateLeaf,
  ResourceSlicePlan,
  ResourceSlicePlannedLeaf,
  ResourceSliceVariant,
} from './resource-slice-contract.ts';
import { markOwnedResourceSliceLeaf } from './resource-slice-contract.ts';

type ResourceSliceTemplateName =
  | 'index.route.ts'
  | 'index.tsx'
  | 'index.layout.tsx'
  | '(_components)/resource-view.tsx'
  | '(_islands)/ResourceIsland.tsx'
  | '(_shared)/resource-loaders.ts'
  | '(_components)/resource-form.tsx'
  | '(_lib)/resource-form.ts'
  | '(_components)/resource-summary.tsx'
  | 'partials/summary.tsx'
  | '(_islands)/ResourceStream.tsx';

const TEMPLATE_ASSET_NAMES: Readonly<
  Record<ResourceSliceTemplateName, keyof ResourceSliceTemplateAssets>
> = {
  'index.route.ts': 'routeContractTemplate',
  'index.tsx': 'pageTemplate',
  'index.layout.tsx': 'layoutTemplate',
  '(_components)/resource-view.tsx': 'viewTemplate',
  '(_islands)/ResourceIsland.tsx': 'islandTemplate',
  '(_shared)/resource-loaders.ts': 'loadersTemplate',
  '(_components)/resource-form.tsx': 'formComponentTemplate',
  '(_lib)/resource-form.ts': 'formContractTemplate',
  '(_components)/resource-summary.tsx': 'summaryComponentTemplate',
  'partials/summary.tsx': 'partialRouteTemplate',
  '(_islands)/ResourceStream.tsx': 'streamIslandTemplate',
};

/** Render every planned leaf and attach canonical reconciliation provenance. */
export async function renderResourceSlice(
  plan: ResourceSlicePlan,
  templates: ResourceSliceTemplateAssets,
  templateRenderer: TemplatePort,
): Promise<readonly ResourceSliceCandidateLeaf[]> {
  const candidates: ResourceSliceCandidateLeaf[] = [];
  for (const leaf of plan.leaves) {
    const content = await renderOwnedLeaf(plan, leaf, leaf.options, templates, templateRenderer);
    const previousCanonicalContents = await renderPreviousCanonicalContents(
      plan,
      leaf,
      templates,
      templateRenderer,
    );
    candidates.push({
      path: leaf.path,
      resource: plan.input.resource,
      role: leaf.role,
      options: leaf.options,
      content,
      ...(previousCanonicalContents.length > 0 ? { previousCanonicalContents } : {}),
    });
  }
  return candidates;
}

async function renderPreviousCanonicalContents(
  plan: ResourceSlicePlan,
  leaf: ResourceSlicePlannedLeaf,
  templates: ResourceSliceTemplateAssets,
  templateRenderer: TemplatePort,
): Promise<readonly string[]> {
  if (leaf.role !== 'page' && leaf.role !== 'view') return [];
  const previous: string[] = [];
  for (const options of strictOptionSubsets(leaf.options)) {
    previous.push(await renderOwnedLeaf(plan, leaf, options, templates, templateRenderer));
  }
  return previous;
}

async function renderOwnedLeaf(
  plan: ResourceSlicePlan,
  leaf: ResourceSlicePlannedLeaf,
  options: readonly ResourceSliceVariant[],
  templates: ResourceSliceTemplateAssets,
  templateRenderer: TemplatePort,
): Promise<string> {
  const template = templateFor(templates, leaf.template);
  const body = await templateRenderer.render(template, renderVariables(plan, options));
  return await markOwnedResourceSliceLeaf({
    resource: plan.input.resource,
    role: leaf.role,
    options,
  }, body);
}

function templateFor(templates: ResourceSliceTemplateAssets, name: string): string {
  if (!isResourceSliceTemplateName(name)) {
    throw new Error(`Resource-slice template is not registered: ${name}`);
  }
  return templates[TEMPLATE_ASSET_NAMES[name]];
}

function isResourceSliceTemplateName(name: string): name is ResourceSliceTemplateName {
  return Object.hasOwn(TEMPLATE_ASSET_NAMES, name);
}

function renderVariables(
  plan: ResourceSlicePlan,
  options: readonly ResourceSliceVariant[],
): Record<string, string> {
  const { input } = plan;
  const partialName = `${input.resource}-summary`;
  const partialRoute = `/partials/${input.routeSegments.join('/')}/summary`;
  return {
    resource: input.resource,
    resourceCamelCase: input.resourceCamelCase,
    resourcePascalCase: input.resourcePascalCase,
    route: input.route,
    routeAlias: input.routeAlias,
    routeDirectory: input.routeDirectory,
    clientModuleSpecifier: input.client.moduleSpecifier,
    queryFactoryName: input.client.queryFactoryName,
    queryFactory: plan.query.factory,
    partialName,
    partialRoute,
    pageOptionImports: pageOptionImports(input.resource, input.resourcePascalCase, options),
    pageOptionLayers: pageOptionLayers(
      input.resource,
      input.resourceCamelCase,
      input.resourcePascalCase,
      partialName,
      partialRoute,
      options,
    ),
    pageLayoutProps: pageLayoutProps(input.resourceCamelCase, options),
    viewOptionLinks: viewOptionLinks(input.resource, options),
  };
}

function pageOptionImports(
  resource: string,
  pascal: string,
  options: readonly ResourceSliceVariant[],
): string {
  const imports: string[] = [];
  if (options.includes('form')) {
    imports.push(
      `import { ${pascal}Form } from './(_components)/${resource}-form.tsx';`,
      `import { copy${pascal}FormValues, ${lowerFirst(pascal)}FormInitialValues, ${
        lowerFirst(pascal)
      }FormSchema } from './(_lib)/${resource}-form.ts';`,
    );
  }
  if (options.includes('partial')) {
    imports.push(
      `import { ${pascal}Summary } from './(_components)/${resource}-summary.tsx';`,
    );
  }
  if (options.includes('stream')) {
    imports.push(`import ${pascal}Stream from './(_islands)/${pascal}Stream.tsx';`);
  }
  return imports.length > 0 ? `${imports.join('\n')}\n` : '';
}

function pageOptionLayers(
  resource: string,
  camel: string,
  pascal: string,
  partialName: string,
  partialRoute: string,
  options: readonly ResourceSliceVariant[],
): string {
  const layers: string[] = [];
  if (options.includes('form')) {
    layers.push(
      `  .withForm('${camel}Form', ${pascal}Form, {\n` +
        `    schema: ${camel}FormSchema,\n` +
        `    initial: () => ${camel}FormInitialValues,\n` +
        `    mutate: (input) => copy${pascal}FormValues(input),\n` +
        `    onSuccess: () => ({\n` +
        `      message: '${pascal} note saved.',\n` +
        `      nextValues: ${camel}FormInitialValues,\n` +
        `    }),\n` +
        `  })`,
    );
  }
  if (options.includes('partial')) {
    layers.push(
      `  .withLayer('${camel}Summary', ${pascal}Summary, {\n` +
        `    delivery: 'defer',\n` +
        `    loader: load${pascal}Resource,\n` +
        `    partial: () => '${partialRoute}',\n` +
        `    partialName: '${partialName}',\n` +
        `    fallback: <p role='status'>Loading ${resource} summary…</p>,\n` +
        `  })`,
    );
  }
  if (options.includes('stream')) {
    layers.push(`  .withLayer('${camel}Stream', ${pascal}Stream, () => ({}))`);
  }
  return layers.length > 0 ? `${layers.join('\n')}\n` : '';
}

function pageLayoutProps(
  camel: string,
  options: readonly ResourceSliceVariant[],
): string {
  const props: string[] = [];
  if (options.includes('form')) props.push(`      form={slots.${camel}Form()}`);
  if (options.includes('partial')) props.push(`      summary={slots.${camel}Summary()}`);
  if (options.includes('stream')) props.push(`      stream={slots.${camel}Stream()}`);
  return props.length > 0 ? `${props.join('\n')}\n` : '';
}

function viewOptionLinks(
  resource: string,
  options: readonly ResourceSliceVariant[],
): string {
  const links: string[] = [];
  if (options.includes('form')) links.push(optionLink(resource, 'form', 'Managed form'));
  if (options.includes('partial')) links.push(optionLink(resource, 'summary', 'Deferred summary'));
  if (options.includes('stream')) links.push(optionLink(resource, 'stream', 'Live stream'));
  return links.length > 0 ? `${links.join('\n')}\n` : '';
}

function optionLink(resource: string, anchor: string, label: string): string {
  return `          <a href='#${resource}-${anchor}' class='rounded-full border border-ns-border px-2 py-1'>${label}</a>`;
}

function strictOptionSubsets(
  options: readonly ResourceSliceVariant[],
): readonly (readonly ResourceSliceVariant[])[] {
  const optional = options.filter((option) => option !== 'core');
  const subsets: ResourceSliceVariant[][] = [];
  const completeMask = (1 << optional.length) - 1;
  for (let mask = 0; mask < completeMask; mask += 1) {
    const subset: ResourceSliceVariant[] = ['core'];
    optional.forEach((option, index) => {
      if ((mask & (1 << index)) !== 0) subset.push(option);
    });
    subsets.push(subset.sort());
  }
  return subsets;
}

function lowerFirst(value: string): string {
  return value.slice(0, 1).toLowerCase() + value.slice(1);
}
