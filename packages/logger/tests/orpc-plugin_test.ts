import { assert, assertEquals, assertExists, assertStringIncludes } from '@std/assert';
import { configure, getLogger, type LogRecord, reset } from '@logtape/logtape';
import { os } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { LoggingPlugin, type LoggingPluginOptions } from '../orpc.ts';
import { createFieldRedactor } from '../redaction.ts';

const CATEGORY = ['netscript-test', 'orpc'];

interface HandlerPlugin {
  readonly name?: string;
  readonly order?: number;
  init?(options: unknown, router: unknown): unknown;
}

interface Harness {
  readonly records: LogRecord[];
  /** Resolves once the `hold` procedure for `id` is running. */
  entered(id: string): Promise<void>;
  /** Lets the `hold` procedure for `id` return. */
  release(id: string): void;
  call(input: Record<string, unknown>): Promise<Response>;
}

async function createHarness(options: LoggingPluginOptions = {}): Promise<Harness> {
  const records: LogRecord[] = [];
  await configure({
    reset: true,
    sinks: { memory: (record: LogRecord) => records.push(record) },
    loggers: [
      { category: CATEGORY, sinks: ['memory'], lowestLevel: 'debug' },
      { category: ['logtape', 'meta'], sinks: [], lowestLevel: 'warning' },
    ],
  });

  const gates = new Map<string, PromiseWithResolvers<void>>();
  const entered = new Map<string, PromiseWithResolvers<void>>();
  const gateFor = (map: Map<string, PromiseWithResolvers<void>>, id: string) => {
    let gate = map.get(id);
    if (!gate) {
      gate = Promise.withResolvers<void>();
      map.set(id, gate);
    }
    return gate;
  };

  const router = {
    hold: os.handler(async ({ input }) => {
      const id = String((input as { id?: unknown }).id);
      gateFor(entered, id).resolve();
      await gateFor(gates, id).promise;
      return { id };
    }),
    echo: os.handler(({ input }) => ({ received: input !== undefined })),
  };

  // Same structural seam `@netscript/service` uses (`ServiceHandlerPlugin`) to hand the plugin's
  // minimal handler contract to oRPC.
  const plugin: HandlerPlugin = new LoggingPlugin({
    debug: true,
    logger: getLogger(CATEGORY),
    ...options,
  });
  const handler = new RPCHandler(router, { plugins: [plugin] });

  const call = async (input: Record<string, unknown>): Promise<Response> => {
    const procedure = 'id' in input ? 'hold' : 'echo';
    const request = new Request(`http://localhost/rpc/${procedure}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: input }),
    });
    const { matched, response } = await handler.handle(request, { prefix: '/rpc', context: {} });
    assert(matched && response, 'request must match the router');
    return response;
  };

  return {
    records,
    call,
    entered: (id) => gateFor(entered, id).promise,
    release: (id) => gateFor(gates, id).resolve(),
  };
}

function recordsWith(records: readonly LogRecord[], message: string): LogRecord[] {
  return records.filter((record) => record.rawMessage === message);
}

function requestIdOf(record: LogRecord): string {
  return String(record.properties.requestId);
}

function procedureRecordFor(records: readonly LogRecord[], message: string, id: string): LogRecord {
  const record = recordsWith(records, message).find((candidate) =>
    String(candidate.properties.inputSummary ?? '').includes(`id="${id}"`) ||
    candidate.properties.resultSummary === `{id: ${id}}`
  );
  assertExists(record, `missing "${message}" record for ${id}`);
  return record;
}

Deno.test('LoggingPlugin attributes each concurrent request its own request ID', async () => {
  const harness = await createHarness();
  const ids = ['a', 'b', 'c', 'd'];

  try {
    // All requests enter the handler in the same tick, so every root interceptor runs before
    // any procedure interceptor reads the request ID.
    const pending = new Map(ids.map((id) => [id, harness.call({ id })]));
    await Promise.all(ids.map((id) => harness.entered(id)));

    // Release in reverse order, one at a time, so the request-level completion record logged
    // between a release and its response belongs to exactly that request.
    const requestCompletedIds = new Map<string, string>();
    for (const id of [...ids].reverse()) {
      const before = harness.records.length;
      harness.release(id);
      const response = await pending.get(id)!;
      assertEquals(response.status, 200);
      await response.body?.cancel();

      const completed = recordsWith(harness.records.slice(before), 'RPC request completed');
      assertEquals(completed.length, 1);
      requestCompletedIds.set(id, requestIdOf(completed[0]));
    }

    const rootIds = recordsWith(harness.records, 'RPC request started').map(requestIdOf);
    assertEquals(new Set(rootIds).size, ids.length, 'each request gets a distinct ID');

    for (const id of ids) {
      const started = procedureRecordFor(harness.records, 'RPC procedure started', id);
      const completed = procedureRecordFor(harness.records, 'RPC procedure completed', id);
      const requestId = requestCompletedIds.get(id);

      assertEquals(requestIdOf(started), requestId, `procedure start of ${id}`);
      assertEquals(requestIdOf(completed), requestId, `procedure completion of ${id}`);
    }
  } finally {
    await reset();
  }
});

Deno.test('LoggingPlugin measures each concurrent request from its own start', async () => {
  const harness = await createHarness();
  const holdMs = 40;

  try {
    // A is in flight before B starts; B starts and finishes while A is still running.
    const first = harness.call({ id: 'first' });
    await harness.entered('first');
    await new Promise((resolve) => setTimeout(resolve, holdMs));

    const second = harness.call({ id: 'second' });
    await harness.entered('second');
    harness.release('second');
    await (await second).body?.cancel();

    const before = harness.records.length;
    harness.release('first');
    await (await first).body?.cancel();

    const [requestCompleted] = recordsWith(harness.records.slice(before), 'RPC request completed');
    assertExists(requestCompleted);
    const procedureCompleted = procedureRecordFor(
      harness.records,
      'RPC procedure completed',
      'first',
    );
    const requestDuration = Number(requestCompleted.properties.duration);
    const procedureDuration = Number(procedureCompleted.properties.duration);

    assert(
      requestDuration >= procedureDuration,
      `request duration ${requestDuration}ms must cover its procedure ${procedureDuration}ms`,
    );
    assert(requestDuration >= holdMs, `request duration ${requestDuration}ms < ${holdMs}ms`);
    assertEquals(requestIdOf(requestCompleted), requestIdOf(procedureCompleted));
  } finally {
    await reset();
  }
});

const SENSITIVE_INPUT = {
  handle: 'device-flow-handle',
  prompt: 'private prompt text',
  token: 'secret-token',
  brief: 'private brief',
  handler: 'visible-handler',
};

async function logDebugInput(options: LoggingPluginOptions): Promise<LogRecord> {
  const harness = await createHarness(options);
  try {
    const response = await harness.call({
      ...SENSITIVE_INPUT,
      body: { ...SENSITIVE_INPUT, note: 'visible-note' },
    });
    assertEquals(response.status, 200);
    await response.body?.cancel();
    const [record] = recordsWith(harness.records, 'RPC procedure started');
    assertExists(record);
    return record;
  } finally {
    await reset();
  }
}

Deno.test('LoggingPlugin redacts handle, prompt, and custom fields from debug input', async () => {
  const record = await logDebugInput({ redactFields: ['Brief'] });
  const input = record.properties.input as Record<string, unknown>;
  const body = input.body as Record<string, unknown>;

  for (const fields of [input, body]) {
    assertEquals(fields.handle, '[REDACTED]');
    assertEquals(fields.prompt, '[REDACTED]');
    assertEquals(fields.token, '[REDACTED]');
    assertEquals(fields.brief, '[REDACTED]');
    // Negative control: exact-name matching keeps `handler` visible.
    assertEquals(fields.handler, 'visible-handler');
  }
  assertEquals(body.note, 'visible-note');

  const summary = String(record.properties.inputSummary);
  assertStringIncludes(summary, 'handle=[REDACTED]');
  assertStringIncludes(summary, 'prompt=[REDACTED]');
  assertStringIncludes(summary, 'token=[REDACTED]');
  assertStringIncludes(summary, 'brief=[REDACTED]');
  assertStringIncludes(summary, 'handler="visible-handler"');
  for (const secret of ['device-flow-handle', 'private prompt text', 'private brief']) {
    assert(!summary.includes(secret), `inputSummary leaked ${secret}`);
    assert(!JSON.stringify(input).includes(secret), `input leaked ${secret}`);
  }
});

Deno.test('LoggingPlugin leaves custom fields visible unless redactFields names them', async () => {
  const record = await logDebugInput({});
  const input = record.properties.input as Record<string, unknown>;

  assertEquals(input.brief, 'private brief');
  assertEquals(input.handle, '[REDACTED]');
  assertStringIncludes(String(record.properties.inputSummary), 'brief="private brief"');
});

Deno.test('createFieldRedactor matches defaults exactly and custom fragments by substring', () => {
  const defaults = createFieldRedactor();
  assert(defaults.isSensitiveKey('Handle'));
  assert(defaults.isSensitiveKey('PROMPT'));
  assert(defaults.isSensitiveKey('accessToken'));
  assert(!defaults.isSensitiveKey('handler'));
  assert(!defaults.isSensitiveKey('systemPrompt'));

  const widened = createFieldRedactor(['prompt', '  ']);
  assert(widened.isSensitiveKey('systemPrompt'));
  assert(!widened.isSensitiveKey('handler'));

  assertEquals(widened.redact([{ systemPrompt: 'x', id: 1 }, 'plain']), [
    { systemPrompt: '[REDACTED]', id: 1 },
    'plain',
  ]);
});

Deno.test('LoggingPlugin exposes stable name, return-based init, and errorStatusMap classification', async () => {
  const records: LogRecord[] = [];
  await configure({
    reset: true,
    sinks: { memory: (record: LogRecord) => records.push(record) },
    loggers: [
      { category: CATEGORY, sinks: ['memory'], lowestLevel: 'debug' },
      { category: ['logtape', 'meta'], sinks: [], lowestLevel: 'warning' },
    ],
  });

  try {
    const plugin = new LoggingPlugin({
      serviceName: 'orders',
      logger: getLogger(CATEGORY),
      errorStatusMap: { ORDER_LOCKED: 409, ORDER_BAD_MAP: 700 },
    });
    assertEquals(plugin.name, 'netscript-logging');

    const manualOptions = {};
    assertEquals(plugin.init(manualOptions), manualOptions);

    const router = {
      locked: os.handler(() => {
        throw Object.assign(new Error('Order locked'), { code: 'ORDER_LOCKED' });
      }),
      lockedZeroStatus: os.handler(() => {
        throw Object.assign(new Error('Order locked'), { code: 'ORDER_LOCKED', status: 0 });
      }),
      invalidMapped: os.handler(() => {
        throw Object.assign(new Error('Order bad map'), { code: 'ORDER_BAD_MAP' });
      }),
      lengthRequired: os.handler(() => {
        throw Object.assign(new Error('Length required'), { code: 'LENGTH_REQUIRED' });
      }),
      preconditionRequired: os.handler(() => {
        throw Object.assign(new Error('Precondition required'), { code: 'PRECONDITION_REQUIRED' });
      }),
      tooMany: os.handler(() => {
        throw Object.assign(new Error('Too many requests'), { code: 'TOO_MANY_REQUESTS' });
      }),
      unknown: os.handler(() => {
        throw Object.assign(new Error('Backend down'), { code: 'CUSTOM_INFRA_FAILURE' });
      }),
    };

    const handler = new RPCHandler(router, { plugins: [plugin as HandlerPlugin] });
    for (
      const procedure of [
        'locked',
        'lockedZeroStatus',
        'invalidMapped',
        'lengthRequired',
        'preconditionRequired',
        'tooMany',
        'unknown',
      ]
    ) {
      const result = await handler.handle(
        new Request(`http://localhost/rpc/${procedure}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ json: {} }),
        }),
        { prefix: '/rpc', context: {} },
      );
      assert(result.matched && result.response);
      await result.response.body?.cancel();
    }

    const failures = recordsWith(records, 'RPC procedure failed');
    assertEquals(failures.length, 7);
    assertEquals(failures[0]?.level, 'warning');
    assertEquals(failures[0]?.properties.status, 409);
    assertEquals(failures[1]?.level, 'warning');
    assertEquals(failures[1]?.properties.status, 409);
    assertEquals(failures[2]?.level, 'error');
    assertEquals(failures[2]?.properties.status, 500);
    assertEquals(failures[3]?.level, 'warning');
    assertEquals(failures[3]?.properties.status, 411);
    assertEquals(failures[4]?.level, 'warning');
    assertEquals(failures[4]?.properties.status, 428);
    assertEquals(failures[5]?.level, 'warning');
    assertEquals(failures[5]?.properties.status, 429);
    assertEquals(failures[6]?.level, 'error');
    assertEquals(failures[6]?.properties.status, 500);
  } finally {
    await reset();
  }
});

