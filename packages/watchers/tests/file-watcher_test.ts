import { assertEquals } from '@std/assert';
import { createWatcher, DebounceFilter, type WatchEvent } from '../mod.ts';

Deno.test('FileWatcher watch loop stops when the external signal aborts and leaves running === false', async () => {
  const tmpDir = await Deno.makeTempDir();
  const controller = new AbortController();
  const watcher = createWatcher({
    paths: [tmpDir],
    patterns: ['*.txt'],
    events: ['create'],
    forcePolling: true,
    pollIntervalMs: 1,
    contentHash: false,
    signal: controller.signal,
  });

  try {
    const iterator = watcher.watch()[Symbol.asyncIterator]();
    const next = iterator.next();

    await new Promise((resolve) => setTimeout(resolve, 20));
    assertEquals(watcher.running, true);

    controller.abort();
    watcher.stop();

    const result = await next;
    assertEquals(result.done, true);
    assertEquals(watcher.running, false);

    await iterator.return?.(undefined);
  } finally {
    watcher.stop();
    await Deno.remove(tmpDir, { recursive: true });
  }
});

Deno.test('FileWatcher honors processExisting: true on startup scan', async () => {
  const tmpDir = await Deno.makeTempDir();
  const file1 = `${tmpDir}/existing1.txt`;
  const file2 = `${tmpDir}/existing2.txt`;
  await Deno.writeTextFile(file1, 'hello');
  await Deno.writeTextFile(file2, 'world');

  const controller = new AbortController();
  const watcher = createWatcher({
    paths: [tmpDir],
    patterns: ['*.txt'],
    events: ['create'],
    processExisting: true,
    forcePolling: true,
    pollIntervalMs: 50,
    signal: controller.signal,
  });

  const received: WatchEvent[] = [];
  try {
    const iterator = watcher.watch()[Symbol.asyncIterator]();

    // Collect initial existing files
    const event1 = await iterator.next();
    if (!event1.done) received.push(event1.value);
    const event2 = await iterator.next();
    if (!event2.done) received.push(event2.value);

    assertEquals(received.length, 2);
    const paths = received.map((e) => e.path).sort();
    const expected = [file1, file2].sort();
    assertEquals(paths, expected);
    assertEquals(received.every((e) => e.kind === 'create'), true);

    controller.abort();
    watcher.stop();
    await iterator.return?.(undefined);
  } finally {
    watcher.stop();
    assertEquals(watcher.running, false);
    await Deno.remove(tmpDir, { recursive: true });
  }
});

Deno.test('FileWatcher honors maxFileAge filtering during startup scan', async () => {
  const tmpDir = await Deno.makeTempDir();
  const oldFile = `${tmpDir}/old.txt`;
  const newFile = `${tmpDir}/new.txt`;

  await Deno.writeTextFile(oldFile, 'old content');
  await Deno.writeTextFile(newFile, 'new content');

  // Set oldFile mtime to 60 seconds in the past
  const pastTime = new Date(Date.now() - 60_000);
  await Deno.utime(oldFile, pastTime, pastTime);

  const controller = new AbortController();
  const watcher = createWatcher({
    paths: [tmpDir],
    patterns: ['*.txt'],
    events: ['create'],
    processExisting: true,
    maxFileAge: 10_000, // 10 seconds max age
    forcePolling: true,
    pollIntervalMs: 50,
    signal: controller.signal,
  });

  const received: WatchEvent[] = [];
  try {
    const iterator = watcher.watch()[Symbol.asyncIterator]();

    const event1 = await iterator.next();
    if (!event1.done) received.push(event1.value);

    assertEquals(received.length, 1);
    assertEquals(received[0].path.endsWith('new.txt'), true);

    controller.abort();
    watcher.stop();
    await iterator.return?.(undefined);
  } finally {
    watcher.stop();
    assertEquals(watcher.running, false);
    await Deno.remove(tmpDir, { recursive: true });
  }
});

Deno.test('FileWatcher honors debounceMs by collapsing rapid successive events for the same path', async () => {
  const tmpDir = await Deno.makeTempDir();
  const testFile = `${tmpDir}/burst.txt`;
  await Deno.writeTextFile(testFile, 'initial');

  const controller = new AbortController();
  const watcher = createWatcher({
    paths: [tmpDir],
    patterns: ['*.txt'],
    events: ['modify'],
    debounceMs: 150,
    forcePolling: true,
    pollIntervalMs: 20,
    contentHash: false,
    signal: controller.signal,
  });

  const received: WatchEvent[] = [];
  try {
    const iterator = watcher.watch()[Symbol.asyncIterator]();
    // Start listening so initial snapshot completes
    const nextPromise = iterator.next();
    await new Promise((r) => setTimeout(r, 50));

    // Trigger rapid modifications
    await Deno.writeTextFile(testFile, 'mod1');
    await new Promise((r) => setTimeout(r, 10));
    await Deno.writeTextFile(testFile, 'mod2');
    await new Promise((r) => setTimeout(r, 10));
    await Deno.writeTextFile(testFile, 'mod3');

    // Await debounced event
    const event = await nextPromise;
    if (!event.done) received.push(event.value);

    assertEquals(received.length, 1);
    assertEquals(received[0].path.endsWith('burst.txt'), true);
    assertEquals(received[0].kind, 'modify');

    controller.abort();
    watcher.stop();
    await iterator.return?.(undefined);
  } finally {
    watcher.stop();
    assertEquals(watcher.running, false);
    await Deno.remove(tmpDir, { recursive: true });
  }
});

Deno.test('DebounceFilter suppresses rapid events for the same path', async () => {
  const controller = new AbortController();
  const filter = new DebounceFilter(100, controller.signal);

  async function* source(): AsyncIterable<WatchEvent> {
    yield {
      path: '/tmp/a.txt',
      kind: 'modify',
      contentHash: null,
      fileInfo: null,
      timestamp: new Date(),
    };
    await new Promise((r) => setTimeout(r, 20));
    yield {
      path: '/tmp/a.txt',
      kind: 'modify',
      contentHash: null,
      fileInfo: null,
      timestamp: new Date(),
    };
  }

  const results: WatchEvent[] = [];
  for await (const event of filter.apply(source())) {
    results.push(event);
  }

  assertEquals(results.length, 1);
  assertEquals(results[0].path, '/tmp/a.txt');
});
