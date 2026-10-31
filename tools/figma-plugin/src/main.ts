import { z } from 'npm:zod@^4.6.5';
import type { FigmaVariablesPort } from './figma-port.ts';
import { exportSnapshot } from './snapshot.ts';
import { importSnapshot } from './import-snapshot.ts';

declare const __html__: string;
declare const figma: {
  readonly variables: FigmaVariablesPort;
  readonly fileKey?: string;
  showUI(html: string, options: { width: number; height: number }): void;
  readonly ui: { onmessage: (input: unknown) => void; postMessage(message: unknown): void };
  notify(message: string, options?: { error: boolean }): void;
};

const message = z.discriminatedUnion('type', [
  z.object({ type: z.literal('export') }).strict(),
  z.object({ type: z.literal('import'), snapshot: z.unknown() }).strict(),
]);
figma.showUI(__html__, { width: 500, height: 680 });
let active = false;
figma.ui.onmessage = (input) => {
  if (active) return;
  active = true;
  void (async () => {
    try {
      const action = message.parse(input);
      if (action.type === 'import') {
        await importSnapshot(figma.variables, action.snapshot);
        figma.notify('Variables imported');
      }
      figma.ui.postMessage({
        type: 'snapshot',
        snapshot: await exportSnapshot(figma.variables),
        fileKey: figma.fileKey ?? '',
      });
    } catch (error) {
      figma.ui.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Variable operation failed',
      });
    } finally {
      active = false;
    }
  })();
};
