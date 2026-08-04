import {
  createListApiServicesFlow,
  createServiceEndpointDirectory,
  type ListApiServicesResult,
} from '../../../../../../mcp/mod.ts';

const [projectRoot, appHostPath] = Deno.args;
if (!projectRoot || !appHostPath) {
  throw new Error('project root and AppHost path are required');
}

const directory = createServiceEndpointDirectory({ projectRoot, appHostPath });
const receipt = await createListApiServicesFlow(directory)({});
if (!receipt.ok) {
  throw new Error(`list_api_services failed: ${JSON.stringify(receipt.error)}`);
}
const result = receipt.value as ListApiServicesResult;
const aspire = result.sources.find((source) => source.source === 'aspire-cli');
if (aspire?.outcome !== 'used') {
  throw new Error(`aspire-cli source was not used: ${JSON.stringify(aspire)}`);
}

const users = result.services.find((entry) => entry.name === 'users');
if (users?.status !== 'running' || users.source !== 'aspire-cli') {
  throw new Error(
    `users endpoint did not resolve live through aspire-cli: ${JSON.stringify(users)}`,
  );
}
console.log(`list_api_services resolved users through aspire-cli at ${users.baseUrl}`);
