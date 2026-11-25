import { assertRejects } from '@std/assert';
import { PresenceFilter } from 'ldapts';
import { createLdaptsClient } from '../mod.ts';
import type { LdapFilterNode } from '../src/ports/mod.ts';

Deno.test('createLdaptsClient rejects raw/non-AST filters and invalid maxEntries without network I/O', async () => {
  const client = createLdaptsClient({
    url: 'ldaps://dc1.example.test:636',
    timeoutMs: 1_000,
    connectTimeoutMs: 1_000,
    tlsOptions: { rejectUnauthorized: true, servername: 'dc1.example.test' },
  });

  const fakeFilter: LdapFilterNode = {
    type: 0xa7,
    toString: () => '(objectClass=*)',
  };

  await assertRejects(
    () =>
      client.search('DC=example,DC=test', {
        scope: 'sub',
        filter: fakeFilter,
        attributes: ['objectGUID'],
        sizeLimit: 1,
        timeLimit: 1,
      }),
    TypeError,
    'ldapts Filter AST',
  );

  await assertRejects(
    () =>
      client.searchBounded('DC=example,DC=test', {
        scope: 'sub',
        filter: fakeFilter,
        attributes: ['objectGUID'],
        sizeLimit: 0,
        maxEntries: 5,
        timeLimit: 1,
      }),
    TypeError,
    'ldapts Filter AST',
  );

  await assertRejects(
    () =>
      client.searchBounded('DC=example,DC=test', {
        scope: 'sub',
        filter: new PresenceFilter({ attribute: 'objectClass' }),
        attributes: ['objectGUID'],
        sizeLimit: 0,
        maxEntries: 0,
        timeLimit: 1,
      }),
    RangeError,
    'positive integer',
  );
});
