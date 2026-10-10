import { assertEquals } from '@std/assert';
import { implement } from '@orpc/server';
import { StandardOpenAPIMatcher } from '@orpc/openapi/standard';
import { baseContract, SuccessSchema } from '@netscript/contracts';
import { createContractAuthorizer } from '../../src/auth/mod.ts';

/**
 * Drift guard: the contract-policy index must select exactly the procedure oRPC's own OpenAPI
 * matcher selects. Every procedure carries a unique scope, so the resolved policy names the
 * procedure the index chose. If an oRPC or rou3 upgrade changes route precedence, this fails.
 */

function procedure(method: 'GET' | 'POST', path: `/${string}`, name: string) {
  return baseContract.route({ method, path }).output(SuccessSchema)
    .meta({ access: { authorization: { scopes: [name] } } });
}

const contract = {
  itemParam: procedure('POST', '/items/{id}', 'itemParam'),
  itemStatic: procedure('POST', '/items/admin', 'itemStatic'),
  itemNested: procedure('GET', '/items/{id}/parts/{part}', 'itemNested'),
  itemNestedStatic: procedure('GET', '/items/{id}/parts/main', 'itemNestedStatic'),
  fileWildcard: procedure('GET', '/files/{+path}', 'fileWildcard'),
  fileParam: procedure('GET', '/files/{id}', 'fileParam'),
  fileStatic: procedure('GET', '/files/admin/keys', 'fileStatic'),
  defaults: {
    sync: baseContract.output(SuccessSchema)
      .meta({ access: { authorization: { scopes: ['defaults.sync'] } } }),
  },
};

const implemented = implement(contract);
const ok = () => ({ success: true });
const router = implemented.router({
  itemParam: implemented.itemParam.handler(ok),
  itemStatic: implemented.itemStatic.handler(ok),
  itemNested: implemented.itemNested.handler(ok),
  itemNestedStatic: implemented.itemNestedStatic.handler(ok),
  fileWildcard: implemented.fileWildcard.handler(ok),
  fileParam: implemented.fileParam.handler(ok),
  fileStatic: implemented.fileStatic.handler(ok),
  defaults: { sync: implemented.defaults.sync.handler(ok) },
});

const REQUESTS: readonly (readonly [string, `/${string}`])[] = [
  ['POST', '/items/admin'],
  ['POST', '/items/42'],
  ['POST', '/items/%61dmin'],
  ['POST', '/items/admin/'],
  ['GET', '/items/admin'],
  ['GET', '/items/7/parts/main'],
  ['GET', '/items/7/parts/side'],
  ['GET', '/files/admin/keys'],
  ['GET', '/files/admin'],
  ['GET', '/files/a/b/c'],
  ['GET', '/files'],
  ['HEAD', '/files/a'],
  ['get', '/files/a'],
  ['POST', '/defaults/sync'],
  ['POST', '/Defaults/sync'],
];

Deno.test('contract index selects the procedure oRPC’s OpenAPI matcher selects', async () => {
  const matcher = new StandardOpenAPIMatcher();
  matcher.init(router);
  const resolver = createContractAuthorizer(contract).bind({
    apiPath: '/api',
    rpcPath: '/api/rpc',
  });

  for (const [method, path] of REQUESTS) {
    const expected = (await matcher.match(method, path))?.path.join('.');
    const resolution = resolver.resolve({ method, path: `/api${path}` });
    const actual = resolution.matched ? resolution.policy?.requiredScopes[0] : undefined;
    assertEquals(actual, expected, `${method} ${path}`);
  }
});
