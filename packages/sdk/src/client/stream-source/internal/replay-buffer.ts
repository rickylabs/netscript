import {
  parseStreamSseEventV1,
  type StreamSourceEventV1,
} from '@netscript/plugin-streams-core/sse';
import type { SseBlock } from './sse-parser.ts';

/** Persistent reconnect inputs; incomplete connection buffers never mutate these. */
export interface StreamReplayProgress {
  readonly url: URL;
  lastEventId: string;
}

/** Connection-local delivery transaction committed by the existing v1 control schema. */
export class StreamReplayBuffer {
  private pending: SseBlock[] = [];
  private pendingSize = 0;

  constructor(
    private readonly progress: StreamReplayProgress,
    private readonly limits: { bufferSize: number; pendingEvents: number },
    private readonly signal: AbortSignal,
    private readonly emit: (event: StreamSourceEventV1) => void,
    private readonly onControl: (terminal: boolean) => void,
  ) {}

  receive(block: SseBlock): void {
    if (this.signal.aborted) return;
    if (block.data === undefined) {
      if (this.pending.length === 0) this.progress.lastEventId = block.lastEventId;
      return;
    }
    if (block.type === 'data') {
      this.pendingSize += block.data.length + block.lastEventId.length;
      if (
        this.pending.length >= this.limits.pendingEvents ||
        this.pendingSize > this.limits.bufferSize
      ) {
        throw new RangeError('Uncommitted stream data limit exceeded');
      }
      this.pending.push(block);
      return;
    }
    if (block.type !== 'control') {
      this.emit(block);
      if (this.pending.length === 0) this.progress.lastEventId = block.lastEventId;
      return;
    }
    const parsed = parseStreamSseEventV1({ eventName: block.type, data: block.data });
    if (!parsed.ok || parsed.frame.event !== 'control') {
      throw new Error('Invalid stream control frame');
    }
    for (const data of this.pending) {
      if (this.signal.aborted) return;
      this.emit(data);
    }
    this.pending = [];
    this.pendingSize = 0;
    this.emit(block);
    if (this.signal.aborted) return;
    this.progress.url.searchParams.set('offset', parsed.frame.payload.streamNextOffset);
    this.progress.lastEventId = block.lastEventId;
    this.onControl(parsed.frame.payload.streamClosed === true);
  }
}
