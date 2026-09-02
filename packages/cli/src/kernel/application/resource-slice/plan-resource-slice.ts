import type {
  NormalizedResourceSliceInput,
  ResourceSliceOptionalVariant,
  ResourceSlicePlan,
  ResourceSlicePlannedLeaf,
  ResourceSliceVariant,
} from './resource-slice-contract.ts';

type LeafDefinition = Readonly<{
  role: ResourceSlicePlannedLeaf['role'];
  variant: ResourceSliceVariant;
  template: string;
  path: (input: NormalizedResourceSliceInput) => string;
}>;

const LEAF_DEFINITIONS: readonly LeafDefinition[] = [
  {
    role: 'route-contract',
    variant: 'core',
    template: 'index.route.ts',
    path: inRoute('index.route.ts'),
  },
  { role: 'page', variant: 'core', template: 'index.tsx', path: inRoute('index.tsx') },
  {
    role: 'layout',
    variant: 'core',
    template: 'index.layout.tsx',
    path: inRoute('index.layout.tsx'),
  },
  {
    role: 'view',
    variant: 'core',
    template: '(_components)/resource-view.tsx',
    path: (input) => `${input.routeDirectory}/(_components)/${input.resource}-view.tsx`,
  },
  {
    role: 'island',
    variant: 'core',
    template: '(_islands)/ResourceIsland.tsx',
    path: (input) => `${input.routeDirectory}/(_islands)/${input.resourcePascalCase}Island.tsx`,
  },
  {
    role: 'loaders',
    variant: 'core',
    template: '(_shared)/resource-loaders.ts',
    path: (input) => `${input.routeDirectory}/(_shared)/${input.resource}-loaders.ts`,
  },
  {
    role: 'form-component',
    variant: 'form',
    template: '(_components)/resource-form.tsx',
    path: (input) => `${input.routeDirectory}/(_components)/${input.resource}-form.tsx`,
  },
  {
    role: 'form-contract',
    variant: 'form',
    template: '(_lib)/resource-form.ts',
    path: (input) => `${input.routeDirectory}/(_lib)/${input.resource}-form.ts`,
  },
  {
    role: 'summary-component',
    variant: 'partial',
    template: '(_components)/resource-summary.tsx',
    path: (input) => `${input.routeDirectory}/(_components)/${input.resource}-summary.tsx`,
  },
  {
    role: 'partial-route',
    variant: 'partial',
    template: 'partials/summary.tsx',
    path: (input) => input.partialRouteFile,
  },
  {
    role: 'stream-island',
    variant: 'stream',
    template: '(_islands)/ResourceStream.tsx',
    path: (input) => `${input.routeDirectory}/(_islands)/${input.resourcePascalCase}Stream.tsx`,
  },
];

/** Build the deterministic, IO-free structural plan for one resource slice. */
export function planResourceSlice(
  input: NormalizedResourceSliceInput,
): ResourceSlicePlan {
  const selected = new Set<ResourceSliceVariant>(input.variants);
  const leaves = LEAF_DEFINITIONS
    .filter((definition) => selected.has(definition.variant))
    .map((definition): ResourceSlicePlannedLeaf => ({
      path: definition.path(input),
      role: definition.role,
      template: definition.template,
      options: leafOptions(definition, input.variants),
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const factory = [input.client.queryFactoryName, ...input.procedure.path].join('.');

  return {
    input,
    leaves,
    query: {
      factory,
      queryOptions: `${factory}.queryOptions(input)`,
      clientKey: `${factory}.clientKey(input)`,
    },
    appRoutes: {
      path: 'router.ts',
      alias: input.routeAlias,
      route: input.route,
    },
    state: input.requiredState ? { path: 'utils.ts', requirement: input.requiredState } : undefined,
  };
}

function inRoute(name: string): (input: NormalizedResourceSliceInput) => string {
  return (input) => `${input.routeDirectory}/${name}`;
}

function leafOptions(
  definition: LeafDefinition,
  selected: readonly ResourceSliceVariant[],
): readonly ResourceSliceVariant[] {
  if (definition.role === 'page' || definition.role === 'view') return selected;
  if (definition.variant === 'core') return ['core'];
  const options: ResourceSliceVariant[] = [
    'core',
    definition.variant as ResourceSliceOptionalVariant,
  ];
  return options.sort();
}
