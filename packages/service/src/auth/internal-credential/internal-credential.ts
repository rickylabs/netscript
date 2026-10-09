/**
 * Per-service internal credentials derived from the installation secret.
 *
 * Each service accepts only the bearer derived for its own name, so a credential observed by one
 * service cannot be replayed against another.
 *
 * @module
 */

import { type InstallationSecret, installationSecretKey } from './installation-secret.ts';

/** Version-tagged prefix that marks an internal service credential in logs and secret scanners. */
const CREDENTIAL_PREFIX = 'nsi1_';
const DERIVATION_SALT = new TextEncoder().encode('netscript.internal-credential.v1');
const MAX_SERVICE_NAME_LENGTH = 128;

/**
 * Derives the internal bearer credential a service accepts.
 *
 * HKDF-SHA-256 over the installation secret, with the target service name as context. Callers
 * (workers, sagas, triggers) and the service derive the same value independently, so the
 * credential itself is never stored or transported by a carrier.
 *
 * @param secret - Installation secret handle.
 * @param service - Name of the service the credential is presented to.
 * @returns An opaque bearer credential.
 * @throws {TypeError} When the service name is blank, padded, or longer than 128 characters.
 *
 * @example
 * ```ts
 * import { createInstallationSecret, deriveInternalCredential } from '@netscript/service/auth';
 *
 * const secret = await createInstallationSecret(crypto.getRandomValues(new Uint8Array(32)));
 * const bearer = await deriveInternalCredential(secret, 'orders');
 * ```
 */
export async function deriveInternalCredential(
  secret: InstallationSecret,
  service: string,
): Promise<string> {
  assertServiceName(service);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: DERIVATION_SALT,
      info: new TextEncoder().encode(service),
    },
    installationSecretKey(secret),
    256,
  );
  return `${CREDENTIAL_PREFIX}${toBase64Url(new Uint8Array(bits))}`;
}

/** Rejects service names that cannot be a stable derivation context. */
export function assertServiceName(service: string): void {
  if (
    typeof service !== 'string' || service.length === 0 || service.trim() !== service ||
    service.length > MAX_SERVICE_NAME_LENGTH
  ) {
    throw new TypeError(
      `Internal credential service name must be a non-blank, unpadded string of at most ${MAX_SERVICE_NAME_LENGTH} characters.`,
    );
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
