import { assertEquals } from '@std/assert';
import { isValidStreamOffset, STREAM_OFFSET_MAX_BYTES } from '@netscript/contracts/streams';
import { createNetScriptStreamProxy, type StreamProxyCloseEvent } from '../../proxy.ts';
import {
  createControlledUpstream,
  flushMicrotasks,
  makeStateChange,
  readAllText,
  sseControlBlock,
  sseDataBlock,
} from './_test_helpers.ts';

const BEARER = { authorization: 'Bearer tok-parser' };

function createParserProxy(
  fetchImpl: typeof fetch,
  maxPendingBatchBytes = 2048,
  onClose?: (e: StreamProxyCloseEvent) => void,
) {
  return createNetScriptStreamProxy({
    baseUrl: 'http://streams.internal',
    fetch: fetchImpl,
    recheckEveryMs: null,
    maxPendingBatchBytes,
    upstreamAuth: () => ({}),
    authorize: () => ({ allow: true, grant: { id: 'p' } }),
    recheck: () => ({ allow: true }),
    resolvePath: () => '/projects/parser/events',
    onClose,
  });
}

Deno.test('Gate 4 split frames: 1-byte chunks with multi-byte UTF-8 and CRLF/CR delimiters emit exact wire bytes', async () => {
  const closed: StreamProxyCloseEvent[] = [];
  const upstream = createControlledUpstream();
  const proxy = createParserProxy(upstream.fetch, 4096, (e) => closed.push(e));

  const res = await proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
  assertEquals(res.status, 200);

  const wireCrlf = sseDataBlock(makeStateChange('utf8', { text: '€uro 🚀 日本語' }), '\r\n') +
    sseControlBlock({ streamNextOffset: '0000000000000000_0000000000000170' }, '\r\n');
  const wireCr = sseDataBlock(makeStateChange('cr', { ok: true }), '\r') +
    sseControlBlock({ streamNextOffset: 'o2' }, '\r');
  const combined = new TextEncoder().encode(wireCrlf + ':keepalive comment\r\n\r\n' + wireCr);

  const readPromise = readAllText(res.body);
  for (let i = 0; i < combined.byteLength; i += 1) {
    upstream.readers[0]!.push(combined.subarray(i, i + 1));
  }
  upstream.readers[0]!.close();

  const received = await readPromise;
  // Comment-only block is stripped; data+control blocks are emitted byte-identically
  assertEquals(received, wireCrlf + wireCr);
  assertEquals(closed[0]!.reason, 'completed');
  assertEquals(closed[0]!.deliveredUnits, 2);
});

Deno.test('Gate 4 bounded parser limits: oversize partial data, control, and unterminated comment fail closed while multi-block chunk succeeds', async () => {
  const cases: readonly { readonly name: string; readonly payload: string }[] = [
    { name: 'oversize partial data', payload: `event: data\ndata: ${'x'.repeat(1200)}` },
    {
      name: 'oversize control',
      payload: sseDataBlock(makeStateChange('k', { v: 1 })) +
        `event: control\ndata: {"streamNextOffset":"${'a'.repeat(1200)}"}\n\n`,
    },
    { name: 'oversize unterminated comment', payload: `:${'c'.repeat(1200)}` },
  ];

  for (const tc of cases) {
    const closed: StreamProxyCloseEvent[] = [];
    const upstream = createControlledUpstream();
    const proxy = createParserProxy(upstream.fetch, 1024, (e) => closed.push(e));
    const res = await proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
    const textP = readAllText(res.body);
    upstream.readers[0]!.push(tc.payload);
    const text = await textP;
    assertEquals(text, '', `${tc.name}: expected zero emitted bytes`);
    assertEquals(
      closed[0]!.reason,
      'frame-limit-exceeded',
      `${tc.name}: expected frame-limit-exceeded`,
    );
    await flushMicrotasks();
    assertEquals(upstream.activeCount, 0);
  }

  // A single chunk carrying many small valid units exceeding 1024 bytes total must NOT false-trip!
  const closedOk: StreamProxyCloseEvent[] = [];
  const upstreamOk = createControlledUpstream();
  const proxyOk = createParserProxy(upstreamOk.fetch, 1024, (e) => closedOk.push(e));
  const resOk = await proxyOk(new Request('https://app.example.test/stream', { headers: BEARER }));
  let bigChunk = '';
  for (let i = 0; i < 15; i += 1) {
    bigChunk += sseDataBlock(makeStateChange(`u${i}`, { i })) +
      sseControlBlock({ streamNextOffset: `off_${i}` });
  }
  const textOkP = readAllText(resOk.body);
  upstreamOk.readers[0]!.push(bigChunk);
  upstreamOk.readers[0]!.close();
  assertEquals(await textOkP, bigChunk);
  assertEquals(closedOk[0]!.reason, 'completed');
  assertEquals(closedOk[0]!.deliveredUnits, 15);
});

