/**
 * @module kernel/adapters/secrets/env-file-secrets-store
 *
 * Bare-metal reference binding of {@link SecretsStorePort} (R-DEPLOY-3, D7):
 * persists a target's secrets to a restricted-permission `.env` file — `0o600`
 * on POSIX, owner+SYSTEM-only ACL via `icacls` on Windows (NEEDS-USER U2). The
 * render + reconcile policy lives in the core secrets convention; this edge
 * adapter owns only the file I/O and permission enforcement (F-CLI-16).
 */

import type { ProcessPort } from '../../ports/process-port.ts';
import type {
  RenderedSecretsEnvFile,
  SecretsBundle,
  SecretsStorePort,
} from '../../domain/deploy/secrets-convention.ts';

/** Narrow filesystem seam the store needs, injected for deterministic tests. */
export interface SecretsFsPort {
  /** Write (overwrite) the secret file's text content. */
  writeTextFile(path: string, content: string): Promise<void>;
  /** Read the secret file, or `undefined` when it does not exist. */
  readTextFile(path: string): Promise<string | undefined>;
  /** Apply a POSIX file mode. */
  chmod(path: string, mode: number): Promise<void>;
  /** Remove the secret file; a missing file is not an error. */
  remove(path: string): Promise<void>;
}

/** Deno-backed {@link SecretsFsPort} for production wiring. */
export const denoSecretsFs: SecretsFsPort = {
  writeTextFile: (path, content) => Deno.writeTextFile(path, content),
  async readTextFile(path) {
    try {
      return await Deno.readTextFile(path);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return undefined;
      throw error;
    }
  },
  chmod: (path, mode) => Deno.chmod(path, mode),
  async remove(path) {
    try {
      await Deno.remove(path);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  },
};

/**
 * `icacls` argv that restricts a file to owner + SYSTEM only: disable
 * inheritance (`/inheritance:r`) then grant full control to just the owner and
 * `SYSTEM` — the 0600-equivalent on Windows (NEEDS-USER U2).
 */
export function restrictAclArgs(filePath: string, owner: string): string[] {
  return [filePath, '/inheritance:r', '/grant:r', `${owner}:F`, '/grant:r', 'SYSTEM:F'];
}

/** Parse the `KEY` names from an env-file body (ignores blanks + `#` comments). */
function parseEnvKeys(content: string): string[] {
  const keys: string[] = [];
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    keys.push(line.slice(0, eq));
  }
  return keys;
}

/** Construction options for {@link EnvFileSecretsStore}. */
export interface EnvFileSecretsStoreOptions {
  /** Absolute path of the restricted secret env file. */
  readonly envFilePath: string;
  /** Filesystem seam. Defaults to {@link denoSecretsFs}. */
  readonly fs?: SecretsFsPort;
  /** Permission model. Defaults to the host platform. */
  readonly platform?: 'posix' | 'windows';
  /** Process port used for the Windows `icacls` ACL step (required on Windows). */
  readonly process?: ProcessPort;
  /** Path to the `icacls` CLI. Defaults to `icacls`. */
  readonly icaclsPath?: string;
  /** Windows ACL grantee (the file owner principal). */
  readonly owner?: string;
}

/**
 * Env-file {@link SecretsStorePort}. Writes the rendered material then enforces
 * restricted permissions: `chmod 0o600` on POSIX, an owner+SYSTEM-only ACL on
 * Windows. `list` parses the persisted keys so the core reconcile can compute
 * pruned entries; `clear` removes the file (teardown).
 */
export class EnvFileSecretsStore implements SecretsStorePort {
  private readonly envFilePath: string;
  private readonly fs: SecretsFsPort;
  private readonly platform: 'posix' | 'windows';
  private readonly process?: ProcessPort;
  private readonly icaclsPath: string;
  private readonly owner: string;

  constructor(options: EnvFileSecretsStoreOptions) {
    this.envFilePath = options.envFilePath;
    this.fs = options.fs ?? denoSecretsFs;
    this.platform = options.platform ?? (Deno.build.os === 'windows' ? 'windows' : 'posix');
    this.process = options.process;
    this.icaclsPath = options.icaclsPath ?? 'icacls';
    this.owner = options.owner ?? Deno.env.get('USERNAME') ?? 'Administrators';
  }

  async put(rendered: RenderedSecretsEnvFile, _bundle: SecretsBundle): Promise<void> {
    await this.fs.writeTextFile(this.envFilePath, rendered.content);

    if (this.platform === 'windows') {
      if (!this.process) {
        throw new Error(
          'EnvFileSecretsStore: Windows secret restriction requires a ProcessPort (icacls)',
        );
      }
      await this.process.exec(this.icaclsPath, restrictAclArgs(this.envFilePath, this.owner));
      return;
    }

    await this.fs.chmod(this.envFilePath, rendered.mode);
  }

  async list(): Promise<readonly string[]> {
    const content = await this.fs.readTextFile(this.envFilePath);
    return content === undefined ? [] : parseEnvKeys(content);
  }

  async clear(): Promise<void> {
    await this.fs.remove(this.envFilePath);
  }
}
