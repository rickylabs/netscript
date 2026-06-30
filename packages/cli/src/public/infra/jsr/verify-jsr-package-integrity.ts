import type { ValidatedPluginDescriptor } from '../../features/plugins/install/jsr-plugin-validator-port.ts';

/** Fetcher used to read published package files for integrity verification. */
export interface JsrPackageFileFetcher {
  /** Fetch a published package file as raw bytes. */
  fetchFile(url: string): Promise<Uint8Array>;
}

/** Result returned by package integrity verification. */
export type JsrPackageIntegrityResult =
  | { readonly ok: true; readonly checkedFiles: readonly string[] }
  | {
    readonly ok: false;
    readonly path: string;
    readonly expected: string;
    readonly actual: string;
  };

/** Verify published JSR package files against `_meta.json` sha256 checksums. */
export async function verifyJsrPackageIntegrity(
  descriptor: ValidatedPluginDescriptor,
  fetcher: JsrPackageFileFetcher = new WebJsrPackageFileFetcher(),
): Promise<JsrPackageIntegrityResult> {
  const checkedFiles: string[] = [];
  for (const [path, expected] of Object.entries(descriptor.versionMetadata.files)) {
    const bytes = await fetcher.fetchFile(jsrPackageFileUrl(descriptor, path));
    const actual = await sha256Checksum(bytes);
    if (actual !== expected) {
      return { ok: false, path, expected, actual };
    }
    checkedFiles.push(path);
  }
  return { ok: true, checkedFiles };
}

/** Fetch-backed package file reader for JSR package contents. */
export class WebJsrPackageFileFetcher implements JsrPackageFileFetcher {
  /** Fetch a published package file as bytes. */
  async fetchFile(url: string): Promise<Uint8Array> {
    const response = await fetch(url, { headers: { Accept: 'application/octet-stream' } });
    if (!response.ok) {
      throw new Error(`JSR package file request failed with ${response.status}: ${url}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }
}

function jsrPackageFileUrl(descriptor: ValidatedPluginDescriptor, path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const pkg = descriptor.package;
  return `https://jsr.io/@${pkg.scope}/${pkg.packageName}@${descriptor.version}/${cleanPath}`;
}

async function sha256Checksum(bytes: Uint8Array): Promise<string> {
  const input = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(input).set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return `sha256-${base64(new Uint8Array(digest))}`;
}

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
