import { OutputRenderer } from './output-renderer.ts';
import type { OutputEvent, OutputStream } from '../output-event.ts';

type ConsoleSink = Pick<Console, 'error' | 'log' | 'warn'>;

/** Human-readable renderer backed by the host console. */
export class HumanOutputRenderer extends OutputRenderer {
  override readonly id = 'human';

  constructor(private readonly sink: ConsoleSink = console) {
    super();
  }

  override render(event: OutputEvent): void {
    switch (event.kind) {
      case 'text':
        this.write(event.text, event.stream);
        return;
      case 'list':
        for (const item of event.items) {
          this.write(item, event.stream);
        }
        return;
      case 'json':
        this.write(JSON.stringify(event.value, null, 2), event.stream);
        return;
      case 'error':
        this.sink.error(event.message);
        return;
    }
  }

  private write(message: string, stream: OutputStream = 'stdout'): void {
    if (stream === 'stderr') {
      this.sink.error(message);
      return;
    }
    this.sink.log(message);
  }
}
