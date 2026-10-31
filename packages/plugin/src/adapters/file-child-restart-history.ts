import { dirname, resolve } from '@std/path';
import { z } from 'zod';
import type { ChildRestartHistory } from '../domain/child-health.ts';
import type { ChildRestartHistoryPort } from '../ports/child-restart-history-port.ts';

const HISTORY_VERSION = 1;
const MAX_HISTORY_BYTES = 1_048_576;
const HistoryRecord = z.object({
  version: z.literal(HISTORY_VERSION),
  active: z.boolean(),
  failed: z.boolean(),
  processId: z.number().int().nonnegative().safe(),
  restartCount: z.number().int().nonnegative().safe(),
  restarts: z.array(z.number().nonnegative().finite()),
  crashLooping: z.boolean(),
}).strict();

/**
 * Atomically stores one resource's restart accounting on its persistent local filesystem.
 *
 * Missing files mean first boot; corrupt, oversized or inaccessible files throw. The owning
 * service needs read/write access to the parent directory. Use a distinct path per replica.
 *
 * @example
 * ```ts
 * import { ChildHealthMonitor, FileChildRestartHistory } from '@netscript/plugin/health';
 * const health = new ChildHealthMonitor();
 * health.trackProcess(new FileChildRestartHistory('.data/child-health/custom.json'), Deno.pid);
 * ```
 */
export class FileChildRestartHistory implements ChildRestartHistoryPort {
  readonly #path: string;

  /** Resolve the history path once, relative to the service's working directory. */
  constructor(path: string) {
    this.#path = resolve(path);
  }

  /** Load a bounded, versioned record without treating corruption as a fresh start. */
  read(): ChildRestartHistory | undefined {
    let file: Deno.FsFile;
    try {
      file = Deno.openSync(this.#path, { read: true });
    } catch (cause) {
      if (cause instanceof Deno.errors.NotFound) return undefined;
      throw cause;
    }
    using owned = file;
    const size = owned.statSync().size;
    if (size > MAX_HISTORY_BYTES) throw new Error('Background child restart history is too large.');
    const bytes = new Uint8Array(size);
    let offset = 0;
    while (offset < bytes.length) {
      const count = owned.readSync(bytes.subarray(offset));
      if (count === null) break;
      offset += count;
    }
    return HistoryRecord.parse(JSON.parse(new TextDecoder().decode(bytes.subarray(0, offset))));
  }

  /** Flush a private replacement before atomically publishing it to the next process. */
  write(history: ChildRestartHistory): void {
    const bytes = new TextEncoder().encode(
      JSON.stringify({ ...history, version: HISTORY_VERSION }),
    );
    if (bytes.length > MAX_HISTORY_BYTES) {
      throw new Error('Background child restart history is too large.');
    }
    Deno.mkdirSync(dirname(this.#path), { recursive: true, mode: 0o700 });
    const temporary = `${this.#path}.tmp`;
    {
      using file = Deno.openSync(temporary, {
        write: true,
        create: true,
        truncate: true,
        mode: 0o600,
      });
      // OpenOptions.mode only applies to newly created files, not interrupted replacements.
      if (Deno.build.os !== 'windows') Deno.chmodSync(temporary, 0o600);
      let offset = 0;
      while (offset < bytes.length) offset += file.writeSync(bytes.subarray(offset));
      file.syncSync();
    }
    // The replacement handle is closed before rename, including on Windows.
    Deno.renameSync(temporary, this.#path);
  }
}
