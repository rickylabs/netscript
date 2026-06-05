import { OutputRenderer } from './output-renderer.ts';
import type { OutputEvent } from '../output-event.ts';

/** Renderer that intentionally discards all output events. */
export class SilentOutputRenderer extends OutputRenderer {
  override readonly id = 'silent';

  override render(_event: OutputEvent): void {
    // Intentionally empty.
  }
}
