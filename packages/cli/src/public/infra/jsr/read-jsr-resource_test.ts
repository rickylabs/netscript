import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { FakeTime } from 'jsr:@std/testing@1/time';
import { stub } from 'jsr:@std/testing@1/mock';
import { JsrRequestError, readJsrResource } from './read-jsr-resource.ts';
import { WebJsrPackageFileFetcher } from './verify-jsr-package-integrity.ts';
import { WebFetchJsrHttpClient } from './fetch-jsr-plugin-validator.ts';

const URL = 'https://jsr.io/@example/plugin/1.0.0/mod.ts';
const readers = [
  {
    name: 'package file',
    read: (fetcher: typeof fetch) => new WebJsrPackageFileFetcher(fetcher).fetchFile(URL),
  },
  {
    name: 'metadata',
    read: async (fetcher: typeof fetch) =>
      await (await new WebFetchJsrHttpClient(fetcher).fetch(URL)).json(),
  },
];

for (const reader of readers) {
  Deno.test(`JSR ${reader.name}: 502 then 200 succeeds and discards the failed body`, async () => {
    using time = new FakeTime();
    let calls = 0;
    let cancelled = false;
    const fetcher: typeof fetch = () => {
      calls++;
      return Promise.resolve(
        calls === 1
          ? new Response(
            new ReadableStream({
              cancel() {
                cancelled = true;
              },
            }),
            { status: 502 },
          )
          : Response.json({ ok: true }),
      );
    };
    const pending = reader.read(fetcher);
    await time.runMicrotasks();
    await time.nextAsync();
    await time.nextAsync();
    await pending;
    assertEquals(calls, 2);
    assert(cancelled);
  });

  Deno.test(`JSR ${reader.name}: persistent 502 reports URL, three attempts and status`, async () => {
    using time = new FakeTime();
    let calls = 0;
    const fetcher: typeof fetch = () => {
      calls++;
      return Promise.resolve(new Response('unavailable', { status: 502 }));
    };
    const failed = assertRejects(() => reader.read(fetcher), JsrRequestError);
    await time.runMicrotasks();
    await time.nextAsync();
    await time.nextAsync();
    const error = await failed;
    assertEquals(calls, 3);
    assertEquals(error.attempts, 3);
    assertEquals(error.status, 502);
    assertStringIncludes(error.message, URL);
    assertStringIncludes(error.message, '3 attempts');
    assertStringIncludes(error.message, 'HTTP 502');
  });

  for (
    const failure of [new TypeError('connection reset'), new Deno.errors.ConnectionReset('reset')]
  ) {
    Deno.test(`JSR ${reader.name}: retries ${failure.name} from fetch`, async () => {
      using time = new FakeTime();
      let calls = 0;
      const fetcher: typeof fetch = () => {
        calls++;
        return calls === 1 ? Promise.reject(failure) : Promise.resolve(Response.json({ ok: true }));
      };
      const pending = reader.read(fetcher);
      await time.runMicrotasks();
      await time.nextAsync();
      await time.nextAsync();
      await pending;
      assertEquals(calls, 2);
    });
  }

  Deno.test(`JSR ${reader.name}: retries a raw body disconnect`, async () => {
    using time = new FakeTime();
    let calls = 0;
    const fetcher: typeof fetch = () => {
      calls++;
      const response = calls === 1
        ? new Response(
          new ReadableStream({
            start(controller) {
              controller.error(new TypeError('body connection reset'));
            },
          }),
        )
        : Response.json({ ok: true });
      return Promise.resolve(response);
    };
    const pending = reader.read(fetcher);
    await time.runMicrotasks();
    await time.nextAsync();
    await time.nextAsync();
    await pending;
    assertEquals(calls, 2);
  });
}

Deno.test('JSR package file: every permanent 4xx other than 429 fails once', async () => {
  using time = new FakeTime(0);
  for (let status = 400; status <= 499; status++) {
    if (status === 429) continue;
    let calls = 0;
    const fetcher: typeof fetch = () => {
      calls++;
      return Promise.resolve(new Response(null, { status }));
    };
    const error = await assertRejects(
      () => new WebJsrPackageFileFetcher(fetcher).fetchFile(URL),
      JsrRequestError,
    );
    assertEquals(error.status, status);
    assertEquals(error.attempts, 1);
    assertEquals(calls, 1);
    assertEquals(time.now, 0);
  }
});

