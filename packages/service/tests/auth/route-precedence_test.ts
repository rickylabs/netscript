import { assertEquals, assertThrows } from '@std/assert';
import { implement } from '@orpc/server';
import { baseContract, SuccessSchema } from '@netscript/contracts';
import { createContractAuthorizer, createService, type ServiceApp } from '../../mod.ts';
import {
  type ContractPolicyContract,
  createCompositeAuthenticator,
  createContractOverlayAuthorizer,
  createInstallationSecret,
  createInternalCredentialAuthenticator,
  createStaticCredentialAuthenticator,
  deriveInternalCredential,
  type InstallationSecret,
} from '../../src/auth/mod.ts';

/**
 * Route-precedence regressions: oRPC selects a static OpenAPI route over a parameter route over a
 * wildcard, and matches the undecoded pathname. Authorization must reach the procedure oRPC
 * actually executes, whatever order the contract declares the overlapping procedures in.
 */

const SERVICE = 'catalog';
const USER_TOKEN = 'user-session-token';

type Method = 'GET' | 'POST';
type Kind = 'public' | 'internal';

interface RouteSpec {
  readonly label: string;
  readonly kind: Kind;
  readonly method: Method;
  readonly path: `/${string}`;
}

interface Scenario {
  readonly name: string;
  readonly routes: readonly [RouteSpec, RouteSpec];
  /** Request path (under `/api`) and the procedure oRPC executes for it. */
  readonly probes: readonly { readonly path: string; readonly reaches: string }[];
}

const SCENARIOS: readonly Scenario[] = [
  {
    name: 'internal static beside public parameter',
    routes: [
      { label: 'public-param', kind: 'public', method: 'POST', path: '/items/{id}' },
      { label: 'internal-static', kind: 'internal', method: 'POST', path: '/items/admin' },
    ],
    probes: [
      { path: '/api/items/admin', reaches: 'internal-static' },
      { path: '/api/items/42', reaches: 'public-param' },
      // Undecoded `%61dmin` is not the static segment `admin`: oRPC runs the parameter route.
      { path: '/api/items/%61dmin', reaches: 'public-param' },
    ],
  },
  {
    name: 'internal parameter beside public static',
    routes: [
      { label: 'internal-param', kind: 'internal', method: 'POST', path: '/items/{id}' },
      { label: 'public-static', kind: 'public', method: 'POST', path: '/items/public' },
    ],
    probes: [
      { path: '/api/items/public', reaches: 'public-static' },
      { path: '/api/items/42', reaches: 'internal-param' },
      // Decoding would select the public static route; oRPC runs the internal parameter route.
      { path: '/api/items/p%75blic', reaches: 'internal-param' },
    ],
  },
  {
    name: 'internal static beside public wildcard',
    routes: [
      { label: 'public-wildcard', kind: 'public', method: 'GET', path: '/files/{+path}' },
      { label: 'internal-static', kind: 'internal', method: 'GET', path: '/files/admin/keys' },
    ],
    probes: [
      { path: '/api/files/admin/keys', reaches: 'internal-static' },
      { path: '/api/files/a/b/c', reaches: 'public-wildcard' },
      // Undecoded `%61dmin` misses the static route, so oRPC runs the public wildcard.
      { path: '/api/files/%61dmin/keys', reaches: 'public-wildcard' },
    ],
  },
  {
    name: 'internal parameter beside public wildcard',
    routes: [
      { label: 'public-wildcard', kind: 'public', method: 'GET', path: '/files/{+path}' },
      { label: 'internal-param', kind: 'internal', method: 'GET', path: '/files/{id}' },
    ],
    probes: [
      { path: '/api/files/one', reaches: 'internal-param' },
      { path: '/api/files/one/two', reaches: 'public-wildcard' },
    ],
  },
];

/**
 * `overlay` and `strict` mark public procedures `authentication: 'none'`; `overlay-unmarked`
 * leaves them unmarked in an otherwise-public service (`allowAnonymous: ['/api']`).
 */
const AUTHORIZERS = {
  overlay: createContractOverlayAuthorizer,
  strict: createContractAuthorizer,
  'overlay-unmarked': createContractOverlayAuthorizer,
} as const;

interface Harness {
  readonly app: ServiceApp;
  readonly executed: string[];
}

function procedureFor(spec: RouteSpec, unmarkedPublic: boolean) {
  const route = baseContract.route({ method: spec.method, path: spec.path }).output(SuccessSchema);
  if (spec.kind === 'internal') return route.meta({ access: { audience: 'internal' } });
  return unmarkedPublic ? route : route.meta({ access: { authentication: 'none' } });
}

