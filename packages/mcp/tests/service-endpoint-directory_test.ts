import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import {
  createServiceEndpointDirectory,
  type ServiceEndpointDirectoryOptions,
} from '../src/application/service-endpoint-directory.ts';
import type {
  EndpointCandidate,
  EndpointSource,
  EndpointSourcePort,
  ServiceEndpointProbePort,
  ServiceEndpointProbeResult,
  SourceOutcome,
} from '../src/ports/service-endpoint-directory-port.ts';
import {
  FetchServiceEndpointProbe,
  SPEC_UNAVAILABLE_AUTH_GUIDANCE,
} from '../src/infrastructure/service-endpoints/fetch-service-endpoint-probe.ts';

function candidate(
  name: string,
  source: EndpointSource,
  baseUrl?: string,
): EndpointCandidate {
  return {
    name,
    ...(baseUrl === undefined ? {} : { baseUrl }),
    source,
    operatorTrusted: source === 'override',
  };
}

function used(
  source: EndpointSource,
  candidates: readonly EndpointCandidate[],
  excludedServices: readonly string[] = [],
): SourceOutcome {
  return { source, outcome: 'used', candidates, excludedServices };
}

function absent(source: EndpointSource): SourceOutcome {
  return { source, outcome: 'absent', candidates: [], excludedServices: [] };
}

function sourceReturning(outcome: SourceOutcome): EndpointSourcePort {
  return { read: () => Promise.resolve(outcome) };
}

function sourceAdapters(outcomes: Readonly<Record<EndpointSource, SourceOutcome>>): Readonly<
  Record<EndpointSource, EndpointSourcePort>
> {
  return {
    override: sourceReturning(outcomes.override),
    'aspire-cli': sourceReturning(outcomes['aspire-cli']),
    'run-manifest': sourceReturning(outcomes['run-manifest']),
    appsettings: sourceReturning(outcomes.appsettings),
  };
}

function directoryOptions(
  outcomes: Readonly<Record<EndpointSource, SourceOutcome>>,
  probe: ServiceEndpointProbePort,
  options: Partial<Pick<ServiceEndpointDirectoryOptions, 'timeoutMs' | 'concurrency'>> = {},
): ServiceEndpointDirectoryOptions {
  return {
    projectRoot: '/project',
    sourceAdapters: sourceAdapters(outcomes),
    probe,
    ...options,
  };
}

Deno.test('directory exposes all sources, applies precedence, conflicts, statuses, and pre-fetch exclusions', async () => {
  const probed: string[] = [];
  const probe: ServiceEndpointProbePort = {
    probe: (entry): Promise<ServiceEndpointProbeResult> => {
      probed.push(entry.name);
      if (entry.name === 'auth') {
        return Promise.resolve({
          outcome: 'spec_unavailable',
          reason: 'OpenAPI document returned HTTP 401.',
          httpStatus: 401,
          guidance: SPEC_UNAVAILABLE_AUTH_GUIDANCE,
        });
      }
      if (entry.name === 'reused') {
        return Promise.resolve({
          outcome: 'identity_mismatch',
          reason: 'Expected service "reused" but endpoint identified as "foreign".',
        });
      }
      return Promise.resolve({
        outcome: 'running',
        spec: { openapi: '3.1.0', service: entry.name },
      });
    },
  };
  const outcomes = {
    override: used('override', [
      candidate('secret', 'override', 'http://operator.example.test'),
      candidate('users', 'override', 'http://operator.example.test/users'),
    ], ['secret']),
    'aspire-cli': used('aspire-cli', [
      candidate('auth', 'aspire-cli', 'http://127.0.0.1:4101'),
      candidate('reused', 'aspire-cli', 'http://127.0.0.1:4102'),
      candidate('users', 'aspire-cli', 'http://127.0.0.1:4103'),
    ]),
    'run-manifest': used('run-manifest', [
      candidate('users', 'run-manifest', 'http://127.0.0.1:4104'),
    ]),
    appsettings: used('appsettings', [
      candidate('offline', 'appsettings'),
      candidate('users', 'appsettings', 'http://127.0.0.1:4105'),
    ]),
  } satisfies Readonly<Record<EndpointSource, SourceOutcome>>;

  const result = await createServiceEndpointDirectory(directoryOptions(outcomes, probe)).list();
  assertEquals(result.sources.map((source) => source.source), [
    'override',
    'aspire-cli',
    'run-manifest',
    'appsettings',
  ]);
  assertEquals(result.entries.map((entry) => [entry.name, entry.status, entry.source]), [
    ['auth', 'spec_unavailable', 'aspire-cli'],
    ['offline', 'not_running', 'appsettings'],
    ['reused', 'identity_mismatch', 'aspire-cli'],
    ['secret', 'excluded', 'override'],
    ['users', 'running', 'override'],
  ]);
  const users = result.entries.find((entry) => entry.name === 'users');
  assert(users?.status === 'running');
  assertEquals(users.baseUrl, 'http://operator.example.test/users');
  assertEquals(users.conflicts, [
    { source: 'aspire-cli', baseUrl: 'http://127.0.0.1:4103' },
    { source: 'run-manifest', baseUrl: 'http://127.0.0.1:4104' },
    { source: 'appsettings', baseUrl: 'http://127.0.0.1:4105' },
  ]);
  assertEquals(probed.sort(), ['auth', 'reused', 'users']);
});

