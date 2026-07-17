/** Native Deno Desktop release manifest vocabulary. */

/** Version of the NetScript-compatible native trusted payload. */
export const NATIVE_RELEASE_MANIFEST_VERSION = 1 as const;

/** One bsdiff patch consumed by Deno Desktop. */
export interface NativeReleasePatch {
  /** Route-relative immutable patch filename. */
  readonly name: string;
  /** Lowercase SHA-256 digest of the patch bytes. */
  readonly sha256: string;
}

/** Native trusted payload; later graph manifests extend this object. */
export interface NativeReleasePayload {
  /** Native manifest contract version. */
  readonly manifestVersion: typeof NATIVE_RELEASE_MANIFEST_VERSION;
  /** Strictly increasing release-authoring sequence. */
  readonly sequence: number;
  /** New runtime version. */
  readonly version: string;
  /** Patches keyed by the runtime version they replace. */
  readonly patches: Readonly<Record<string, NativeReleasePatch>>;
}

/** Exact-string Ed25519 envelope served as native `latest.json`. */
export interface SignedReleaseEnvelope {
  /** Exact JSON string whose UTF-8 bytes were signed. */
  readonly signed: string;
  /** Base64 Ed25519 signature over `signed`. */
  readonly signature: string;
}

/** Stable release preparation failure codes. */
export const NATIVE_RELEASE_ERROR_CODES = [
  'invalid-input',
  'patch-failed',
  'key-invalid',
  'sign-failed',
  'sequence-rejected',
  'route-busy',
  'artifact-conflict',
  'store-failed',
] as const;

/** Native release preparation failure. */
export class NativeReleaseError extends Error {
  /** Create a classified error without exposing secret key material. */
  constructor(
    readonly code: (typeof NATIVE_RELEASE_ERROR_CODES)[number],
    message: string,
  ) {
    super(message);
    this.name = 'NativeReleaseError';
  }
}
