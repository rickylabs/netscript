import { assert, assertEquals, assertThrows } from '@std/assert';
import {
  BoundedSegmentLog,
  frameOffset,
  MAX_CACHED_SEGMENTS,
  MAX_SEGMENT_CHECKPOINTS,
  SEGMENT_IO_BYTES,
  type SegmentFile,
  type SegmentFiles,
} from '../bounded-segment-log.ts';

function frame(payload: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(payload.length + 5);
  new DataView(bytes.buffer).setUint32(0, payload.length, false);
  bytes.set(payload, 4);
  bytes[bytes.length - 1] = 10;
  return bytes;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const bytes = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let position = 0;
  for (const part of parts) {
    bytes.set(part, position);
    position += part.length;
  }
  return bytes;
}

class MemorySegments implements SegmentFiles {
  bytes: Uint8Array;
  readBytes = 0;
  maxRequest = 0;
  reads: number[] = [];
  closed = 0;
  modified = 1;
  identity = 'one';
  maxRead = SEGMENT_IO_BYTES;
  failAt: number | undefined;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  open(_path: string): SegmentFile {
    const snapshot = this.bytes;
    return {
      size: snapshot.length,
      identity: this.identity,
      modified: this.modified,
      readAt: (buffer, position) => {
        this.maxRequest = Math.max(this.maxRequest, buffer.length);
        this.reads.push(position);
        if (this.failAt !== undefined && position >= this.failAt) return 0;
        const count = Math.min(buffer.length, this.maxRead, snapshot.length - position);
        buffer.set(snapshot.subarray(position, position + count));
        this.readBytes += count;
        return count;
      },
      close: () => {
        this.closed++;
      },
    };
  }
}

Deno.test('bounded segment log: complete frames, zero payload, split headers and short reads', () => {
  const first = frame(new Uint8Array(SEGMENT_IO_BYTES - 7).fill(65));
  const empty = frame(new Uint8Array());
  const tail = frame(new TextEncoder().encode('tail'));
  const files = new MemorySegments(concat(first, empty, tail));
  files.maxRead = 37;
  const log = new BoundedSegmentLog(files);
  assertEquals(log.scan('log'), frameOffset(files.bytes.length));
  const messages = log.read('log', first.length, 0);
  assertEquals(messages.map((m) => m.offset), [
    frameOffset(first.length + empty.length),
    frameOffset(files.bytes.length),
  ]);
  assertEquals(messages.map((m) => m.data), [new Uint8Array(), new TextEncoder().encode('tail')]);
  const largePayload = Uint8Array.from(
    { length: SEGMENT_IO_BYTES * 3 + 19 },
    (_, i) => (i * 17 + 31) % 256,
  );
  const largeFrame = frame(largePayload);
  files.bytes = largeFrame;
  files.identity = 'multi-chunk';
  assertEquals(log.scan('log'), frameOffset(largeFrame.length));
  assertEquals(log.read('log', 0, 0).map((m) => m.data), [largePayload]);
  assertEquals(files.closed, 4);
  assert(files.maxRequest <= SEGMENT_IO_BYTES);
});

Deno.test('bounded segment log: partial header, payload and missing trailer never advance recovery', () => {
  const first = frame(new TextEncoder().encode('complete'));
  const second = frame(new TextEncoder().encode('partial'));
  for (const partialLength of [1, 2, 3, 4, 6, second.length - 1]) {
    const files = new MemorySegments(concat(first, second.subarray(0, partialLength)));
    const log = new BoundedSegmentLog(files);
    assertEquals(log.scan('log'), frameOffset(first.length));
    assertEquals(log.read('log', 0, 0).map((m) => m.offset), [frameOffset(first.length)]);
  }
  const files = new MemorySegments(new Uint8Array());
  const log = new BoundedSegmentLog(files);
  assertEquals(log.scan('empty'), frameOffset(0));
  assertEquals(log.read('empty', 0, 0), []);
  const corruptLength = new Uint8Array([255, 255, 255, 255, 10]);
  assertEquals(
    new BoundedSegmentLog(new MemorySegments(corruptLength)).scan('bad'),
    frameOffset(0),
  );
});

Deno.test('bounded segment log: arbitrary offsets, fork bases/caps and reads at/past end', () => {
  const a = frame(new TextEncoder().encode('aaa'));
  const b = frame(new TextEncoder().encode('bbbb'));
  const files = new MemorySegments(concat(a, b));
  const log = new BoundedSegmentLog(files);
  log.scan('log');
  const base = 100;
  assertEquals(log.read('log', base + 1, base).map((m) => m.offset), [
    frameOffset(base + a.length),
    frameOffset(base + a.length + b.length),
  ]);
  assertEquals(log.read('log', 0, base, base + a.length).map((m) => m.data), [
    new TextEncoder().encode('aaa'),
  ]);
  assertEquals(log.read('log', 0, base, base + a.length - 1), []);
  for (const offset of [base + files.bytes.length, base + files.bytes.length + 1]) {
    assertEquals(log.read('log', offset, base), []);
  }
});

