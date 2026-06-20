import { KvOAuthError } from './errors.ts';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** AES-256-GCM key material accepted by the backend. */
export type KvOAuthKeyMaterial = ArrayBuffer | CryptoKey;

/** Token sealing operations owned by the KV OAuth backend. */
export type KvOAuthCrypto = Readonly<{
  keyId: string;
  seal(value: unknown): Promise<string>;
  open<TValue = unknown>(sealed: string): Promise<TValue>;
}>;

/** Reads a required runtime environment variable or throws a configuration error. */
export function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (value === undefined || value.trim() === '') {
    throw new KvOAuthError(
      'configuration_error',
      `Required environment variable ${name} is not set.`,
    );
  }
  return value;
}

/** Creates AES-256-GCM token-at-rest crypto. */
export async function createKvOAuthCrypto(
  keyMaterial?: KvOAuthKeyMaterial,
  keyId = 'k0',
): Promise<KvOAuthCrypto> {
  const key = await resolveKey(keyMaterial);
  return {
    keyId,
    async seal(value: unknown): Promise<string> {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const plaintext = encoder.encode(JSON.stringify(value));
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
      return `${keyId}.${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(ciphertext))}`;
    },
    async open<TValue = unknown>(sealed: string): Promise<TValue> {
      const [sealedKeyId, iv, ciphertext] = sealed.split('.');
      if (sealedKeyId !== keyId || !iv || !ciphertext) {
        throw new KvOAuthError(
          'configuration_error',
          `Unsupported sealed token key id ${sealedKeyId}.`,
        );
      }
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64UrlDecode(iv).buffer as ArrayBuffer },
        key,
        base64UrlDecode(ciphertext).buffer as ArrayBuffer,
      );
      return JSON.parse(decoder.decode(plaintext)) as TValue;
    },
  };
}

async function resolveKey(keyMaterial?: KvOAuthKeyMaterial): Promise<CryptoKey> {
  if (keyMaterial instanceof CryptoKey) {
    return keyMaterial;
  }

  const bytes = keyMaterial === undefined
    ? base64UrlDecode(getRequiredEnv('NETSCRIPT_AUTH_KV_OAUTH_KEY'))
    : new Uint8Array(keyMaterial);

  if (bytes.byteLength !== 32) {
    throw new KvOAuthError(
      'configuration_error',
      'NETSCRIPT_AUTH_KV_OAUTH_KEY must decode to exactly 32 bytes.',
    );
  }

  return await crypto.subtle.importKey(
    'raw',
    bytes.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    [
      'encrypt',
      'decrypt',
    ],
  );
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const paddedLength = Math.ceil(value.length / 4) * 4;
  const padded = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(paddedLength, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
