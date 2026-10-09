import {
  assert,
  assertEquals,
  assertFalse,
  assertNotEquals,
  assertRejects,
  assertThrows,
} from '@std/assert';
import { baseContract, SuccessSchema } from '@netscript/contracts';
import {
  type AuthenticatorPort,
  type AuthnRequest,
  createCompositeAuthenticator,
  createContractOverlayAuthorizer,
  createInstallationSecret,
  createInternalCredentialAuthenticator,
  deriveInternalCredential,
  INSTALLATION_SECRET_FILE_ENV,
  INTERNAL_SERVICE_SUBJECT,
  isInternalServicePrincipal,
  loadInstallationSecret,
  type Principal,
  type ProcedurePolicyResolution,
} from '../../src/auth/mod.ts';

const MATERIAL = 'k'.repeat(32);

function bearerRequest(token?: string): AuthnRequest {
  const headers = new Headers(token ? { authorization: `Bearer ${token}` } : {});
  return {
    method: 'POST',
    path: '/api/rpc/internal/sync',
    header: (name) => headers.get(name) ?? undefined,
    headers: () => headers,
    cookie: () => undefined,
  };
}

async function withSecretFile<T>(
  content: string | Uint8Array,
  use: (path: string) => Promise<T>,
): Promise<T> {
  const directory = await Deno.makeTempDir();
  const path = `${directory}/installation.secret`;
  try {
    await Deno.writeFile(
      path,
      typeof content === 'string' ? new TextEncoder().encode(content) : content,
    );
    return await use(path);
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
}

Deno.test('installation secret loads from the file reference and ignores trailing whitespace', async () => {
  const fromMemory = await createInstallationSecret(MATERIAL);
  const fromFile = await withSecretFile(
    `${MATERIAL}\n`,
    (path) => loadInstallationSecret({ path }),
  );
  const fromEnv = await withSecretFile(`  ${MATERIAL}\r\n`, async (path) => {
    const previous = Deno.env.get(INSTALLATION_SECRET_FILE_ENV);
    Deno.env.set(INSTALLATION_SECRET_FILE_ENV, path);
    try {
      return await loadInstallationSecret();
    } finally {
      if (previous === undefined) Deno.env.delete(INSTALLATION_SECRET_FILE_ENV);
      else Deno.env.set(INSTALLATION_SECRET_FILE_ENV, previous);
    }
  });

  const expected = await deriveInternalCredential(fromMemory, 'orders');
  assertEquals(await deriveInternalCredential(fromFile, 'orders'), expected);
  assertEquals(await deriveInternalCredential(fromEnv, 'orders'), expected);
  // The handle carries no secret material.
  assertEquals(JSON.stringify(fromFile), '{"kind":"netscript.installation-secret"}');
});

Deno.test('installation secret rejects absent, short, and oversized material', async () => {
  const previous = Deno.env.get(INSTALLATION_SECRET_FILE_ENV);
  Deno.env.delete(INSTALLATION_SECRET_FILE_ENV);
  try {
    await assertRejects(() => loadInstallationSecret(), Error, INSTALLATION_SECRET_FILE_ENV);
  } finally {
    if (previous !== undefined) Deno.env.set(INSTALLATION_SECRET_FILE_ENV, previous);
  }

  await assertRejects(() => createInstallationSecret(`${'k'.repeat(31)}\n`), TypeError);
  await withSecretFile('k'.repeat(4097), async (path) => {
    await assertRejects(() => loadInstallationSecret({ path }), Error, 'exceeds 4096 bytes');
  });
  await assertRejects(
    () => deriveInternalCredential({ kind: 'netscript.installation-secret' }, 'x'),
    TypeError,
  );
});

Deno.test('internal credentials are derived per service and per installation', async () => {
  const secret = await createInstallationSecret(MATERIAL);
  const orders = await deriveInternalCredential(secret, 'orders');

  assert(orders.startsWith('nsi1_'));
  assertEquals(await deriveInternalCredential(secret, 'orders'), orders);
  assertNotEquals(await deriveInternalCredential(secret, 'billing'), orders);
  assertNotEquals(
    await deriveInternalCredential(await createInstallationSecret('j'.repeat(32)), 'orders'),
    orders,
  );
  for (const service of ['', ' orders', 'x'.repeat(129)]) {
    await assertRejects(() => deriveInternalCredential(secret, service), TypeError);
  }
});

Deno.test('internal credential authenticator mints branded internal principals only', async () => {
  const secret = await createInstallationSecret(MATERIAL);
  const authenticator = createInternalCredentialAuthenticator({
    secret,
    service: 'orders',
    scopes: ['orders:sync'],
  });

  const accepted = await authenticator.authenticate(
    bearerRequest(await deriveInternalCredential(secret, 'orders')),
  );
  assert(accepted.ok);
  assertEquals(accepted.principal.subject, INTERNAL_SERVICE_SUBJECT);
  assertEquals(accepted.principal.scopes, ['orders:sync']);
  assertEquals(accepted.principal.claims, { audience: 'orders' });
  assert(isInternalServicePrincipal(accepted.principal));
  // A structural copy, or any principal carrying the same fields, is not an internal caller.
  assertFalse(isInternalServicePrincipal({ ...accepted.principal }));

  assertEquals(await authenticator.authenticate(bearerRequest()), {
    ok: false,
    reason: 'missing-credential',
  });
  assertEquals(
    await authenticator.authenticate(
      bearerRequest(await deriveInternalCredential(secret, 'billing')),
    ),
    { ok: false, reason: 'invalid-credential' },
  );
  assertThrows(
    () => createInternalCredentialAuthenticator({ secret, service: '' }),
    TypeError,
  );
});

Deno.test('composite authenticator returns the first success and the most specific rejection', async () => {
  const principal: Principal = {
    subject: 'user:a',
    scopes: [],
    roles: [],
    scheme: 'custom',
    claims: {},
  };
  const calls: string[] = [];
  const reject = (name: string, reason: string): AuthenticatorPort => ({
    authenticate: () => {
      calls.push(name);
      return { ok: false, reason };
    },
  });
  const accept: AuthenticatorPort = {
    authenticate: () => {
      calls.push('accept');
      return { ok: true, principal };
    },
  };
  const never: AuthenticatorPort = {
    authenticate: () => {
      throw new Error('must not run after a success');
    },
  };

  const first = await createCompositeAuthenticator([
    reject('a', 'missing-credential'),
    accept,
    never,
  ]).authenticate(bearerRequest());
  assert(first.ok);
  assertEquals(calls, ['a', 'accept']);

  assertEquals(
    await createCompositeAuthenticator([
      reject('b', 'missing-credential'),
      reject('c', 'invalid-credential'),
      reject('d', 'session-expired'),
    ]).authenticate(bearerRequest()),
    { ok: false, reason: 'invalid-credential' },
  );
  assertEquals(
    await createCompositeAuthenticator([reject('e', 'missing-credential')]).authenticate(
      bearerRequest(),
    ),
    { ok: false, reason: 'missing-credential' },
  );
  await assertRejects(
    async () =>
      await createCompositeAuthenticator([
        { authenticate: () => Promise.reject(new Error('backend down')) },
        accept,
      ]).authenticate(bearerRequest()),
    Error,
    'backend down',
  );
  assertThrows(() => createCompositeAuthenticator([]), TypeError);
});

Deno.test('contract index covers OpenAPI defaults under the RPC mount and wildcard paths', () => {
  const contract = {
    rpc: {
      // Default OpenAPI path `/rpc/flush` lands inside the `/api/rpc` RPC mount.
      flush: baseContract.output(SuccessSchema).meta({ access: { audience: 'internal' } }),
    },
    files: {
      read: baseContract.route({ method: 'GET', path: '/files/{+path}' })
        .output(SuccessSchema)
        .meta({ access: { audience: 'internal' } }),
    },
    open: { ping: baseContract.route({ method: 'GET', path: '/ping' }).output(SuccessSchema) },
  };
  const resolver = createContractOverlayAuthorizer(contract).bind({
    apiPath: '/api',
    rpcPath: '/api/rpc',
  });
  const internal: ProcedurePolicyResolution = {
    matched: true,
    policy: {
      authentication: 'required',
      requiredScopes: [],
      requiredRoles: [],
      audience: 'internal',
    },
  };

  assertEquals(resolver.resolve({ method: 'POST', path: '/api/rpc/flush' }), internal);
  assertEquals(resolver.resolve({ method: 'POST', path: '/api/rpc/rpc/flush' }), internal);
  assertEquals(resolver.resolve({ method: 'GET', path: '/api/files/a/b/c.txt' }), internal);
  // Unmarked procedures stay unmatched so the service's own policy applies.
  assertEquals(resolver.resolve({ method: 'GET', path: '/api/ping' }), { matched: false });
});

Deno.test('contract authorizers reject unknown and anonymous internal audiences', () => {
  const unknown = {
    odd: baseContract.output(SuccessSchema).meta({
      access: { audience: 'partners' as unknown as 'internal' },
    }),
  };
  const anonymous = {
    open: baseContract.output(SuccessSchema).meta({
      access: { audience: 'internal', authentication: 'none' },
    }),
  };

  assertThrows(() => createContractOverlayAuthorizer(unknown), Error, 'unsupported audience: odd');
  assertThrows(
    () => createContractOverlayAuthorizer(anonymous),
    Error,
    'an internal audience cannot be anonymous: open',
  );
});