for (const header of ['2', 'Sat, 31 Oct 2026 12:00:02 GMT']) {
  Deno.test(`JSR Retry-After ${header}: never requests before the advertised minimum`, async () => {
    using time = new FakeTime('2026-10-31T12:00:00Z');
    const requested: number[] = [];
    const fetcher: typeof fetch = () => {
      requested.push(Date.now());
      return Promise.resolve(
        requested.length === 1
          ? new Response(null, { status: 429, headers: { 'Retry-After': header } })
          : new Response('ok'),
      );
    };
    const pending = readJsrResource(URL, {}, fetcher);
    await time.tickAsync(1_999);
    assertEquals(requested.length, 1);
    await time.tickAsync(1);
    assertEquals((await pending).ok, true);
    assertEquals(requested[1] - requested[0], 2_000);
  });
}

for (const header of ['86400', 'Sun, 01 Nov 2026 12:00:00 GMT']) {
  Deno.test(`JSR excessive Retry-After ${header}: fails without waiting or retrying early`, async () => {
    using time = new FakeTime('2026-10-31T12:00:00Z');
    const started = Date.now();
    let calls = 0;
    const fetcher: typeof fetch = () => {
      calls++;
      return Promise.resolve(
        new Response(null, {
          status: 429,
          headers: { 'Retry-After': header },
        }),
      );
    };
    const error = await assertRejects(() => readJsrResource(URL, {}, fetcher), JsrRequestError);
    assertEquals(calls, 1);
    assertEquals(time.now, started);
    assertStringIncludes(error.message, 'Retry-After 86400000ms exceeds 60000ms limit');
  });
}

Deno.test('JSR backoff uses jitter and only waits between the three attempts', async () => {
  using time = new FakeTime(0);
  using random = stub(Math, 'random', () => 0.5);
  const requested: number[] = [];
  const fetcher: typeof fetch = () => {
    requested.push(Date.now());
    return Promise.resolve(new Response(null, { status: 503 }));
  };
  const failed = assertRejects(() => readJsrResource(URL, {}, fetcher), JsrRequestError);
  await time.runMicrotasks();
  await time.nextAsync();
  await time.nextAsync();
  await failed;
  assertEquals(requested, [0, 125, 375]);
  assertEquals(Date.now(), 375, 'no wait after the final failed attempt');
  assertEquals(random.calls.length, 2);
});

Deno.test('JSR invalid Retry-After falls back to bounded jitter', async () => {
  using time = new FakeTime(0);
  using random = stub(Math, 'random', () => 0.5);
  let calls = 0;
  const fetcher: typeof fetch = () => {
    calls++;
    return Promise.resolve(
      calls === 1
        ? new Response(null, { status: 429, headers: { 'Retry-After': 'invalid' } })
        : new Response('ok'),
    );
  };
  const pending = readJsrResource(URL, {}, fetcher);
  await time.runMicrotasks();
  await time.nextAsync();
  await time.nextAsync();
  await pending;
  assertEquals(Date.now(), 125);
  assertEquals(random.calls.length, 1);
  assertEquals(calls, 2);
});

Deno.test('JSR metadata: malformed JSON and parsing TypeError are not retried', async () => {
  let calls = 0;
  const client = new WebFetchJsrHttpClient(() => {
    calls++;
    return Promise.resolve(new Response('{invalid JSON'));
  });
  await assertRejects(async () => (await client.fetch(URL)).json(), SyntaxError);
  assertEquals(calls, 1);

  const response = await new WebFetchJsrHttpClient(() => {
    calls++;
    return Promise.resolve(Response.json({ ok: true }));
  }).fetch(URL);
  using parse = stub(JSON, 'parse', () => {
    throw new TypeError('programming error');
  });
  await assertRejects(async () => await response.json(), TypeError, 'programming error');
  assertEquals(calls, 2);
  assertEquals(parse.calls.length, 1);
});

for (const cause of [new Error('programming error'), new DOMException('stop', 'AbortError')]) {
  Deno.test(`JSR ${cause.name}: non-transport failure does not retry`, async () => {
    let calls = 0;
    const fetcher: typeof fetch = () => {
      calls++;
      return Promise.reject(cause);
    };
    assertEquals(await assertRejects(() => readJsrResource(URL, {}, fetcher)), cause);
    assertEquals(calls, 1);
  });
}

Deno.test('JSR persistent transport failure retains cause and actual attempt count', async () => {
  using time = new FakeTime(0);
  const cause = new Deno.errors.ConnectionReset('peer reset');
  let calls = 0;
  const fetcher: typeof fetch = () => {
    calls++;
    return Promise.reject(cause);
  };
  const failed = assertRejects(() => readJsrResource(URL, {}, fetcher), JsrRequestError);
  await time.nextAsync();
  await time.nextAsync();
  const error = await failed;
  assertEquals(calls, 3);
  assertEquals(error.attempts, 3);
  assertEquals(error.status, undefined);
  assertEquals(error.cause, cause);
  assertStringIncludes(error.message, URL);
  assertStringIncludes(error.message, '3 attempts: transport failure');
});