Deno.test('directory isolates source rejection and probe rejection as explicit failed data', async () => {
  const adapters = sourceAdapters({
    override: used('override', [candidate('healthy', 'override', 'http://example.test')]),
    'aspire-cli': absent('aspire-cli'),
    'run-manifest': absent('run-manifest'),
    appsettings: absent('appsettings'),
  });
  const rejectingAdapters = {
    ...adapters,
    'aspire-cli': { read: () => Promise.reject(new Error('fixture source exploded')) },
  };
  const directory = createServiceEndpointDirectory({
    projectRoot: '/project',
    sourceAdapters: rejectingAdapters,
    probe: { probe: () => Promise.reject(new Error('fixture probe exploded')) },
  });
  const result = await directory.list();
  const aspire = result.sources[1];
  assert(aspire?.outcome === 'failed');
  assertEquals(aspire.code, 'source_failed');
  assertStringIncludes(aspire.reason, 'fixture source exploded');
  const row = result.entries[0];
  assert(row?.status === 'spec_unavailable');
  assertStringIncludes(row.reason, 'fixture probe exploded');
});

Deno.test('one hanging row times out while healthy rows return under the concurrency cap', async () => {
  let active = 0;
  let maximumActive = 0;
  const probe: ServiceEndpointProbePort = {
    probe: async (entry, signal): Promise<ServiceEndpointProbeResult> => {
      active++;
      maximumActive = Math.max(maximumActive, active);
      try {
        if (entry.name === 'hang') {
          await new Promise<void>((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason), { once: true });
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 5));
        return { outcome: 'running', spec: { service: entry.name } };
      } finally {
        active--;
      }
    },
  };
  const names = ['alpha', 'beta', 'hang', 'omega'];
  const outcomes = {
    override: used(
      'override',
      names.map((name, index) => candidate(name, 'override', `http://127.0.0.1:${4200 + index}`)),
    ),
    'aspire-cli': absent('aspire-cli'),
    'run-manifest': absent('run-manifest'),
    appsettings: absent('appsettings'),
  } satisfies Readonly<Record<EndpointSource, SourceOutcome>>;
  const result = await createServiceEndpointDirectory(
    directoryOptions(outcomes, probe, { timeoutMs: 20, concurrency: 2 }),
  ).list();
  assertEquals(result.entries.map((entry) => [entry.name, entry.status]), [
    ['alpha', 'running'],
    ['beta', 'running'],
    ['hang', 'spec_unavailable'],
    ['omega', 'running'],
  ]);
  const hanging = result.entries[2];
  assert(hanging?.status === 'spec_unavailable');
  assertStringIncludes(hanging.reason, 'timed out after 20ms');
  assert(maximumActive <= 2);
  assertEquals(active, 0);
});

