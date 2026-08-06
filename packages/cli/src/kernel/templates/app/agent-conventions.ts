/** Inputs that determine which scaffolded web-layer examples exist. */
export interface AppConventionsInput {
  readonly appName: string;
  readonly dbEngine: string;
  readonly includeExampleService: boolean;
  readonly serviceName?: string;
}

interface ConventionReference {
  readonly id:
    | 'dashboard-view'
    | 'ui-barrel'
    | 'composition-route'
    | 'service-lib'
    | 'service-page'
    | 'service-island'
    | 'service-shared'
    | 'service-partial'
    | 'telemetry-route';
  readonly path: string;
  readonly purpose: string;
}

const COMMON_REFERENCES: readonly ConventionReference[] = [
  {
    id: 'dashboard-view',
    path: 'routes/(_components)/dashboard-view.tsx',
    purpose: 'server-rendered dashboard composition and app-owned blocks',
  },
  {
    id: 'ui-barrel',
    path: 'components/ui/mod.ts',
    purpose: 'the app-owned Button, Input, Card, Badge, and other UI exports',
  },
  {
    id: 'composition-route',
    path: '/design/composition',
    purpose: 'the live L0-L4 ownership and layout guide',
  },
];

function serviceReferences(
  input: AppConventionsInput,
): readonly ConventionReference[] {
  if (!input.includeExampleService || input.serviceName === undefined) {
    return [];
  }
  const root = `routes/examples/${input.serviceName}`;
  return [
    {
      id: 'service-lib',
      path: 'lib/example-service.ts',
      purpose: 'contract-derived client and query factories',
    },
    {
      id: 'service-page',
      path: `${root}/index.tsx`,
      purpose: 'definePage layers, policy, partial refresh, and telemetry',
    },
    {
      id: 'service-island',
      path: `${root}/(_islands)/ServiceShowcaseLab.tsx`,
      purpose: 'QueryIsland and typed query/mutation options',
    },
    {
      id: 'service-shared',
      path: `${root}/(_shared)/service-showcase.ts`,
      purpose: 'canonical query keys and shared query loaders',
    },
    {
      id: 'service-partial',
      path: `routes/partials/examples/${input.serviceName}/summary.tsx`,
      purpose: 'a deferred server-rendered partial',
    },
    {
      id: 'telemetry-route',
      path: 'routes/examples/telemetry/index.tsx',
      purpose: 'the live-stream telemetry route',
    },
  ];
}

function references(
  input: AppConventionsInput,
): readonly ConventionReference[] {
  return [...serviceReferences(input), ...COMMON_REFERENCES];
}

function referencePath(
  all: readonly ConventionReference[],
  id: ConventionReference['id'],
): string {
  const reference = all.find((candidate) => candidate.id === id);
  if (reference === undefined) {
    throw new Error(`Missing app convention reference: ${id}`);
  }
  return reference.path;
}

/** List every local path or route named by the generated convention files. */
export function appConventionsReferencedPaths(
  input: AppConventionsInput,
): readonly string[] {
  return references(input).map((reference) => reference.path);
}

/** Build the app-scoped dashboard conventions read by coding agents. */
export function buildAppAgentsMarkdown(input: AppConventionsInput): string {
  const localExamples = references(input)
    .map((reference) => `- \`${reference.path}\` - ${reference.purpose}`)
    .join('\n');
  const dataMode = input.dbEngine === 'none'
    ? 'The generated service example uses in-memory sample data.'
    : `The generated service example uses the ${input.dbEngine} scaffold for sample data.`;
  const serviceNote = input.includeExampleService && input.serviceName !== undefined
    ? `\n${dataMode} Its architecture is canonical; its records and domain names are disposable.\n`
    : '';

  return `# NetScript dashboard conventions

Before implementing a real data screen in **${input.appName}**, inspect these local canonical examples:

${localExamples}

## Default architecture

Before hand-writing a service request or probing it with curl, follow the MCP path: \`list_api_services\` to discover the live service name, \`list_service_operations\` to select an operation, then \`get_operation_schema\` for its request and response contract.

1. Start from the service contract and derive the client **and query factories** in one app \`lib\` module.
2. Compose the route with \`definePage\` layers; keep non-interactive regions server-rendered.
3. Hydrate only interactive regions with \`QueryIsland\`, and use \`useMutation\` with canonical query keys.
4. Add a live stream only where the screen needs live state; preserve the same contract and query-key vocabulary.
5. Use \`withForm\` for route-bound validated mutations unless a client-only form is justified.

Do not hand-write Button, Input, Card, or Badge equivalents. Use:

- \`netscript ui:add page <path> --island\` to create a typed Fresh route, a colocated hydrating island, and its query-loader seam.
- \`netscript ui:add island <Name> --query\` to create a named \`QueryIsland\`-based interactive surface.
- \`netscript ui:add data-table\` to copy the app-owned DataTable component and styles.

## Copy versus delete

Copy the contract-to-query flow, page layers, island boundary, mutation/query-key pattern, partial refresh, live-stream boundary, and app-owned UI composition. Delete or replace the example records, labels, service-specific prose, and demonstration-only controls.${serviceNote}
Before finishing, record which canonical surfaces you used or deliberately rejected. A page-sized island requires an explicit reason.
`;
}

/** Build the one-screen web-layer architecture guide for a scaffolded app. */
export function buildWebLayerMarkdown(input: AppConventionsInput): string {
  const all = references(input);
  const service = input.includeExampleService && input.serviceName !== undefined
    ? `The complete local walkthrough starts at \`${
      referencePath(all, 'service-lib')
    }\`, continues through \`${referencePath(all, 'service-page')}\` and \`${
      referencePath(all, 'service-island')
    }\`, and finishes at \`${referencePath(all, 'telemetry-route')}\`.`
    : 'Add a real service contract first, then follow the architecture below without inventing a parallel client or state layer.';

  return `# ${input.appName} web layer

## One-screen path

\`contract → createQueryFactories → definePage layers → QueryIsland/useMutation → live stream\`

1. The contract owns request, response, and error shapes.
2. \`createQueryFactories\` derives one client/query vocabulary from that contract.
3. \`definePage\` layers keep policy, loading, telemetry, partials, and server-rendered layout explicit.
4. \`QueryIsland\` hydrates only the interactive region; \`useMutation\` invalidates the canonical query keys.
5. A live stream updates the same cache instead of creating a second state model.

${service}

Use \`${referencePath(all, 'dashboard-view')}\` and \`${
    referencePath(all, 'ui-barrel')
  }\` for app-owned composition. The ownership rules are rendered at \`${
    referencePath(all, 'composition-route')
  }\`.

## Copy this architecture / delete this sample data

**Copy:** contract-derived query factories, named page layers, server/island boundaries, mutation invalidation, partial refresh, live-stream cache updates, and app-owned UI primitives.

**Delete or replace:** sample records, example names and labels, seeded statuses, explanatory demo controls, and any domain prose that is not true for your product.
`;
}
