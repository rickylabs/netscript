import { z } from 'npm:zod@^4.6.5';
import type { LibraryInput } from '../src/contract.ts';
import { importLibrary } from '../src/native/import-library.ts';
import { exportLibrary } from '../src/native/export-library.ts';
import type { FigmaComponentsPort } from '../src/native/figma-port.ts';

/** Host-only composition surface; the browser iframe owns WebCrypto and downloads. */
export interface ComponentPluginHost extends FigmaComponentsPort {
  showUI(html: string, options: { width: number; height: number }): void;
  readonly ui: {
    onmessage: ((input: unknown) => void) | undefined;
    postMessage(message: unknown): void;
  };
}
const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('init') }).strict(),
  z.object({
    type: z.literal('digest-result'),
    request: z.number().int().positive(),
    hash: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict(),
  z.object({ type: z.literal('import'), bundle: z.unknown(), fileKey: z.string() }).strict(),
  z.object({ type: z.literal('export'), bundle: z.unknown(), fileKey: z.string() }).strict(),
]);

/** Wire serialized native operations and an iframe digest adapter without browser globals in the sandbox. */
export function startComponentLibraryPlugin(
  api: ComponentPluginHost,
  sources: LibraryInput,
  html: string,
): void {
  api.showUI(html, { width: 520, height: 640 });
  let active = false;
  let sequence = 0;
  const pending = new Map<number, (hash: string) => void>();
  const digest = (text: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const request = ++sequence;
      const timeout = setTimeout(() => {
        pending.delete(request);
        reject(new Error('Iframe digest timed out'));
      }, 30000);
      pending.set(request, (hash) => {
        clearTimeout(timeout);
        pending.delete(request);
        resolve(hash);
      });
      api.ui.postMessage({ type: 'digest-request', request, text });
    });
  api.ui.onmessage = (input) => {
    let action;
    try {
      action = actionSchema.parse(input);
    } catch {
      api.ui.postMessage({ type: 'error', message: 'Invalid component-library message' });
      return;
    }
    if (action.type === 'digest-result') {
      pending.get(action.request)?.(action.hash);
      return;
    }
    if (action.type === 'init') {
      api.ui.postMessage({ type: 'sources', sources, fileKey: api.fileKey ?? '' });
      return;
    }
    if (active) {
      api.ui.postMessage({ type: 'error', message: 'A library operation is already running' });
      return;
    }
    active = true;
    const context = {
      provenance: 'figma-editor' as const,
      fileKey: action.fileKey,
      digest,
      signal: {
        throwIfAborted: () => {
          if (!active) throw new Error('Library operation cancelled');
        },
      },
    };
    void (async () => {
      try {
        const result = action.type === 'import'
          ? {
            bundle: action.bundle,
            receipt: await importLibrary(api, action.bundle, sources, context),
          }
          : await exportLibrary(api, action.bundle, sources, context);
        api.ui.postMessage({ type: 'result', ...result });
      } catch (error) {
        api.ui.postMessage({
          type: 'error',
          message: error instanceof Error ? error.message : 'Library operation failed',
        });
      } finally {
        active = false;
      }
    })();
  };
}
