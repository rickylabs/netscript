import type { OutputEvent, OutputStream } from './output-event.ts';
import { HumanOutputRenderer } from './renderers/human-output-renderer.ts';

const defaultRenderer = new HumanOutputRenderer();

/** Emit one output event through the process default renderer. */
export function emitOutput(event: OutputEvent): void {
  defaultRenderer.render(event);
}

/** Emit human-readable text. */
export function outputText(text = '', stream: OutputStream = 'stdout'): void {
  emitOutput({ kind: 'text', text, stream });
}

/** Emit warning text to stderr. */
export function outputWarning(message: string): void {
  outputText(message, 'stderr');
}

/** Emit an error event to stderr. */
export function outputError(message = '', code?: number): void {
  emitOutput({ kind: 'error', message, code });
}

/** Emit list output. */
export function outputList(items: readonly string[], stream: OutputStream = 'stdout'): void {
  emitOutput({ kind: 'list', items, stream });
}

/** Emit JSON output. */
export function outputJson(value: unknown, stream: OutputStream = 'stdout'): void {
  emitOutput({ kind: 'json', value, stream });
}
