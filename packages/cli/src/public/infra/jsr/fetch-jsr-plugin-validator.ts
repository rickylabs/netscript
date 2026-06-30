import { parsePluginManifest } from '@netscript/plugin/protocol';
import { compare, parse } from '@std/semver';
import type {
  JsrHttpClient,
  JsrHttpResponse,
  JsrPackageDetails,
  JsrPluginValidationResult,
  JsrPluginValidatorPort,
  JsrVersionMetadata,
} from '../../features/plugins/install/jsr-plugin-validator-port.ts';
import type { ResolvedPluginPackageSpec } from '../../features/plugins/install/plugin-package-resolver.ts';

const JSON_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  Accept: 'application/json',
});

/** Fetch-backed static validator for JSR-hosted NetScript plugin packages. */
export class FetchJsrPluginValidator implements JsrPluginValidatorPort {
  constructor(private readonly http: JsrHttpClient = new WebFetchJsrHttpClient()) {}

  /** Resolve JSR metadata and parse `scaffold.plugin.json` without executing plugin code. */
  async validate(resolvedPackage: ResolvedPluginPackageSpec): Promise<JsrPluginValidationResult> {
    const packageUrl = jsrPackageMetaUrl(resolvedPackage);
    const packageResponse = await this.http.fetch(packageUrl, { headers: JSON_HEADERS });
    if (packageResponse.status === 404) {
      return {
        ok: false,
        error: {
          code: 'not-found',
          message: `JSR package ${resolvedPackage.packageSpecifier} was not found.`,
        },
      };
    }
    if (!packageResponse.ok) {
      return invalidMetadata(`JSR package metadata request failed with ${packageResponse.status}.`);
    }

    const packageMeta = readPackageMeta(await packageResponse.json());
    if (packageMeta === undefined) {
      return invalidMetadata(
        `JSR package metadata for ${resolvedPackage.packageSpecifier} is invalid.`,
      );
    }
    if (packageMeta.isYanked) {
      return {
        ok: false,
        error: {
          code: 'version-yanked',
          message:
            `JSR package ${resolvedPackage.packageSpecifier}@${packageMeta.latest} is yanked.`,
        },
      };
    }

    const versionResponse = await this.http.fetch(
      jsrVersionMetaUrl(resolvedPackage, packageMeta.latest),
      {
        headers: JSON_HEADERS,
      },
    );
    if (!versionResponse.ok) {
      return invalidMetadata(`JSR version metadata request failed with ${versionResponse.status}.`);
    }
    const versionMetadata = readVersionMetadata(await versionResponse.json());
    if (versionMetadata === undefined) {
      return invalidMetadata(
        `JSR version metadata for ${resolvedPackage.packageSpecifier} is invalid.`,
      );
    }

    const detailsResponse = await this.http.fetch(jsrPackageDetailsUrl(resolvedPackage), {
      headers: JSON_HEADERS,
    });
    if (!detailsResponse.ok) {
      return invalidMetadata(`JSR package details request failed with ${detailsResponse.status}.`);
    }
    const details = readPackageDetails(await detailsResponse.json());

    const manifestResponse = await this.http.fetch(
      jsrPackageFileUrl(resolvedPackage, packageMeta.latest, 'scaffold.plugin.json'),
      { headers: JSON_HEADERS },
    );
    if (manifestResponse.status === 404) {
      return {
        ok: false,
        error: {
          code: 'manifest-missing',
          message: `${resolvedPackage.packageSpecifier} does not publish scaffold.plugin.json.`,
        },
      };
    }
    if (!manifestResponse.ok) {
      return invalidMetadata(
        `scaffold.plugin.json request failed with ${manifestResponse.status}.`,
      );
    }

    const manifestResult = parsePluginManifest(await manifestResponse.json());
    if (!manifestResult.ok) {
      return {
        ok: false,
        error: {
          code: 'invalid-manifest',
          message: manifestResult.error.message,
        },
      };
    }

    return {
      ok: true,
      descriptor: {
        package: resolvedPackage,
        version: packageMeta.latest,
        manifest: manifestResult.manifest,
        packageMetadata: packageMeta,
        versionMetadata,
        details,
      },
    };
  }
}

