import { assert, assertEquals, assertFalse, assertThrows } from 'jsr:@std/assert@^1';
import { z } from 'zod';
import {
  buildStreamEndpointUrl,
  defineStreamEndpoint,
  isValidStreamOffset,
  STREAM_OFFSET_MAX_BYTES,
} from '../streams.ts';

Deno.test('isValidStreamOffset: accepts canonical tokens and live DurableStreamTestServer offsets', () => {
  const valid = [
    '-1',
    'now',
    '0',
    '0000000000000000_0000000000000170',
    'abc123._~+/-:=',
    'a'.repeat(STREAM_OFFSET_MAX_BYTES),
  ];
  for (const token of valid) {
    assert(isValidStreamOffset(token), `expected valid offset: ${token}`);
  }
});

Deno.test('isValidStreamOffset: rejects empty, oversized, whitespace, control, delimiter, and non-ASCII values', () => {
  const invalid: unknown[] = [
    '',
    'a'.repeat(STREAM_OFFSET_MAX_BYTES + 1),
    ' ',
    'abc def',
    'abc\tdef',
    'abc\rdef',
    'abc\ndef',
    'abc\0def',
    'abc\x1fdef',
    'abc\x7fdef',
    'abc?x=1',
    'abc#frag',
    'abc&live=false',
    'caf\u00e9',
    null,
    undefined,
    42,
    {},
  ];
  for (const token of invalid) {
    assertFalse(isValidStreamOffset(token), `expected invalid offset: ${JSON.stringify(token)}`);
  }
});

Deno.test('defineStreamEndpoint: produces deeply frozen contract with normalized defaults and zero oRPC markers', () => {
  const endpoint = defineStreamEndpoint({
    id: 'projects.feed',
    path: '/api/streams/projects/{projectId}',
    params: z.object({ projectId: z.string().min(1) }),
    query: z.object({ view: z.enum(['summary', 'full']).optional() }),
    access: {
      authorization: { scopes: ['projects:read'], roles: ['member'] },
    },
    summary: 'Project feed',
    tags: ['projects'],
  });

  assertEquals(endpoint.protocol, { family: 'netscript.durable-stream-sse', major: 1 });
  assertEquals(endpoint.method, 'GET');
  assertEquals(endpoint.id, 'projects.feed');
  assertEquals(endpoint.path, '/api/streams/projects/{projectId}');
  assertEquals(endpoint.paramNames, ['projectId']);
  assertEquals(endpoint.clientAuth, 'bearer-or-cookie');
  assertEquals(endpoint.access, {
    authentication: 'required',
    authorization: { scopes: ['projects:read'], roles: ['member'] },
  });
  assert(Object.isFrozen(endpoint));
  assert(Object.isFrozen(endpoint.paramNames));
  assert(Object.isFrozen(endpoint.access));
  assert(Object.isFrozen(endpoint.access.authorization));
  assert(Object.isFrozen(endpoint.tags));
  assertFalse(Object.hasOwn(endpoint, '~orpc'));
  assertFalse(Object.hasOwn(endpoint, '~types'));
});

Deno.test('defineStreamEndpoint: rejects invalid ids, paths, duplicate/missing params, reserved query keys, and invalid access', () => {
  assertThrows(
    () => defineStreamEndpoint({ id: 'bad id!', path: '/api/streams/live' }),
    TypeError,
  );
  const invalidPaths: readonly `/${string}`[] = [
    'api/streams/live' as `/${string}`,
    '/api/streams/live/',
    '/api//streams',
    '/api/streams/*all',
    '/api/streams/live?x=1',
    '/api/streams/live#hash',
    '/api/%73treams/live',
    '/api/streams/../live',
    '/api/streams/prefix-{id}',
    '/api/streams/{123bad}',
    '/api/streams/{id}/{id}',
    // Non-RFC-3986 pchar characters that URL serialization percent-encodes or rejects
    '/api/streams/caf\u00e9',
    '/api/streams/a"b',
    '/api/streams/a<b',
    '/api/streams/a>b',
    '/api/streams/a`b',
    '/api/streams/a[b]',
    '/api/streams/a^b',
    '/api/streams/a|b',
    '/api/streams/a b',
    '/api/streams/a\\b',
  ];
  for (const badPath of invalidPaths) {
    assertThrows(
      () =>
        defineStreamEndpoint({
          id: 'test.bad-path',
          path: badPath,
          params: z.object({ id: z.string() }),
        }),
      TypeError,
      undefined,
      `expected path rejection: ${badPath}`,
    );
  }

  // Valid ASCII RFC 3986 pchar literals (minus % and *) serialize verbatim through URL
  const pcharEndpoint = defineStreamEndpoint({
    id: 'test.pchar-literals',
    path: "/api/v1.0/projects:live/team@org/a-b_c~1!$&'()+,;=/{id}",
    params: z.object({ id: z.string().min(1) }),
  });
  const builtPchar = buildStreamEndpointUrl(pcharEndpoint, {
    baseUrl: 'https://api.example.test',
    params: { id: 'p1' },
  });
  assertEquals(
    new URL(builtPchar).pathname,
    "/api/v1.0/projects:live/team@org/a-b_c~1!$&'()+,;=/p1",
  );

  // Missing params schema when path has parameters
  assertThrows(
    () =>
      defineStreamEndpoint({
        id: 'test.missing-params',
        path: '/api/streams/{projectId}',
      }),
    TypeError,
  );

  // Params schema missing declared parameter key
  assertThrows(
    () =>
      defineStreamEndpoint({
        id: 'test.missing-param-key',
        path: '/api/streams/{projectId}',
        params: z.object({ otherId: z.string() }),
      }),
    TypeError,
  );

  // Reserved protocol query parameters rejected
  for (const reserved of ['offset', 'live', 'cursor'] as const) {
    assertThrows(
      () =>
        defineStreamEndpoint({
          id: `test.reserved-${reserved}`,
          path: '/api/streams/live',
          query: z.object({ [reserved]: z.string().optional() }),
        }),
      TypeError,
    );
  }

  // Optional auth and public internal audience rejected
  assertThrows(
    () =>
      defineStreamEndpoint({
        id: 'test.optional-auth',
        path: '/api/streams/live',
        access: { authentication: 'optional' },
      }),
    TypeError,
  );
  assertThrows(
    () =>
      defineStreamEndpoint({
        id: 'test.public-internal',
        path: '/api/streams/live',
        access: { authentication: 'none', audience: 'internal' },
      }),
    TypeError,
  );
});