Deno.test('LoggingPlugin preserves incoming context.requestId or x-request-id header and exposes it to handlers', async () => {
  const records: LogRecord[] = [];
  await configure({
    reset: true,
    sinks: { memory: (record: LogRecord) => records.push(record) },
    loggers: [
      { category: CATEGORY, sinks: ['memory'], lowestLevel: 'debug' },
      { category: ['logtape', 'meta'], sinks: [], lowestLevel: 'warning' },
    ],
  });

  try {
    const observedRequestIds: Array<string | undefined> = [];
    const router = {
      ping: os.$context<{ requestId?: string }>().handler(({ context }) => {
        observedRequestIds.push(context.requestId);
        return { requestId: context.requestId ?? null };
      }),
    };
    const plugin: HandlerPlugin = new LoggingPlugin({
      serviceName: 'orders',
      debug: true,
      logger: getLogger(CATEGORY),
    }) as HandlerPlugin;
    const handler = new RPCHandler(router, { plugins: [plugin] });

    const invoke = async (context: Record<string, unknown>) => {
      const request = new Request('http://localhost/rpc/ping', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: {} }),
      });
      const { matched, response } = await handler.handle(request, { prefix: '/rpc', context });
      assert(matched && response);
      return await response.json() as { json: { requestId: string | null } };
    };

    // 1. Direct context.requestId is preserved across root logs, procedure logs, and handler context.
    const directBody = await invoke({ requestId: '  req-direct-1  ' });
    assertEquals(directBody.json.requestId, 'req-direct-1');

    // 2. Fallback to headers['X-Request-ID'] (case-insensitive) when requestId is blank/absent.
    const headerBody = await invoke({
      requestId: '   ',
      headers: { 'X-Request-ID': 'req-header-2' },
    });
    assertEquals(headerBody.json.requestId, 'req-header-2');

    // 3. Headers instance is also supported.
    const headersInstanceBody = await invoke({
      headers: new Headers({ 'x-request-id': 'req-headers-3' }),
    });
    assertEquals(headersInstanceBody.json.requestId, 'req-headers-3');

    // 4. Absent requestId mints one shared across root log, procedure log, and handler context.
    const beforeMinted = records.length;
    const mintedBody = await invoke({});
    assert(
      typeof mintedBody.json.requestId === 'string' && mintedBody.json.requestId.length > 0,
      'minted requestId must be non-empty',
    );
    const mintedRecords = records.slice(beforeMinted);
    for (const msg of ['RPC request started', 'RPC procedure started', 'RPC request completed']) {
      const found = recordsWith(mintedRecords, msg);
      assertEquals(found.length, 1, `expected one "${msg}" record`);
      assertEquals(requestIdOf(found[0]), mintedBody.json.requestId);
    }

    assertEquals(observedRequestIds.slice(0, 3), [
      'req-direct-1',
      'req-header-2',
      'req-headers-3',
    ]);
    const allRootIds = recordsWith(records, 'RPC request started').map(requestIdOf);
    const allProcIds = recordsWith(records, 'RPC procedure started').map(requestIdOf);
    assertEquals(allRootIds, [
      'req-direct-1',
      'req-header-2',
      'req-headers-3',
      mintedBody.json.requestId,
    ]);
    assertEquals(allProcIds, allRootIds);

    // 5. Incompatible caller-owned requestId (for example numeric 42) is never overwritten,
    //    while logs still correlate via private correlation symbol or incoming header.
    const observedNumeric: unknown[] = [];
    const numericRouter = {
      ping: os.$context<{ requestId: number; headers?: Record<string, string> }>().handler(
        ({ context }) => {
          observedNumeric.push(context.requestId);
          return { requestId: context.requestId };
        },
      ),
    };
    const numericHandler = new RPCHandler(numericRouter, { plugins: [plugin] });
    const beforeNumeric = records.length;
    const numericRes = await numericHandler.handle(
      new Request('http://localhost/rpc/ping', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: {} }),
      }),
      {
        prefix: '/rpc',
        context: {
          requestId: 42,
          headers: { 'x-request-id': 'corr-numeric-42' },
        },
      },
    );
    assert(numericRes.matched && numericRes.response);
    const numericBody = await numericRes.response.json() as { json: { requestId: number } };
    assertEquals(numericBody.json.requestId, 42);
    assertEquals(observedNumeric, [42]);
    const numericLogs = records.slice(beforeNumeric);
    assertEquals(
      recordsWith(numericLogs, 'RPC request started').map(requestIdOf),
      ['corr-numeric-42'],
    );
    assertEquals(
      recordsWith(numericLogs, 'RPC procedure started').map(requestIdOf),
      ['corr-numeric-42'],
    );
  } finally {
    await reset();
  }
});
