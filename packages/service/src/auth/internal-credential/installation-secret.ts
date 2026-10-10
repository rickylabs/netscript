/**
 * Per-installation secret that internal service credentials are derived from.
 *
 * Carriers deliver a file reference (`NETSCRIPT_INSTALLATION_SECRET_FILE`), never the secret
 * value. The secret is imported as a non-extractable HKDF key; the returned handle carries no
 * secret material, so it is safe to log or serialize.
 *
 * @module
 */

/** Environment variable carrying the path of the installation secret file. */
export const INSTALLATION_SECRET_FILE_ENV = 'NETSCRIPT_INSTALLATION_SECRET_FILE';

/** Smallest accepted secret, in bytes after surrounding whitespace is trimmed. */
const MIN_SECRET_BYTES = 32;
/** Largest accepted secret file, in bytes; the read never allocates beyond this. */
const MAX_SECRET_FILE_BYTES = 4096;

const SECRET_KEYS = new WeakMap<InstallationSecret, CryptoKey>();

/** Opaque handle to an imported installation secret. Holds no secret material. */
export interface InstallationSecret {
  /** Handle discriminator; the key material is held privately by the service package. */
  readonly kind: 'netscript.installation-secret';
}

/** Options for {@link loadInstallationSecret}. */
export interface LoadInstallationSecretOptions {
  /** Secret file path. Defaults to the `NETSCRIPT_INSTALLATION_SECRET_FILE` environment variable. */
  readonly path?: string;
}

/**
 * Imports installation secret material held in memory.
 *
 * Binary material is used verbatim, byte for byte. Textual material has surrounding whitespace
 * trimmed, so a secret written with a trailing newline yields the same credential. Use
 * {@link loadInstallationSecret} for the carrier-delivered file reference.
 *
 * @param material - At least 32 bytes of high-entropy secret material (bytes, or UTF-8 text).
 * @returns An opaque handle used to derive internal service credentials.
 * @throws {TypeError} When the material (trimmed, for text) is shorter than 32 bytes.
 *
 * @example
 * ```ts
 * import { createInstallationSecret } from '@netscript/service/auth';
 *
 * const material = crypto.getRandomValues(new Uint8Array(32));
 * const secret = await createInstallationSecret(material);
 * ```
 */
export async function createInstallationSecret(
  material: string | Uint8Array,
): Promise<InstallationSecret> {
  const bytes = typeof material === 'string'
    ? new TextEncoder().encode(material.trim())
    : material.slice();
  if (bytes.byteLength < MIN_SECRET_BYTES) {
    throw new TypeError(
      `Installation secret must hold at least ${MIN_SECRET_BYTES} bytes of secret material.`,
    );
  }

  const key = await crypto.subtle.importKey('raw', bytes, 'HKDF', false, ['deriveBits']);
  const secret: InstallationSecret = Object.freeze({ kind: 'netscript.installation-secret' });
  SECRET_KEYS.set(secret, key);
  return secret;
}

/**
 * Loads the installation secret from the file the carrier references.
 *
 * The file holds a textual secret, such as 32 random bytes in base64 or hex; surrounding
 * whitespace is trimmed. Reads at most 4 KiB. Load once at startup and share the handle; deriving
 * credentials from it performs no further file I/O.
 *
 * @param options - Optional explicit file path.
 * @returns An opaque handle used to derive internal service credentials.
 * @throws {Error} When no path is configured, or the file is missing, oversized, not UTF-8 text,
 *   or too short.
 *
 * @example
 * ```ts
 * import { loadInstallationSecret } from '@netscript/service/auth';
 *
 * // Reads the file named by NETSCRIPT_INSTALLATION_SECRET_FILE.
 * const secret = await loadInstallationSecret();
 * ```
 */
export async function loadInstallationSecret(
  options: LoadInstallationSecretOptions = {},
): Promise<InstallationSecret> {
  const path = options.path ?? Deno.env.get(INSTALLATION_SECRET_FILE_ENV);
  if (!path) {
    throw new Error(
      `Installation secret file is not configured; set ${INSTALLATION_SECRET_FILE_ENV}.`,
    );
  }
  return await createInstallationSecret(decodeSecretText(await readBoundedFile(path)));
}

/** Returns the private HKDF key behind a handle created by this module. */
export function installationSecretKey(secret: InstallationSecret): CryptoKey {
  const key = SECRET_KEYS.get(secret);
  if (!key) {
    throw new TypeError('Installation secret was not created by @netscript/service/auth.');
  }
  return key;
}

async function readBoundedFile(path: string): Promise<Uint8Array> {
  using file = await Deno.open(path, { read: true });
  const { size } = await file.stat();
  if (size > MAX_SECRET_FILE_BYTES) {
    throw new Error(`Installation secret file exceeds ${MAX_SECRET_FILE_BYTES} bytes.`);
  }

  const buffer = new Uint8Array(MAX_SECRET_FILE_BYTES + 1);
  let length = 0;
  while (length < buffer.byteLength) {
    const read = await file.read(buffer.subarray(length));
    if (read === null) break;
    length += read;
  }
  if (length > MAX_SECRET_FILE_BYTES) {
    throw new Error(`Installation secret file exceeds ${MAX_SECRET_FILE_BYTES} bytes.`);
  }
  return buffer.slice(0, length);
}

function decodeSecretText(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new TypeError('Installation secret file must contain UTF-8 text, such as base64 or hex.');
  }
}