Deno.test('bounded segment log: tail seeks from recent boundaries and skips retained payloads', () => {
  const one = frame(new Uint8Array(SEGMENT_IO_BYTES).fill(97));
  const count = MAX_SEGMENT_CHECKPOINTS + 16;
  const bytes = new Uint8Array(one.length * count);
  for (let i = 0; i < count; i++) bytes.set(one, i * one.length);
  const files = new MemorySegments(bytes);
  const log = new BoundedSegmentLog(files);
  log.scan('log');
  // The fixed capacity drops every earlier boundary. Observe the seek rather
  // than exposing cache internals: just below the oldest retained boundary
  // requires a cold scan, while that boundary itself remains directly usable.
  const oldestRetained = count - MAX_SEGMENT_CHECKPOINTS + 1;
  for (const index of [oldestRetained - 1, oldestRetained]) {
    files.reads = [];
    const offset = one.length * index;
    const slice = log.read('log', offset, 0, offset + one.length);
    assertEquals(slice.map((m) => m.offset), [frameOffset(offset + one.length)]);
    assertEquals(files.reads[0], index < oldestRetained ? 0 : offset);
  }
  files.readBytes = 0;
  files.reads = [];
  const start = one.length * (count - 1);
  const messages = log.read('log', start, 0);
  assertEquals(messages.length, 1);
  assertEquals(messages[0].data, one.subarray(4, one.length - 1));
  assertEquals(files.reads[0], start);
  assert(files.readBytes <= SEGMENT_IO_BYTES * 2);
  assert(files.maxRequest <= SEGMENT_IO_BYTES);
  // Evict an old segment, then verify fallback still returns the same suffix.
  for (let i = 0; i < MAX_CACHED_SEGMENTS; i++) log.scan(`other-${i}`);
  files.reads = [];
  assertEquals(log.read('log', start + 1, 0).map((m) => m.offset), [frameOffset(bytes.length)]);
  assertEquals(files.reads[0], 0);
});

Deno.test('bounded segment log: append, truncation and replacement invalidate stale boundaries', () => {
  const a = frame(new TextEncoder().encode('a'));
  const b = frame(new TextEncoder().encode('bb'));
  const files = new MemorySegments(a);
  const log = new BoundedSegmentLog(files);
  log.scan('log');
  files.bytes = concat(a, b);
  files.modified++;
  assertEquals(log.read('log', a.length, 0).map((m) => m.data), [new TextEncoder().encode('bb')]);
  files.bytes = b;
  files.modified++;
  assertEquals(log.read('log', 1, 0)[0].offset, frameOffset(b.length));
  files.bytes = frame(new TextEncoder().encode('cc'));
  files.identity = 'replacement';
  assertEquals(new TextDecoder().decode(log.read('log', 1, 0)[0].data), 'cc');
  files.bytes = frame(new TextEncoder().encode('dd'));
  files.modified++;
  assertEquals(new TextDecoder().decode(log.read('log', 1, 0)[0].data), 'dd');

  const oldFrame = frame(new Uint8Array(SEGMENT_IO_BYTES).fill(97));
  for (const change of ['same-size rewrite', 'replacement', 'shrink']) {
    const files = new MemorySegments(concat(oldFrame, oldFrame));
    const log = new BoundedSegmentLog(files);
    log.scan('log');
    // Reframe so the old mid-file boundary is now inside a payload, below
    // the requested offset. Keeping it would parse payload bytes as a header.
    const size = files.bytes.length - (change === 'shrink' ? 17 : 0);
    const payload = new Uint8Array(size - 5).fill(98);
    files.bytes = frame(payload);
    if (change === 'replacement') files.identity = 'new-incarnation';
    else files.modified++;
    files.reads = [];
    assertEquals(log.read('log', oldFrame.length + 11, 0).map((m) => m.data), [payload]);
    assertEquals(files.reads[0], 0);
  }
});

Deno.test('bounded segment log: read failure closes the descriptor and cannot fabricate a result', () => {
  const files = new MemorySegments(frame(new Uint8Array(SEGMENT_IO_BYTES * 2)));
  files.failAt = SEGMENT_IO_BYTES;
  const log = new BoundedSegmentLog(files);
  assertThrows(() => log.read('log', 0, 0), Error, 'changed or ended');
  assertEquals(files.closed, 1);
  assertThrows(
    () =>
      new BoundedSegmentLog({
        open() {
          throw new Error('denied');
        },
      }).scan('log'),
    Error,
    'denied',
  );
});
