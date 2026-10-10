import { assertEquals, assertRejects } from '@std/assert';
import { os } from '@orpc/server';
import { createService } from '../../service/mod.ts';
import {
  createContractOverlayAuthorizer,
  createInstallationSecret,
  createInternalCredentialAuthenticator,
  deriveInternalCredential,
  INSTALLATION_SECRET_FILE_ENV,
  loadInstallationSecret,
} from '../../service/src/auth/mod.ts';
import { createInternalCredentialSdkClientContribution } from '../src/client/internal-credential-contribution.ts';
import { createServiceClient } from '../src/client/service-client.ts';
import { createServerServiceEnvKey } from '../src/discovery/service-url.ts';
import type {
  NetScriptProcedureMeta,
  SdkClientPrepareOptions,
} from '../src/ports/sdk-client-contribution.ts';

const SERVICE = 'sdk-internal';
const MATERIAL = 's'.repeat(32);

function prepareOptions(
  meta: NetScriptProcedureMeta,
  origin = 'http://127.0.0.1:4100',
): SdkClientPrepareOptions {
  const url = new URL(origin);
  return {
    context: {},
    procedure: { path: ['internal', 'sync'], meta },
    transport: {
      kind: 'http',
      origin: url,
      rpcPath: '/api/rpc',
      secure: url.protocol === 'https:',
    },
    input: {},
  };
}

async function withEnv<T>(values: Record<string, string>, use: () => Promise<T>): Promise<T> {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, Deno.env.get(key)]));
  for (const [key, value] of Object.entries(values)) Deno.env.set(key, value);
  try {
    return await use();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    }
  }
}

Deno.test('internal credential contribution is a direct-only owner of authorization', () => {
  const contribution = createInternalCredentialSdkClientContribution({ service: SERVICE });

  assertEquals(contribution.id, '@netscript/sdk:internal-credential');
  assertEquals(contribution.context, {});
  assertEquals(contribution.headerKeys, ['authorization']);
  assertEquals(contribution.responseCache, { mode: 'direct-only' });
});

Deno.test('internal credential contribution sends the per-service bearer except to anonymous procedures', async () => {
  const secret = await createInstallationSecret(MATERIAL);
  const contribution = createInternalCredentialSdkClientContribution({ secret, service: SERVICE });
  const expected = `Bearer ${await deriveInternalCredential(secret, SERVICE)}`;

  assertEquals(
    await contribution.prepare(prepareOptions({ access: { audience: 'internal' } })),
    { headers: { authorization: expected } },
  );
  // Unmarked procedures also receive it, so session-guarded services that compose the internal
  // authenticator accept background callers.
  assertEquals(await contribution.prepare(prepareOptions({})), {
    headers: { authorization: expected },
  });
  assertEquals(
    await contribution.prepare(prepareOptions({ access: { authentication: 'none' } })),
    {},
  );
});

Deno.test('internal credential contribution refuses non-loopback cleartext without consent', async () => {
  const secret = await createInstallationSecret(MATERIAL);
  const strict = createInternalCredentialSdkClientContribution({ secret, service: SERVICE });
  const consenting = createInternalCredentialSdkClientContribution({
    secret,
    service: SERVICE,
    allowInsecureTransport: true,
  });
  const remote = prepareOptions({}, 'http://orders.internal:8080');

  await assertRejects(async () => await strict.prepare(remote), Error, 'secure transport');
  assertEquals(Object.keys((await consenting.prepare(remote)).headers ?? {}), ['authorization']);
  for (const origin of ['https://orders.example', 'http://localhost:1', 'http://[::1]:1']) {
    assertEquals(
      Object.keys((await strict.prepare(prepareOptions({}, origin))).headers ?? {}),
      ['authorization'],
      origin,
    );
  }
});

Deno.test('internal credential contribution reads the secret file reference once', async () => {
  const directory = await Deno.makeTempDir();
  const path = `${directory}/installation.secret`;
  try {
    await Deno.writeTextFile(path, `${MATERIAL}\n`);
    await withEnv({ [INSTALLATION_SECRET_FILE_ENV]: path }, async () => {
      const contribution = createInternalCredentialSdkClientContribution({ service: SERVICE });
      const first = await contribution.prepare(prepareOptions({}));

      // Rewriting the file does not change an already-derived credential.
      await Deno.writeTextFile(path, 'r'.repeat(32));
      assertEquals(await contribution.prepare(prepareOptions({})), first);
      assertEquals(first, {
        headers: {
          authorization: `Bearer ${await deriveInternalCredential(
            await createInstallationSecret(MATERIAL),
            SERVICE,
          )}`,
        },
      });
    });
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test('a worker-style client reaches an internal procedure only with the contribution', async () => {
  const meta = os.$meta<NetScriptProcedureMeta>({});
  const router = {
    internal: {
      sync: meta.route({ method: 'POST', path: '/internal/sync' })
        .meta({ access: { audience: 'internal' } })
        .handler(() => ({ synced: true })),
    },
  };
  const directory = await Deno.makeTempDir();
  const secretPath = `${directory}/installation.secret`;
  await Deno.writeTextFile(secretPath, MATERIAL);
  const secret = await loadInstallationSecret({ path: secretPath });
  const running = await createService(router, { name: SERVICE })
    .withRPC({ rpcPath: `/api/rpc/v1/${SERVICE}` })
    .withAuthn({
      authenticator: createInternalCredentialAuthenticator({ secret, service: SERVICE }),
      allowAnonymous: ['/api', '/health'],
    })
    .withAuthz({ authorizer: createContractOverlayAuthorizer(router) })
    .serve({ port: 0 });
  const host = running.addr.hostname === '0.0.0.0' ? '127.0.0.1' : running.addr.hostname;

  try {
    await withEnv({
      [createServerServiceEnvKey(SERVICE)]: `http://${host}:${running.addr.port}`,
      // The carrier hands workers the same file reference the service was given.
      [INSTALLATION_SECRET_FILE_ENV]: secretPath,
    }, async () => {
      const anonymous = createServiceClient({
        contract: router,
        serviceName: SERVICE,
      });
      await assertRejects(() => anonymous.internal.sync({}));

      const worker = createServiceClient({
        contract: router,
        serviceName: SERVICE,
        contributions: [
          createInternalCredentialSdkClientContribution({ service: SERVICE }),
        ] as const,
      });
      assertEquals(await worker.internal.sync({}), { synced: true });
    });
  } finally {
    await running.stop();
    await Deno.remove(directory, { recursive: true });
  }
});
