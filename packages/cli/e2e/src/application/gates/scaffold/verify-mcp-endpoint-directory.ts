import { createServiceEndpointDirectory } from '../../../../../../mcp/mod.ts';

const [projectRoot, appHostPath] = Deno.args;
if (!projectRoot || !appHostPath) {
  throw new Error('project root and AppHost path are required');
}

const result = await createServiceEndpointDirectory({ projectRoot, appHostPath }).list();
const aspire = result.sources.find((source) => source.source === 'aspire-cli');
if (aspire?.outcome !== 'used') {
  throw new Error(`aspire-cli source was not used: ${JSON.stringify(aspire)}`);
}

const users = result.entries.find((entry) => entry.name === 'users');
if (users?.status !== 'running' || users.source !== 'aspire-cli') {
  throw new Error(
    `users endpoint did not resolve live through aspire-cli: ${JSON.stringify(users)}`,
  );
}
console.log(`aspire-cli resolved users at ${users.baseUrl}`);
