/** Bounded framing I/O for the native durable-streams append log. @module */

import type { StreamMessage } from '@durable-streams/server';

/** Maximum bytes requested from the filesystem in one operation. */
export const SEGMENT_IO_BYTES: number = 64 * 1024;
/** Fixed upper bound on recent segment caches, independent of retained history. */
export const MAX_CACHED_SEGMENTS: number = 32;
/** Fixed upper bound on verified frame boundaries retained per segment. */
export const MAX_SEGMENT_CHECKPOINTS: number = 128;
const HEADER_BYTES = 4;
const TRAILER_BYTES = 1;

/** An opened segment with an immutable size snapshot and positioned reads. */
export interface SegmentFile {
  /** Byte length at open, so a concurrent append cannot extend this read. */
  readonly size: number;
  /** File identity prevents reuse of checkpoints after path replacement. */
  readonly identity: string;
  /** Modification stamp detects in-place rewrites of an unchanged size. */
  readonly modified: number;
  /** Reads up to buffer.length bytes at position; zero means EOF. */
  readAt(buffer: Uint8Array, position: number): number;
  /** Releases this operation's file descriptor. */
  close(): void;
}

/** Storage edge used by the framing reader and fault/short-read fixtures. */
export interface SegmentFiles {
  /** Opens an existing segment or throws; the caller always closes it. */
  open(path: string): SegmentFile;
}

interface Checkpoints {
  size: number;
  identity: string;
  modified: number;
  positions: number[];
}

/** Formats the upstream physical/logical frame-inclusive byte offset. */
export function frameOffset(bytes: number): string {
  return `0000000000000000_${String(bytes).padStart(16, '0')}`;
}

// A reusable window makes small-frame scans efficient without retaining payload history.
class FrameCursor {
  private readonly buffer = new Uint8Array(SEGMENT_IO_BYTES);
  private readonly view = new DataView(this.buffer.buffer);
  private windowStart = -1;
  private windowLength = 0;

  constructor(private readonly file: SegmentFile) {}

  header(position: number): number | undefined {
    if (position + HEADER_BYTES > this.file.size) return undefined;
    if (
      position < this.windowStart || position + HEADER_BYTES > this.windowStart + this.windowLength
    ) {
      this.windowStart = position;
      this.windowLength = Math.min(SEGMENT_IO_BYTES, this.file.size - position);
      this.readExactly(this.buffer.subarray(0, this.windowLength), position);
    }
    return this.view.getUint32(position - this.windowStart, false);
  }

  payload(position: number, length: number): Uint8Array {
    const data = new Uint8Array(length);
    for (let copied = 0; copied < length; copied += SEGMENT_IO_BYTES) {
      this.readExactly(
        data.subarray(copied, Math.min(length, copied + SEGMENT_IO_BYTES)),
        position + copied,
      );
    }
    return data;
  }

  private readExactly(buffer: Uint8Array, position: number): void {
    let read = 0;
    while (read < buffer.length) {
      const count = this.file.readAt(buffer.subarray(read), position + read);
      if (count <= 0 || count > buffer.length - read) {
        throw new Error('Durable stream segment changed or ended during a positioned read');
      }
      read += count;
    }
  }
}

/** Reads native frames with fixed I/O/cache overhead plus the requested response payloads. */
export class BoundedSegmentLog {
  private readonly checkpoints = new Map<string, Checkpoints>();

  /** Takes the native filesystem edge or a positioned-read test fixture. */
  constructor(private readonly files: SegmentFiles) {}

  /** Finds the last complete frame without allocating the retained log. */
  scan(path: string): string {
    const file = this.files.open(path);
    try {
      const checkpoints = this.recent(path, file);
      const cursor = new FrameCursor(file);
      let position = 0;
      while (position < file.size) {
        const length = cursor.header(position);
        if (length === undefined) break;
        const end = position + HEADER_BYTES + length + TRAILER_BYTES;
        if (end > file.size) break;
        position = end;
        this.remember(checkpoints, position);
      }
      this.remember(checkpoints, position, true);
      return frameOffset(position);
    } finally {
      file.close();
    }
  }

  /** Reads complete messages after a logical offset, respecting a fork's base and cap. */
  read(path: string, startByte: number, baseByteOffset: number, capByte?: number): StreamMessage[] {
    const file = this.files.open(path);
    try {
      const physicalStart = Math.max(0, startByte - baseByteOffset);
      const physicalCap = Math.min(
        file.size,
        capByte === undefined ? file.size : capByte - baseByteOffset,
      );
      if (physicalStart >= physicalCap) return [];
      const checkpoints = this.recent(path, file);
      // Arbitrary offsets may fall inside frames; seek only to verified boundaries.
      let position = 0;
      for (const checkpoint of checkpoints.positions) {
        if (checkpoint > physicalStart) break;
        position = checkpoint;
      }
      const cursor = new FrameCursor(file);
      const messages: StreamMessage[] = [];
      while (position < physicalCap) {
        const length = cursor.header(position);
        if (length === undefined) break;
        const end = position + HEADER_BYTES + length + TRAILER_BYTES;
        if (end > physicalCap) break;
        this.remember(checkpoints, end);
        if (end > physicalStart) {
          messages.push({
            data: cursor.payload(position + HEADER_BYTES, length),
            offset: frameOffset(baseByteOffset + end),
            timestamp: 0,
          });
        }
        position = end;
      }
      this.remember(checkpoints, position, true);
      return messages;
    } finally {
      file.close();
    }
  }

  private recent(path: string, file: SegmentFile): Checkpoints {
    let entry = this.checkpoints.get(path);
    if (
      !entry || entry.identity !== file.identity || file.size < entry.size ||
      (file.size === entry.size && file.modified !== entry.modified)
    ) {
      entry = { size: file.size, identity: file.identity, modified: file.modified, positions: [] };
    }
    entry.size = file.size;
    entry.modified = file.modified;
    this.checkpoints.delete(path);
    this.checkpoints.set(path, entry);
    if (this.checkpoints.size > MAX_CACHED_SEGMENTS) {
      const oldest = this.checkpoints.keys().next().value;
      if (oldest !== undefined) this.checkpoints.delete(oldest);
    }
    return entry;
  }

  private remember(entry: Checkpoints, position: number, force = false): void {
    const last = entry.positions.at(-1) ?? 0;
    if (position <= last || (!force && position - last < SEGMENT_IO_BYTES)) return;
    entry.positions.push(position);
    if (entry.positions.length > MAX_SEGMENT_CHECKPOINTS) entry.positions.shift();
  }
}
