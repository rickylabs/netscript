import { OutputRenderer } from './output-renderer.ts';
import type { OutputEvent } from '../output-event.ts';

type ConsoleSink = Pick<Console, 'error' | 'log'>;

/** JSON-lines renderer for machine-readable CLI output. */
export class JsonOutputRenderer extends OutputRenderer {
  override readonly id = 'json';

  constructor(private readonly sink: ConsoleSink = console) {
    super();
  }

  override render(event: OutputEvent): void {
    const line = JSON.stringify(event);
    if (event.kind === 'error') {
      this.sink.error(line);
      return;
    }
    this.sink.log(line);
  }
}
