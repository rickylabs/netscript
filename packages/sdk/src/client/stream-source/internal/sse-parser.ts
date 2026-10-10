/** One complete SSE block. An absent data field means no message is dispatched. */
export interface SseBlock {
  readonly type: string;
  readonly data?: string;
  readonly lastEventId: string;
}

/** Bounded WHATWG framing, independent of transport and NetScript payload validation. */
export class SseParser {
  private line = '';
  private data: string[] = [];
  private dataSize = 0;
  private event = '';
  private id: string;
  private skipLf = false;

  constructor(
    private readonly limit: number,
    initialId: string,
    private readonly onBlock: (block: SseBlock) => void,
    private readonly onRetry: (delay: number) => void,
  ) {
    this.id = initialId;
  }

  feed(chunk: string): void {
    let start = 0;
    for (let index = 0; index < chunk.length; index++) {
      const character = chunk[index];
      if (this.skipLf) {
        this.skipLf = false;
        if (character === '\n') {
          start = index + 1;
          continue;
        }
      }
      if (character !== '\r' && character !== '\n') continue;
      this.append(chunk.slice(start, index));
      this.consumeLine();
      this.skipLf = character === '\r';
      start = index + 1;
    }
    this.append(chunk.slice(start));
  }

  private append(fragment: string): void {
    if (
      this.line.length + fragment.length + this.dataSize + this.event.length + this.id.length >
        this.limit
    ) {
      throw new RangeError('SSE framing buffer limit exceeded');
    }
    this.line += fragment;
  }

  private consumeLine(): void {
    const line = this.line;
    this.line = '';
    if (line === '') {
      const block: SseBlock = {
        type: this.event || 'message',
        data: this.data.length ? this.data.join('\n') : undefined,
        lastEventId: this.id,
      };
      this.data = [];
      this.dataSize = 0;
      this.event = '';
      this.onBlock(block);
      return;
    }
    if (line.startsWith(':')) return;
    const colon = line.indexOf(':');
    const field = colon < 0 ? line : line.slice(0, colon);
    let value = colon < 0 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    switch (field) {
      case 'data':
        this.data.push(value);
        this.dataSize += value.length + 1;
        if (this.dataSize + this.event.length + this.id.length > this.limit) {
          throw new RangeError('SSE framing buffer limit exceeded');
        }
        break;
      case 'event':
        this.event = value;
        break;
      case 'id':
        if (!value.includes('\0')) this.id = value;
        break;
      case 'retry':
        if (/^\d+$/.test(value)) this.onRetry(Number(value));
        break;
    }
  }
}
