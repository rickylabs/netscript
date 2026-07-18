/** WebCrypto Ed25519 adapter for exact-string native release envelopes. */

import {
  type NativeReleasePayload,
  NativeReleaseError,
  type SignedReleaseEnvelope,
} from './native-release-contract.ts';

const PKCS8_BEGIN = '-----BEGIN PRIVATE KEY-----';
const PKCS8_END = '-----END PRIVATE KEY-----';

/** Decode a PKCS#8 PEM string without logging or retaining its textual wrapper. */
export function decodePkcs8Pem(pem: string): Uint8Array {
  const compact = pem.replace(PKCS8_BEGIN, '').replace(PKCS8_END, '').replaceAll(/\s/g, '');
  if (compact.length === 0) {
    throw new NativeReleaseError('key-invalid', 'The Ed25519 private key must be PKCS#8 PEM.');
  }
  try {
    return Uint8Array.fromBase64(compact);
  } catch {
    throw new NativeReleaseError('key-invalid', 'The Ed25519 private key must be valid PKCS#8 PEM.');
  }
}

/** Import an Ed25519 PKCS#8 key through WebCrypto. */
export async function importReleasePrivateKey(pkcs8: Uint8Array): Promise<CryptoKey> {
  try {
    return await crypto.subtle.importKey(
      'pkcs8',
      new Uint8Array(pkcs8),
      'Ed25519',
      false,
      ['sign'],
    );
  } catch {
    throw new NativeReleaseError('key-invalid', 'Unable to import the Ed25519 PKCS#8 private key.');
  }
}

/** Sign an exact JSON string and preserve it verbatim in the envelope. */
export async function signReleaseString(
  signed: string,
  privateKey: CryptoKey,
): Promise<SignedReleaseEnvelope> {
  try {
    const signature = await crypto.subtle.sign(
      'Ed25519',
      privateKey,
      new TextEncoder().encode(signed),
    );
    return { signed, signature: new Uint8Array(signature).toBase64() };
  } catch {
    throw new NativeReleaseError('sign-failed', 'Unable to sign the native release manifest.');
  }
}

/** Serialize the native fields once, then sign those exact bytes. */
export function signNativeReleasePayload(
  payload: NativeReleasePayload,
  privateKey: CryptoKey,
): Promise<SignedReleaseEnvelope> {
  return signReleaseString(JSON.stringify(payload), privateKey);
}