Deno.test('fetch probe requests spec before identity without redirects or credentials', async () => {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  const fetchFixture: typeof fetch = (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith('/api/openapi.json')) {
      return Promise.resolve(Response.json({ openapi: '3.1.0', paths: {} }));
    }
    return Promise.resolve(Response.json({ service: 'users', version: '1.0.0' }));
  };
  const result = await new FetchServiceEndpointProbe({ fetch: fetchFixture }).probe(
    candidate('users', 'aspire-cli', 'http://127.0.0.1:43127'),
    new AbortController().signal,
  );
  assertEquals(result, { outcome: 'running', spec: { openapi: '3.1.0', paths: {} } });
  assertEquals(calls.map((call) => call.url), [
    'http://127.0.0.1:43127/api/openapi.json',
    'http://127.0.0.1:43127/',
  ]);
  for (const call of calls) {
    assertEquals(call.init?.redirect, 'error');
    assertEquals(call.init?.credentials, 'omit');
    assertEquals(new Headers(call.init?.headers).has('authorization'), false);
  }
});

Deno.test('fetch probe maps spec failures and uses exact P3 guidance for 401 and 403', async () => {
  for (const status of [401, 403]) {
    const probe = new FetchServiceEndpointProbe({
      fetch: () => Promise.resolve(new Response('denied', { status })),
    });
    const result = await probe.probe(
      candidate('auth', 'aspire-cli', 'http://127.0.0.1:43127'),
      new AbortController().signal,
    );
    assertEquals(result, {
      outcome: 'spec_unavailable',
      reason: `OpenAPI document returned HTTP ${status}.`,
      httpStatus: status,
      guidance: SPEC_UNAVAILABLE_AUTH_GUIDANCE,
    });
  }

  const malformed = new FetchServiceEndpointProbe({
    fetch: () => Promise.resolve(new Response('{ broken', { status: 200 })),
  });
  const malformedResult = await malformed.probe(
    candidate('users', 'aspire-cli', 'http://127.0.0.1:43127'),
    new AbortController().signal,
  );
  assertEquals(malformedResult.outcome, 'spec_unavailable');

  const unreachable = new FetchServiceEndpointProbe({
    fetch: () => Promise.reject(new TypeError('tcp connect error: Connection refused')),
  });
  const unreachableResult = await unreachable.probe(
    candidate('users', 'aspire-cli', 'http://127.0.0.1:43127'),
    new AbortController().signal,
  );
  assertEquals(unreachableResult.outcome, 'not_running');
});

Deno.test('fetch probe maps reused-port identity and response bounds without projecting the spec', async () => {
  const responses = [
    Response.json({ openapi: '3.1.0', opaqueFutureField: { kept: true } }),
    Response.json({ service: 'foreign' }),
  ];
  const mismatch = new FetchServiceEndpointProbe({
    fetch: () => Promise.resolve(responses.shift()!),
  });
  const mismatchResult = await mismatch.probe(
    candidate('users', 'aspire-cli', 'http://127.0.0.1:43127'),
    new AbortController().signal,
  );
  assertEquals(mismatchResult.outcome, 'identity_mismatch');
  if (mismatchResult.outcome === 'identity_mismatch') {
    assertStringIncludes(mismatchResult.reason, 'foreign');
  }

  const oversized = new FetchServiceEndpointProbe({
    responseByteLimit: 8,
    fetch: () => Promise.resolve(new Response('{"openapi":"3.1.0"}')),
  });
  const oversizedResult = await oversized.probe(
    candidate('users', 'aspire-cli', 'http://127.0.0.1:43127'),
    new AbortController().signal,
  );
  assertEquals(oversizedResult.outcome, 'spec_unavailable');
  if (oversizedResult.outcome === 'spec_unavailable') {
    assertStringIncludes(oversizedResult.reason, '8-byte limit');
  }
});
