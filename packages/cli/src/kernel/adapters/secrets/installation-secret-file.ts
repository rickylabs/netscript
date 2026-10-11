/** Project-scoped installation credential provisioning shared with the generated AppHost. */
import {
  closeSync,
  constants,
  fstatSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';

/** Only a file reference crosses the carrier boundary. */
export interface InstallationSecretFileOptions {
  /** Explicit existing file; absent files fail rather than silently changing identity. */
  readonly file?: string;
  /** Environment supplying an explicit reference; defaults to the current process. */
  readonly environment?: Readonly<Record<string, string | undefined>>;
}

/** Minimal upstream secret-parameter seam; the value must remain a direct parameter. */
export interface InstallationSecretParameterBuilder {
  /** Registers a direct secret parameter; Aspire returns an awaitable resource builder. */
  addParameter(
    name: string,
    options: { value: string; secret: boolean },
  ): PromiseLike<unknown>;
}

const FILE_ENV = 'NETSCRIPT_INSTALLATION_SECRET_FILE';
const MAX_BYTES = 4096;

/** Create once, or validate and reuse the installation's owner-only file. */
export function ensureInstallationSecretFile(
  installationRoot: string,
  options: InstallationSecretFileOptions = {},
): string {
  try {
    const explicit = options.file ??
      (options.environment ?? process.env)[FILE_ENV];
    if (explicit !== undefined) {
      if (!explicit) throw new Error();
      const file = resolve(explicit);
      readSecret(file);
      return file;
    }
    // Match ensureDatabasePassword: credentials travel with the git-ignored project data.
    const directory = resolve(installationRoot, '.data', 'aspire-secrets');
    mkdirSync(dirname(directory), { recursive: true, mode: 0o700 });
    const data = lstatSync(dirname(directory));
    if (!data.isDirectory() || data.isSymbolicLink()) throw new Error();
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    assertOwnerOnly(directory, true);
    const file = join(directory, 'installation.secret');
    try {
      lstatSync(file);
    } catch (error) {
      if (!isMissing(error)) throw error;
      // Publish a fully written file atomically. Concurrent launches never read a partial secret.
      const temporary = join(
        directory,
        `.${randomBytes(16).toString('hex')}.pending`,
      );
      try {
        writeFileSync(temporary, randomBytes(32).toString('hex'), {
          flag: 'wx',
          mode: 0o600,
        });
        try {
          linkSync(temporary, file);
        } catch (error) {
          if (!isExists(error)) throw error;
        }
      } finally {
        unlinkSync(temporary);
      }
    }
    readSecret(file);
    return file;
  } catch {
    // Filesystem and decoding errors can contain hostile path/content. Never expose the cause.
    throw new Error(
      'Installation credential provisioning failed. Ensure the secret directory is writable and owned by you (mode 0700), and the UTF-8 secret file is readable and owner-only (mode 0600), containing 32 to 4096 bytes; or set NETSCRIPT_INSTALLATION_SECRET_FILE to an existing file meeting these requirements.',
    );
  }
}

/** Register a direct Aspire secret parameter, returning only its file reference to resources. */
export async function registerInstallationSecret(
  builder: InstallationSecretParameterBuilder,
  installationRoot: string,
  options: InstallationSecretFileOptions = {},
): Promise<string> {
  const file = ensureInstallationSecretFile(installationRoot, options);
  try {
    await builder.addParameter('netscript-installation-secret', {
      value: readSecret(file),
      secret: true,
    });
    return file;
  } catch {
    throw new Error(
      'Installation credential secret parameter registration failed.',
    );
  }
}

/** Preserve declared read/env permissions while granting the carrier file and env reference. */
export function installationSecretPermissions(
  permissions: readonly string[],
  file?: string,
): string[] {
  if (
    !file || permissions.includes('-A') || permissions.includes('--allow-all')
  ) {
    return [...permissions];
  }
  // Scoped Deno permission flags are comma-separated; carrier paths must not contain commas.
  let result = [...permissions];
  for (
    const [flag, value] of [['--allow-read', file], ['--allow-env', FILE_ENV]]
  ) {
    if (result.includes(flag)) continue;
    const prefix = `${flag}=`;
    const scoped = result.filter((permission) => permission.startsWith(prefix));
    result = result.filter((permission) => !permission.startsWith(prefix));
    result.push(
      `${prefix}${
        [
          ...scoped.flatMap((permission) => permission.slice(prefix.length).split(',')),
          value,
        ].join(',')
      }`,
    );
  }
  return result;
}

function readSecret(file: string): string {
  assertOwnerOnly(dirname(file), true);
  assertOwnerOnly(file, false);
  const descriptor = openSync(
    file,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  );
  try {
    const metadata = fstatSync(descriptor);
    if (!metadata.isFile() || metadata.size > MAX_BYTES) throw new Error();
    const buffer = new Uint8Array(MAX_BYTES + 1);
    let length = 0;
    while (length < buffer.length) {
      const count = readSync(
        descriptor,
        buffer,
        length,
        buffer.length - length,
        null,
      );
      if (!count) break;
      length += count;
    }
    if (length > MAX_BYTES) throw new Error();
    const secret = new TextDecoder('utf-8', { fatal: true }).decode(
      buffer.subarray(0, length),
    ).trim();
    if (new TextEncoder().encode(secret).length < 32) throw new Error();
    return secret;
  } finally {
    closeSync(descriptor);
  }
}

function assertOwnerOnly(path: string, directory: boolean): void {
  const metadata = lstatSync(path);
  if (
    metadata.isSymbolicLink() ||
    (directory ? !metadata.isDirectory() : !metadata.isFile())
  ) {
    throw new Error();
  }
  if (
    process.platform !== 'win32' &&
    ((metadata.mode & 0o077) !== 0 || metadata.uid !== process.getuid?.() ||
      (metadata.mode & (directory ? 0o700 : 0o600)) !==
        (directory ? 0o700 : 0o600))
  ) throw new Error();
}

function isMissing(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function isExists(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'EEXIST';
}
