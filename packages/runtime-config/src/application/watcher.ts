import type { RuntimeConfig } from '../domain/types.ts';
import { loadRuntimeConfig, resolveRuntimeConfigDir } from './loader.ts';

const DEFAULT_DEBOUNCE_MS = 300;

/**
 * Watch runtime config files and invoke `onChange` after debounced reloads.
 */
export function watchRuntimeConfig(
  onChange: (config: RuntimeConfig) => Promise<void>,
  options: { signal?: AbortSignal; prefix?: string } = {},
): void {
  const { signal } = options;
  const dir = resolveRuntimeConfigDir();

  (async () => {
    try {
      await Deno.stat(dir);
    } catch {
      return;
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      const watcher = Deno.watchFs(dir, { recursive: true });

      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            if (debounceTimer !== null) {
              clearTimeout(debounceTimer);
              debounceTimer = null;
            }
            watcher.close();
          },
          { once: true },
        );
      }

      for await (const event of watcher) {
        if (!isRuntimeConfigChange(event, dir)) continue;

        if (debounceTimer !== null) {
          clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(async () => {
          debounceTimer = null;
          try {
            const config = await loadRuntimeConfig();
            await onChange(config);
          } catch {
            // Watch reloads and callbacks are owned by the consumer; presentation code decides how to report.
          }
        }, DEFAULT_DEBOUNCE_MS);
      }
    } catch {
      if (signal?.aborted) return;
    }
  })();
}

function isRuntimeConfigChange(event: Deno.FsEvent, dir: string): boolean {
  if (
    event.kind !== 'modify' &&
    event.kind !== 'create' &&
    event.kind !== 'remove'
  ) {
    return false;
  }

  return event.paths.some(
    (path) => path.endsWith('.json') || path.startsWith(dir),
  );
}