function harness(
  routes: readonly [RouteSpec, RouteSpec],
  authorizer: keyof typeof AUTHORIZERS,
  secret: InstallationSecret,
): Harness {
  const [firstSpec, secondSpec] = routes;
  const unmarkedPublic = authorizer === 'overlay-unmarked';
  const contract = {
    first: procedureFor(firstSpec, unmarkedPublic),
    second: procedureFor(secondSpec, unmarkedPublic),
  };
  const executed: string[] = [];
  const implemented = implement(contract);
  const router = implemented.router({
    first: implemented.first.handler(() => {
      executed.push(firstSpec.label);
      return { success: true };
    }),
    second: implemented.second.handler(() => {
      executed.push(secondSpec.label);
      return { success: true };
    }),
  });
  const policyContract: ContractPolicyContract = contract;
  const app = createService(router, { name: SERVICE })
    .withRPC()
    .withAuthn({
      authenticator: createCompositeAuthenticator([
        createInternalCredentialAuthenticator({ secret, service: SERVICE }),
        createStaticCredentialAuthenticator({
          credentials: { [USER_TOKEN]: { subject: 'user:alice' } },
        }),
      ]),
      ...(unmarkedPublic ? { allowAnonymous: ['/api', '/health'] } : {}),
    })
    .withAuthz({ authorizer: AUTHORIZERS[authorizer](policyContract) })
    .build();
  return { app, executed };
}

async function call(
  { app, executed }: Harness,
  method: Method,
  path: string,
  bearer?: string,
): Promise<{ readonly status: number; readonly executed: readonly string[] }> {
  executed.length = 0;
  const response = await app.request(path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
    },
    ...(method === 'POST' ? { body: '{}' } : {}),
  });
  await response.body?.cancel();
  return { status: response.status, executed: [...executed] };
}

for (const scenario of SCENARIOS) {
  for (const authorizer of ['overlay', 'strict', 'overlay-unmarked'] as const) {
    Deno.test(`${authorizer}: ${scenario.name}, both declaration orders`, async () => {
      const secret = await createInstallationSecret(new Uint8Array(32).fill(7));
      const credential = await deriveInternalCredential(secret, SERVICE);
      const kindOf = new Map(scenario.routes.map((route) => [route.label, route]));
      const orders = {
        declared: scenario.routes,
        reversed: [scenario.routes[1], scenario.routes[0]] as const,
      };

      for (const [order, routes] of Object.entries(orders)) {
        const target = harness(routes, authorizer, secret);
        for (const probe of scenario.probes) {
          const route = kindOf.get(probe.reaches);
          if (!route) throw new Error(`unknown probe target ${probe.reaches}`);
          const context = `${order} order: ${probe.path} → ${probe.reaches}`;

          if (route.kind === 'internal') {
            assertEquals(
              await call(target, route.method, probe.path),
              { status: 401, executed: [] },
              `anonymous, ${context}`,
            );
            assertEquals(
              await call(target, route.method, probe.path, USER_TOKEN),
              { status: 403, executed: [] },
              `session, ${context}`,
            );
            assertEquals(
              await call(target, route.method, probe.path, credential),
              { status: 200, executed: [probe.reaches] },
              `credentialed, ${context}`,
            );
          } else {
            assertEquals(
              await call(target, route.method, probe.path),
              { status: 200, executed: [probe.reaches] },
              `anonymous, ${context}`,
            );
          }
        }
      }
    });
  }
}

Deno.test('same-route procedures with different access are rejected at construction', () => {
  // oRPC would pick between these by router key order, which the contract cannot see.
  const ambiguous = {
    open: baseContract.route({ method: 'POST', path: '/jobs/{id}' }).output(SuccessSchema)
      .meta({ access: { authentication: 'none' } }),
    sealed: baseContract.route({ method: 'POST', path: '/jobs/{jobId}' }).output(SuccessSchema)
      .meta({ access: { audience: 'internal' } }),
  };
  const consistent = {
    a: baseContract.route({ method: 'POST', path: '/jobs/{id}' }).output(SuccessSchema),
    b: baseContract.route({ method: 'POST', path: '/jobs/{jobId}' }).output(SuccessSchema),
  };

  for (const factory of Object.values(AUTHORIZERS)) {
    assertThrows(
      () => factory(ambiguous),
      Error,
      'procedures with different access share an OpenAPI route: open, sealed',
    );
    factory(consistent);
  }
});