/** Web Fetch implementation for the JSR validator HTTP port. */
export class WebFetchJsrHttpClient implements JsrHttpClient {
  /** Fetch a JSON resource. */
  fetch(
    url: string,
    init?: { readonly headers?: Readonly<Record<string, string>> },
  ): Promise<JsrHttpResponse> {
    return fetch(url, init);
  }
}

function jsrPackageMetaUrl(resolvedPackage: ResolvedPluginPackageSpec): string {
  return `https://jsr.io/@${resolvedPackage.scope}/${resolvedPackage.packageName}/meta.json`;
}

function jsrVersionMetaUrl(resolvedPackage: ResolvedPluginPackageSpec, version: string): string {
  return `https://jsr.io/@${resolvedPackage.scope}/${resolvedPackage.packageName}/${version}_meta.json`;
}

function jsrPackageDetailsUrl(resolvedPackage: ResolvedPluginPackageSpec): string {
  return `https://api.jsr.io/scopes/${resolvedPackage.scope}/packages/${resolvedPackage.packageName}`;
}

function jsrPackageFileUrl(
  resolvedPackage: ResolvedPluginPackageSpec,
  version: string,
  path: string,
): string {
  return `https://jsr.io/@${resolvedPackage.scope}/${resolvedPackage.packageName}/${version}/${path}`;
}

function invalidMetadata(message: string): JsrPluginValidationResult {
  return { ok: false, error: { code: 'invalid-metadata', message } };
}

function readPackageMeta(
  json: unknown,
): { readonly latest: string; readonly isYanked: boolean } | undefined {
  const record = asRecord(json);
  const versions = asRecord(record.versions);
  const latest = resolveInstallableVersion(record.latest, versions);
  if (latest === undefined) {
    return undefined;
  }
  const latestMetadata = asRecord(versions[latest]);
  return {
    latest,
    isYanked: latestMetadata.yanked === true,
  };
}

function resolveInstallableVersion(
  latest: unknown,
  versions: Record<string, unknown>,
): string | undefined {
  if (
    typeof latest === 'string' && latest.trim().length > 0 &&
    versions[latest] !== undefined
  ) {
    return latest;
  }

  return greatestNonYankedVersion(versions);
}

function greatestNonYankedVersion(versions: Record<string, unknown>): string | undefined {
  let greatestVersion: string | undefined;
  let greatestSemver: ReturnType<typeof parse> | undefined;

  for (const [version, metadata] of Object.entries(versions)) {
    if (asRecord(metadata).yanked === true) {
      continue;
    }

    let semver: ReturnType<typeof parse>;
    try {
      semver = parse(version);
    } catch {
      continue;
    }

    if (greatestSemver === undefined || compare(semver, greatestSemver) > 0) {
      greatestVersion = version;
      greatestSemver = semver;
    }
  }

  return greatestVersion;
}

function readVersionMetadata(json: unknown): JsrVersionMetadata | undefined {
  const record = asRecord(json);
  const exports = readStringRecord(record.exports);
  const manifest = asRecord(record.manifest);
  if (exports === undefined) {
    return undefined;
  }

  const files: Record<string, string> = {};
  for (const [path, entry] of Object.entries(manifest)) {
    const checksum = asRecord(entry).checksum;
    if (typeof checksum === 'string' && checksum.startsWith('sha256-')) {
      files[path] = checksum;
    }
  }

  return { exports, files };
}

function readPackageDetails(json: unknown): JsrPackageDetails {
  const record = asRecord(json);
  const description = typeof record.description === 'string' ? record.description : undefined;
  const score = typeof record.score === 'number' ? record.score : undefined;
  return {
    description,
    githubRepository: record.githubRepository,
    score,
    runtimeCompat: record.runtimeCompat,
  };
}

function readStringRecord(value: unknown): Readonly<Record<string, string>> | undefined {
  const record = asRecord(value);
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (typeof entry !== 'string') {
      return undefined;
    }
    result[key] = entry;
  }
  return result;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? Object(value) : {};
}
