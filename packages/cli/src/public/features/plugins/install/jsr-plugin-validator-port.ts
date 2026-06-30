import type { PluginInstallerManifest } from '@netscript/plugin/protocol';
import type { ResolvedPluginPackageSpec } from './plugin-package-resolver.ts';

/** Minimal response shape used by the JSR validator adapter. */
export interface JsrHttpResponse {
  /** HTTP status code. */
  readonly status: number;
  /** Whether the response status is in the successful range. */
  readonly ok: boolean;
  /** Parse the response body as JSON. */
  json(): Promise<unknown>;
}

/** Injectable HTTP client used by static JSR validation. */
export interface JsrHttpClient {
  /** Fetch a JSON resource. */
  fetch(
    url: string,
    init?: { readonly headers?: Readonly<Record<string, string>> },
  ): Promise<JsrHttpResponse>;
}

/** JSR package metadata used by the installer pipeline. */
export interface JsrPackageMetadata {
  /** Latest version advertised by `meta.json`. */
  readonly latest: string;
  /** Whether the selected version is yanked. */
  readonly isYanked: boolean;
}

/** JSR version metadata retained for later integrity verification. */
export interface JsrVersionMetadata {
  /** Published export map from `<version>_meta.json`. */
  readonly exports: Readonly<Record<string, string>>;
  /** Per-file sha256 checksums from the JSR version manifest. */
  readonly files: Readonly<Record<string, string>>;
}

/** Rich package details retained for the S3 confirmation gate. */
export interface JsrPackageDetails {
  /** Optional package description from api.jsr.io. */
  readonly description?: string;
  /** Optional GitHub repository metadata from api.jsr.io. */
  readonly githubRepository?: unknown;
  /** Optional JSR score from api.jsr.io. */
  readonly score?: number;
  /** Optional runtime compatibility metadata from api.jsr.io. */
  readonly runtimeCompat?: unknown;
}

/** Static descriptor returned after package resolution and manifest validation. */
export interface ValidatedPluginDescriptor {
  /** Resolved package identity. */
  readonly package: ResolvedPluginPackageSpec;
  /** Selected package version. */
  readonly version: string;
  /** Parsed NetScript plugin manifest. */
  readonly manifest: PluginInstallerManifest;
  /** Package metadata from jsr.io. */
  readonly packageMetadata: JsrPackageMetadata;
  /** Version metadata from jsr.io, including integrity checksums. */
  readonly versionMetadata: JsrVersionMetadata;
  /** Confirmation details from api.jsr.io. */
  readonly details: JsrPackageDetails;
}

/** Static validation error codes for expected JSR validation failures. */
export type JsrPluginValidationErrorCode =
  | 'not-found'
  | 'version-yanked'
  | 'manifest-missing'
  | 'invalid-manifest'
  | 'invalid-metadata';

/** Expected validation failure returned without executing plugin code. */
export interface JsrPluginValidationError {
  /** Machine-readable failure code. */
  readonly code: JsrPluginValidationErrorCode;
  /** Human-readable failure summary. */
  readonly message: string;
}

/** Result returned by the static JSR plugin validator. */
export type JsrPluginValidationResult =
  | { readonly ok: true; readonly descriptor: ValidatedPluginDescriptor }
  | { readonly ok: false; readonly error: JsrPluginValidationError };

/** Port for static JSR plugin validation. */
export interface JsrPluginValidatorPort {
  /** Resolve JSR metadata and parse `scaffold.plugin.json` without executing plugin code. */
  validate(resolvedPackage: ResolvedPluginPackageSpec): Promise<JsrPluginValidationResult>;
}