Deno.test('buildStreamEndpointUrl: validates wire input, preserves transforms, encodes params, omits live=sse, and rejects invalid inputs', () => {
  const transformed = defineStreamEndpoint({
    id: 'projects.transformed',
    path: '/api/streams/projects/{projectId}/items/{itemNum}',
    params: z.object({
      projectId: z.string().min(1),
      itemNum: z.string().regex(/^\d+$/).transform((raw) => Number(raw) * 10),
    }),
    query: z.object({
      view: z.enum(['summary', 'full']).optional(),
      tag: z.array(z.string()).optional(),
      limit: z.string().regex(/^\d+$/).transform((raw) => Number(raw)).optional(),
    }),
  });

  const url = buildStreamEndpointUrl(transformed, {
    baseUrl: 'https://api.example.test',
    params: { projectId: 'proj 42', itemNum: '7' },
    query: { view: 'summary', tag: ['a', 'b'], limit: '25' },
    offset: '0000000000000000_0000000000000170',
    cursor: 'cur-1',
  });

  const parsed = new URL(url);
  assertEquals(parsed.origin, 'https://api.example.test');
  assertEquals(parsed.pathname, '/api/streams/projects/proj%2042/items/7');
  assertEquals(parsed.searchParams.get('view'), 'summary');
  assertEquals(parsed.searchParams.getAll('tag'), ['a', 'b']);
  assertEquals(parsed.searchParams.get('limit'), '25');
  assertEquals(parsed.searchParams.get('offset'), '0000000000000000_0000000000000170');
  assertEquals(parsed.searchParams.get('cursor'), 'cur-1');
  assertEquals(parsed.searchParams.get('live'), null);

  // Invalid param fails schema validation
  assertThrows(() =>
    buildStreamEndpointUrl(transformed, {
      baseUrl: 'https://api.example.test',
      params: { projectId: 'p1', itemNum: 'not-a-number' },
    })
  );

  // Invalid offset / cursor rejected
  assertThrows(
    () =>
      buildStreamEndpointUrl(transformed, {
        baseUrl: 'https://api.example.test',
        params: { projectId: 'p1', itemNum: '1' },
        offset: 'bad offset with spaces',
      }),
    TypeError,
  );
  assertThrows(
    () =>
      buildStreamEndpointUrl(transformed, {
        baseUrl: 'https://api.example.test',
        params: { projectId: 'p1', itemNum: '1' },
        cursor: 'bad&cursor',
      }),
    TypeError,
  );

  // Non-wire-serializable input throws TypeError
  const dateEndpoint = defineStreamEndpoint({
    id: 'projects.date',
    path: '/api/streams/events',
    query: z.object({ since: z.date() }),
  });
  assertThrows(
    () =>
      buildStreamEndpointUrl(dateEndpoint, {
        baseUrl: 'https://api.example.test',
        query: { since: new Date('2026-11-25T00:00:00Z') },
      }),
    TypeError,
  );
});

Deno.test('contracts/streams public declarations have zero @orpc or npm type leakage', async () => {
  const entrypoint = new URL('../streams.ts', import.meta.url).href;
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['doc', '--json', entrypoint],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stderr = new TextDecoder().decode(output.stderr);
  assertEquals(output.code, 0, stderr);
  const raw = new TextDecoder().decode(output.stdout);
  assertFalse(raw.includes('@orpc'), '@netscript/contracts/streams leaks @orpc');
  assertFalse(raw.includes('npm:'), '@netscript/contracts/streams leaks npm: types');
});
