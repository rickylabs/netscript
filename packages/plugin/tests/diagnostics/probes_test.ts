import { assertEquals, assertThrows } from '@std/assert';

import {
  assertSuccessfulProbe,
  joinProbeUrl,
  normalizeProbePath,
  type ProbeHttpResult,
  resolveProbeUrl,
  summarizeResponse,
} from '../../mod.ts';

Deno.test('normalizeProbePath ensures a single leading slash', () => {
  const cases: ReadonlyArray<readonly [string, string]> = [
    ['health', '/health'],
    ['/health', '/health'],
    ['', '/'],
    ['/api/v1/sagas/publish', '/api/v1/sagas/publish'],
    ['api/v1/sagas/publish', '/api/v1/sagas/publish'],
  ];
  for (const [input, expected] of cases) {
    assertEquals(normalizeProbePath(input), expected, input);
  }
});

Deno.test('joinProbeUrl strips a trailing base slash and normalizes the path', () => {
  const cases: ReadonlyArray<readonly [string, string, string]> = [
    ['http://127.0.0.1:8092', '/health', 'http://127.0.0.1:8092/health'],
    ['http://127.0.0.1:8092/', 'health', 'http://127.0.0.1:8092/health'],
    ['http://127.0.0.1:8092/', '/health', 'http://127.0.0.1:8092/health'],
    [
      'http://localhost:8092',
      'api/v1/sagas/publish',
      'http://localhost:8092/api/v1/sagas/publish',
    ],
  ];
  for (const [base, path, expected] of cases) {
    assertEquals(joinProbeUrl(base, path), expected, `${base} + ${path}`);
  }
});

Deno.test('summarizeResponse captures status fields and a bounded body preview', async () => {
  const body = 'x'.repeat(600);
  const response = new Response(body, {
    status: 200,
    statusText: 'OK',
  });
  const result = await summarizeResponse(response);

  assertEquals(result.status, 200);
  assertEquals(result.statusText, 'OK');
  assertEquals(result.bodyPreview.length, 500);
  assertEquals(result.bodyPreview, 'x'.repeat(500));
  assertEquals(Object.isFrozen(result), true);
});

Deno.test('assertSuccessfulProbe passes for 2xx and throws otherwise', () => {
  const ok: ProbeHttpResult = {
    url: 'http://localhost/health',
    status: 204,
    statusText: 'No Content',
    bodyPreview: '',
  };
  assertSuccessfulProbe(ok, 'Probe');

  const failing: ProbeHttpResult = {
    url: 'http://localhost/health',
    status: 503,
    statusText: 'Service Unavailable',
    bodyPreview: 'down',
  };
  assertThrows(
    () => assertSuccessfulProbe(failing, 'Sagas health'),
    Error,
    'Sagas health probe failed with 503 Service Unavailable: down',
  );
});

function withEnv(vars: Readonly<Record<string, string>>, run: () => void): void {
  const names = Object.keys(vars).concat([
    'WORKERS_API_URL',
    'SAGAS_API_URL',
    'NETSCRIPT_SAGAS_URL',
    'DURABLE_STREAMS_URL',
    'STREAMS_URL',
  ]);
  const previous = new Map<string, string | undefined>();
  for (const name of names) {
    previous.set(name, Deno.env.get(name));
    Deno.env.delete(name);
  }
  for (const [name, value] of Object.entries(vars)) {
    Deno.env.set(name, value);
  }
  try {
    run();
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) {
        Deno.env.delete(name);
      } else {
        Deno.env.set(name, value);
      }
    }
  }
}

Deno.test('resolveProbeUrl reproduces workers behavior (single var, no trailing-slash strip)', () => {
  withEnv({}, () => {
    assertEquals(
      resolveProbeUrl(['WORKERS_API_URL'], 'http://localhost:8091', { stripTrailingSlash: false }),
      'http://localhost:8091',
    );
  });
  withEnv({ WORKERS_API_URL: 'http://workers:9000/' }, () => {
    assertEquals(
      resolveProbeUrl(['WORKERS_API_URL'], 'http://localhost:8091', { stripTrailingSlash: false }),
      'http://workers:9000/',
    );
  });
});

Deno.test('resolveProbeUrl reproduces sagas behavior (two vars, trailing-slash strip)', () => {
  withEnv({}, () => {
    assertEquals(
      resolveProbeUrl(['SAGAS_API_URL', 'NETSCRIPT_SAGAS_URL'], 'http://127.0.0.1:8092'),
      'http://127.0.0.1:8092',
    );
  });
  withEnv({ NETSCRIPT_SAGAS_URL: 'http://sagas:8092/' }, () => {
    assertEquals(
      resolveProbeUrl(['SAGAS_API_URL', 'NETSCRIPT_SAGAS_URL'], 'http://127.0.0.1:8092'),
      'http://sagas:8092',
    );
  });
  withEnv(
    { SAGAS_API_URL: 'http://primary:8092', NETSCRIPT_SAGAS_URL: 'http://fallback:8092' },
    () => {
      assertEquals(
        resolveProbeUrl(['SAGAS_API_URL', 'NETSCRIPT_SAGAS_URL'], 'http://127.0.0.1:8092'),
        'http://primary:8092',
      );
    },
  );
});

Deno.test('resolveProbeUrl reproduces streams behavior (two vars, trailing-slash strip)', () => {
  withEnv({}, () => {
    assertEquals(
      resolveProbeUrl(['DURABLE_STREAMS_URL', 'STREAMS_URL'], 'http://127.0.0.1:4437'),
      'http://127.0.0.1:4437',
    );
  });
  withEnv({ STREAMS_URL: 'http://streams:4437/' }, () => {
    assertEquals(
      resolveProbeUrl(['DURABLE_STREAMS_URL', 'STREAMS_URL'], 'http://127.0.0.1:4437'),
      'http://streams:4437',
    );
  });
});
