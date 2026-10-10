import { assertEquals } from '@std/assert';
import { implement } from '@orpc/server';
import { baseContract, SuccessSchema } from '@netscript/contracts';
import { createContractAuthorizer, createService } from '../../mod.ts';
import { createStaticCredentialAuthenticator } from '../../src/auth/mod.ts';

// No `route.path`: oRPC serves the OpenAPI projection at its default `POST /api/status/ping`.
const contract = {
  status: {
    ping: baseContract.output(SuccessSchema).meta({ access: { authentication: 'none' } }),
  },
};
const implemented = implement(contract);
const router = implemented.router({
  status: { ping: implemented.status.ping.handler(() => ({ success: true })) },
});

Deno.test('a procedure without route.path gets its contract policy on both projections', async () => {
  const app = createService(router, { name: 'parity' })
    .withRPC()
    .withAuthn({
      authenticator: createStaticCredentialAuthenticator({ credentials: {} }),
    })
    .withAuthz({ authorizer: createContractAuthorizer(contract) })
    .build();

  const statuses = [];
  for (
    const [path, body] of [['/api/rpc/status/ping', '{"json":{}}'], ['/api/status/ping', '{}']]
  ) {
    const response = await app.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
    await response.body?.cancel();
    statuses.push(response.status);
  }
  assertEquals(statuses, [200, 200]);
});
