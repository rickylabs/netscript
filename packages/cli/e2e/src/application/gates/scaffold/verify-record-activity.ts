import { generatedAppHomeUrlsFromAppHost } from './generated-app-endpoint.ts';
import { verifyGeneratedCrudAcceptance } from './verify-live-db-endpoint.ts';

// Both database tiers need a committed record mutation before Overview can show
// real activity. SQLite does not run the Postgres allocation/telemetry gate.
if (import.meta.main) {
  const appHost = Deno.args[0];
  if (!appHost) throw new Error('AppHost argument is required');
  const [usersUrl] = await generatedAppHomeUrlsFromAppHost(appHost, 'users');
  if (!usersUrl) throw new Error('Users service has no HTTP endpoint');
  const receipt = await verifyGeneratedCrudAcceptance(usersUrl);
  console.info(JSON.stringify(receipt));
}
