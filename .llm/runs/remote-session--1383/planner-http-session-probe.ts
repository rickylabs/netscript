// Planner probe (research evidence only, not a test): does the native auth plugin service, served
// over real HTTP and called through the typed SDK, see cookie / bearer credentials on GET /session?
import { createPluginService } from '../../../packages/plugin/src/service/mod.ts';
import { createServiceClient } from '../../../packages/sdk/src/client/mod.ts';
import { createBearerSdkClientContribution } from '../../../packages/plugin-auth-core/src/sdk/mod.ts';
import { authContract } from '../../../packages/plugin-auth-core/src/contracts/v1/mod.ts';
import { createInMemoryKvOAuthRegistry } from '../../../plugins/auth/services/src/backend-registry.ts';
import { callback, signin } from '../../../plugins/auth/services/src/routers/v1-handlers.ts';
import { router } from '../../../plugins/auth/services/src/router.ts';
import { withAuthRequest } from '../../../plugins/auth/services/src/request-context.ts';
import { authTestUrl } from '../../../plugins/auth/tests/testing/auth-fixtures.ts';

const registry = await createInMemoryKvOAuthRegistry({ fetch: () => Promise.resolve(new Response(JSON.stringify({ access_token: 'a', refresh_token: 'r', token_type: 'Bearer', expires_in: 3600, scope: 'profile' }), { headers: { 'content-type': 'application/json' } })) });
const started = await signin({ redirectTo: '/d' }, { registry, request: { url: authTestUrl('/v1/auth/signin'), headers: new Headers({ 'x-forwarded-proto': 'https' }) } });
const redirect = new URL(started.redirectUrl!);
const completed = await callback({ code: 'c', state: redirect.searchParams.get('state') ?? undefined }, { registry, request: { url: authTestUrl(`/v1/auth/callback?txn=${redirect.searchParams.get('txn')}`), headers: new Headers({ 'x-forwarded-proto': 'https' }) } });
const sessionId = completed.sessionId!;

const running = await createPluginService(router, { name: 'auth', version: '0.0.0', port: 0, middleware: [withAuthRequest], context: () => ({ registry }), traceContext: false }).serve({ port: 0 });
const serviceName = 'planner-auth-probe';
Deno.env.set(`services__${serviceName}__http__0`, `http://127.0.0.1:${running.addr.port}`);
const out: Record<string, unknown> = { source: '3330d6f9c9c4fcbf123b434c7cf8733648c44d87', scope: 'native plugin service over real HTTP + typed SDK, in-memory kv-oauth, no IdP' };
try {
  const plain = createServiceClient({ contract: authContract, serviceName, routerName: 'auth', propagateTraceContext: false });
  out.directSessionId = (await plain.session({ sessionId })).authenticated;
  // Cookie case: raw request on the RPC path (probe only; the SDK forbids a cookie-owning contribution).
  const cookieResponse = await fetch(`http://127.0.0.1:${running.addr.port}/api/rpc/v1/auth/session`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: `__Host-ns_session=${sessionId}` }, body: JSON.stringify({ json: {} }) });
  out.cookieStatus = cookieResponse.status; out.cookieBody = (await cookieResponse.text()).slice(0, 160);
  const bearer = createBearerSdkClientContribution<{ accessToken: string }>({ context: { accessToken: 'required' }, resolveCredential: ({ context }) => context.accessToken, responseCache: { mode: 'direct-only' } });
  const bearerClient = createServiceClient({ contract: authContract, serviceName, routerName: 'auth', propagateTraceContext: false, contributions: [bearer] as const });
  out.bearerAuthenticated = (await bearerClient.session(undefined, { context: { accessToken: sessionId } })).authenticated;
  out.bearerBogusAuthenticated = (await bearerClient.session(undefined, { context: { accessToken: 'not-a-session' } })).authenticated;
} catch (error) {
  out.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
} finally {
  await running.stop();
}
console.log(JSON.stringify(out));
Deno.exit(0);
