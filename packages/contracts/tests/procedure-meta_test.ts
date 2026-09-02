import { assertEquals } from 'jsr:@std/assert@^1';
import { baseContract } from '@netscript/contracts';

Deno.test('base contract stores NetScript procedure metadata without a reader port', () => {
  assertEquals(baseContract['~orpc'].meta, {});

  const authenticatedRoute = baseContract
    .route({ method: 'GET', path: '/metadata-storage' })
    .meta({
      access: {
        authentication: 'required',
        authorization: {
          scopes: ['metadata:read'],
          roles: ['operator'],
        },
      },
      policy: { cache: 'force-cache' },
    });

  assertEquals(authenticatedRoute['~orpc'].meta, {
    access: {
      authentication: 'required',
      authorization: {
        scopes: ['metadata:read'],
        roles: ['operator'],
      },
    },
    policy: { cache: 'force-cache' },
  });
});
