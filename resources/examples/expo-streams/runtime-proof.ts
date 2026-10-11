// Run inside the native Expo app, never count execution on Deno as Hermes proof.
export async function proveHermesPrimitives(): Promise<readonly string[]> {
  if (!Reflect.get(globalThis, 'HermesInternal')) {
    throw new Error('Hermes required');
  }
  const abort = new AbortController();
  const reason = new Error('proof cancellation');
  abort.signal.throwIfAborted();
  abort.abort(reason);
  if (abort.signal.reason !== reason) {
    throw new Error('AbortSignal.reason failed');
  }
  let caught: unknown;
  try {
    abort.signal.throwIfAborted();
  } catch (error) {
    caught = error;
  }
  if (caught !== reason) throw new Error('throwIfAborted failed');
  const decoder = new TextDecoder();
  const first = decoder.decode(new Uint8Array([0xe2, 0x82]), { stream: true });
  const last = decoder.decode(new Uint8Array([0xac]), { stream: true });
  if (first !== '' || last !== '€' || decoder.decode() !== '') {
    throw new Error('Streaming UTF-8 failed');
  }
  const url = new URL('https://api.example.com/stream?offset=-1');
  url.searchParams.set('offset', 'opaque:2/A');
  url.searchParams.set('live', 'sse');
  if (
    new URL(url.toString()).searchParams.get('offset') !== 'opaque:2/A' ||
    url.searchParams.get('live') !== 'sse'
  ) throw new Error('URL.searchParams failed');
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([42]));
      controller.close();
    },
  });
  const reader = stream.getReader();
  const read = await reader.read();
  if (read.done || read.value[0] !== 42 || !(await reader.read()).done) {
    throw new Error('getReader failed');
  }
  reader.releaseLock();
  return [
    'Hermes',
    'AbortSignal.throwIfAborted',
    'AbortSignal.reason',
    'streaming TextDecoder',
    'URL.searchParams.set',
    'ReadableStream.getReader',
  ];
}
