/** Guards the documented preferred paths and CLI mutation map against surface drift. */

const root = new URL('../../../', import.meta.url);

async function read(path: string): Promise<string> {
  return await Deno.readTextFile(new URL(path, root));
}

function requireText(text: string, needle: string, location: string): void {
  if (!text.includes(needle)) {
    throw new Error(`${location}: missing required accuracy marker ${JSON.stringify(needle)}`);
  }
}

const publicDocs = await Promise.all([
  'docs/site/durable-workflows/sagas.md',
  'docs/site/tutorials/storefront/04-checkout-saga.md',
  'docs/site/explanation/architecture.md',
  'docs/site/explanation/durability-model.md',
].map(read));
const sagaSource = await read('packages/plugin-sagas-core/src/builders/define-saga.ts');

requireText(sagaSource, 'export function defineSaga<', 'defineSaga source');
requireText(sagaSource, 'id: TId', 'defineSaga source');
for (const [index, page] of publicDocs.entries()) {
  if (/defineSaga\s*\(\s*\{/.test(page)) {
    throw new Error(
      `saga documentation page ${index + 1}: defineSaga must start with an id, not an object`,
    );
  }
}

const howToIndex = await read('docs/site/how-to/index.md');
for (
  const preferredPath of [
    'withResource',
    'useLiveQuery',
    'ui:add',
    'cloud-run',
    '@netscript/sdk/collections',
    '@netscript/sdk/query-client',
    'CacheQuery',
    'Scalar/OpenAPI',
  ]
) {
  requireText(howToIndex, preferredPath, 'how-to preferred-path index');
}

const cliReference = await read('docs/site/cli-reference.md');
requireText(cliReference, '## Mutation and regeneration map', 'CLI reference');
requireText(
  cliReference,
  '| Command | Source of truth mutated | Generated artifacts | Runtime consumers | Preview |',
  'CLI reference',
);

const requiredMutationFamilies = [
  'init',
  'config set',
  'contract add',
  'contract add-route',
  'contract version add',
  'service add',
  'service set',
  'service ref',
  'db add',
  'db init',
  'plugin install',
  'plugin update',
  'generate plugins',
  'generate runtime-schemas',
  'generate aspire',
  'ui:init',
  'ui:add',
  'deploy',
];
for (const command of requiredMutationFamilies) {
  requireText(cliReference, `\`netscript ${command}`, 'CLI mutation map');
}

console.log(
  `docs accuracy: PASS (${publicDocs.length} saga pages, 8 preferred paths, ${requiredMutationFamilies.length} CLI mutation families)`,
);
