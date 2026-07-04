/**
 * @module public/adapters/service-activation-port
 *
 * Bare-metal reference bindings of the core {@link ActivationPort}
 * (R-DEPLOY-3, D7): make a staged release the active one by repointing a
 * `current` link at `releases/<id>` and restarting the managed OS service, then
 * persist release history. Retention math and previous-good selection stay in
 * the core rollback convention; these adapters own only the atomic swap, the
 * service restart, and history persistence.
 *
 * Lives under `public/adapters/**` (not `kernel/**`) because it depends on the
 * {@link OsServicePort} public seam — the same layering precedent as
 * `systemd-os-service.ts`.
 *
 * Two strategies, one base:
 * - {@link SymlinkActivationPort} (Linux): symlink written to a temp name then
 *   `rename`d over `current` — an atomic replace.
 * - {@link DirSwapActivationPort} (Windows): the old junction is removed then a
 *   fresh directory junction is created (no atomic rename over a live junction),
 *   which is why the symlink strategy is preferred where available.
 */

import type { OsServicePort } from '../ports/os-service-port.ts';
import type {
  ActivationPort,
  ReleaseHistory,
  ReleaseId,
  ReleaseRecord,
} from '../../kernel/domain/deploy/rollback-convention.ts';

/** Narrow filesystem seam the activation adapters need, injected for tests. */
export interface ActivationFsPort {
  /** Create a symlink/junction at `path` pointing at `target`. */
  symlink(target: string, path: string, type?: 'file' | 'dir'): Promise<void>;
  /** Rename `from` to `to`, replacing `to` atomically where the OS allows it. */
  rename(from: string, to: string): Promise<void>;
  /** Read the target of a symlink/junction, or `undefined` when it is absent. */
  readLink(path: string): Promise<string | undefined>;
  /** Remove a path; a missing path is not an error. */
  remove(path: string, options?: { recursive?: boolean }): Promise<void>;
  /** Read a text file, or `undefined` when it does not exist. */
  readTextFile(path: string): Promise<string | undefined>;
  /** Write (overwrite) a text file. */
  writeTextFile(path: string, content: string): Promise<void>;
}

/** Construction options shared by both activation strategies. */
export interface ServiceActivationOptions {
  /** Directory containing the per-release subdirectories (`releases/<id>`). */
  readonly releasesDir: string;
  /** The `current` link path repointed on activation. */
  readonly currentLink: string;
  /** JSON file the release history is persisted to. */
  readonly historyFile: string;
  /** Managed OS service restarted after a swap. */
  readonly serviceName: string;
  /** Injected OS service control seam (systemd / SERVY). */
  readonly service: OsServicePort;
  /** Injected filesystem seam. */
  readonly fs: ActivationFsPort;
  /** Path-join seam (default `/`-join) so release paths are deterministic in tests. */
  readonly join?: (...segments: string[]) => string;
  /** Clock seam for the symlink temp name (default `Date.now`). */
  readonly now?: () => number;
}

function defaultJoin(...segments: string[]): string {
  return segments.join('/');
}

function basename(path: string): string {
  const normalized = path.replace(/[\\/]+$/, '');
  const slash = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
  return slash === -1 ? normalized : normalized.slice(slash + 1);
}

/** Shared {@link ActivationPort} behaviour; the swap mechanism is per-strategy. */
abstract class BaseServiceActivationPort implements ActivationPort {
  protected readonly options: ServiceActivationOptions;

  protected constructor(options: ServiceActivationOptions) {
    this.options = options;
  }

  protected releasePath(id: ReleaseId): string {
    const join = this.options.join ?? defaultJoin;
    return join(this.options.releasesDir, id);
  }

  /** Repoint `current` at `releasePath`. Implemented per platform strategy. */
  protected abstract swap(releasePath: string): Promise<void>;

  protected async restart(): Promise<void> {
    await this.options.service.run('stop', this.options.serviceName);
    await this.options.service.run('start', this.options.serviceName);
  }

  activate(releaseId: ReleaseId): Promise<void> {
    return this.swapAndRestart(releaseId);
  }

  private async swapAndRestart(releaseId: ReleaseId): Promise<void> {
    await this.swap(this.releasePath(releaseId));
    await this.restart();
  }

  async current(): Promise<ReleaseId | undefined> {
    const link = await this.options.fs.readLink(this.options.currentLink);
    return link === undefined ? undefined : basename(link);
  }

  async history(): Promise<ReleaseHistory> {
    const raw = await this.options.fs.readTextFile(this.options.historyFile);
    if (raw === undefined || raw.trim() === '') return [];
    return JSON.parse(raw) as ReleaseHistory;
  }

  async record(release: ReleaseRecord): Promise<void> {
    const next = [...(await this.history()), release];
    await this.options.fs.writeTextFile(this.options.historyFile, JSON.stringify(next, null, 2));
  }

  async prune(ids: readonly ReleaseId[]): Promise<void> {
    for (const id of ids) {
      await this.options.fs.remove(this.releasePath(id), { recursive: true });
    }
  }
}

/** Linux {@link ActivationPort}: atomic symlink swap + `systemctl` restart. */
export class SymlinkActivationPort extends BaseServiceActivationPort {
  constructor(options: ServiceActivationOptions) {
    super(options);
  }

  protected async swap(releasePath: string): Promise<void> {
    const now = this.options.now ?? Date.now;
    const tmp = `${this.options.currentLink}.tmp-${now()}`;
    await this.options.fs.symlink(releasePath, tmp, 'dir');
    await this.options.fs.rename(tmp, this.options.currentLink);
  }
}

/** Windows {@link ActivationPort}: directory-junction swap + SERVY restart. */
export class DirSwapActivationPort extends BaseServiceActivationPort {
  constructor(options: ServiceActivationOptions) {
    super(options);
  }

  protected async swap(releasePath: string): Promise<void> {
    await this.options.fs.remove(this.options.currentLink);
    await this.options.fs.symlink(releasePath, this.options.currentLink, 'dir');
  }
}
