import type { OutputEvent } from '../output-event.ts';

/** Stub-only contract for output renderers. */
export abstract class OutputRenderer {
  /** Stable renderer identifier used by renderer registries. */
  abstract readonly id: string;

  /** Render one output event. */
  abstract render(event: OutputEvent): Promise<void> | void;
}