Deno.test('Gate 4 malformed/unresumable control offsets, unsupported frames, invalid UTF-8, and premature EOF emit zero uncommitted bytes', async () => {
  const badOffsets = [
    '',
    'a'.repeat(STREAM_OFFSET_MAX_BYTES + 1),
    'bad\roffset',
    'bad\noffset',
    'bad\0offset',
    'bad\x1foffset',
    'bad\x7foffset',
    'bad offset',
    'bad\toffset',
    'bad?offset',
    'bad#offset',
    'bad&offset',
    'non-ascii-\u00e9',
  ];

  const proxyForQuery = createParserProxy(() =>
    Promise.resolve(new Response(null, { status: 200 }))
  );
  for (const bad of badOffsets) {
    assertEquals(isValidStreamOffset(bad), false);
    const reqUrl = `https://app.example.test/stream?offset=${encodeURIComponent(bad)}`;
    const qRes = await proxyForQuery(new Request(reqUrl, { headers: BEARER }));
    assertEquals(qRes.status, 400, `query ?offset=${JSON.stringify(bad)} must return 400`);

    const closed: StreamProxyCloseEvent[] = [];
    const upstream = createControlledUpstream();
    const proxy = createParserProxy(upstream.fetch, 4096, (e) => closed.push(e));
    const res = await proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
    const bodyP = readAllText(res.body);
    upstream.readers[0]!.push(
      sseDataBlock(makeStateChange('withheld', { v: 1 })) +
        sseControlBlock({ streamNextOffset: bad }),
    );
    assertEquals(await bodyP, '', `control offset ${JSON.stringify(bad)} must emit zero bytes`);
    assertEquals(closed[0]!.reason, 'upstream-error');
    await flushMicrotasks();
    assertEquals(upstream.activeCount, 0);
  }

  const badPayloads: readonly { readonly name: string; readonly bytes: Uint8Array }[] = [
    {
      name: 'invalid JSON control',
      bytes: new TextEncoder().encode(
        sseDataBlock(makeStateChange('k', {})) + 'event: control\ndata: {bad\n\n',
      ),
    },
    {
      name: 'missing streamNextOffset',
      bytes: new TextEncoder().encode(
        sseDataBlock(makeStateChange('k', {})) + 'event: control\ndata: {"upToDate":true}\n\n',
      ),
    },
    { name: 'omitted event name', bytes: new TextEncoder().encode('data: {"x":1}\n\n') },
    {
      name: 'unknown event name',
      bytes: new TextEncoder().encode('event: custom\ndata: {"x":1}\n\n'),
    },
    { name: 'event: data with no data line', bytes: new TextEncoder().encode('event: data\n\n') },
    {
      name: 'invalid UTF-8 bytes',
      bytes: new Uint8Array([0x64, 0x61, 0x74, 0x61, 0x3a, 0x20, 0xFF, 0xFE, 0x0A, 0x0A]),
    },
    {
      name: 'EOF after data without control',
      bytes: new TextEncoder().encode(sseDataBlock(makeStateChange('orphan', { v: 1 }))),
    },
    { name: 'EOF mid-frame', bytes: new TextEncoder().encode('event: data\ndata: {"partial":') },
  ];

  for (const tc of badPayloads) {
    const closed: StreamProxyCloseEvent[] = [];
    const upstream = createControlledUpstream();
    const proxy = createParserProxy(upstream.fetch, 4096, (e) => closed.push(e));
    const res = await proxy(new Request('https://app.example.test/stream', { headers: BEARER }));
    const bodyP = readAllText(res.body);
    upstream.readers[0]!.push(tc.bytes);
    upstream.readers[0]!.close();
    assertEquals(await bodyP, '', `${tc.name}: must emit zero bytes`);
    assertEquals(closed[0]!.reason, 'upstream-error', `${tc.name}: expected upstream-error`);
    await flushMicrotasks();
    assertEquals(upstream.activeCount, 0);
  }
});
