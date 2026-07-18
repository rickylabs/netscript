/** Hardened server handler for native Deno Desktop release artifacts. */

import { isAbsolute, join, relative, resolve, SEPARATOR } from '@std/path';
import {
  AUTO_UPDATE_ARCHITECTURES,
  AUTO_UPDATE_OPERATING_SYSTEMS,
  type AutoUpdateArchitecture,
  type AutoUpdateOperatingSystem,
} from '@netscript/sdk/auto-update';

/** Cache policy for the mutable native manifest. */
export const RELEASE_MANIFEST_CACHE_CONTROL = 'no-store' as const;

/** Cache policy for immutable patches and native installers. */
export const RELEASE_ARTIFACT_CACHE_CONTROL = 'public, max-age=31536000, immutable' as const;

/** Optional URL mount path placed before channel and target segments. */
export interface ReleaseHandlerOptions {
  /** Absolute URL path matching the pathname portion of the SDK `baseUrl`. */
  readonly basePath?: string;
}

const PUBLIC_ARTIFACT_EXTENSIONS = [
  '.bsdiff',
  '.dmg',
  '.AppImage',
  '.deb',
  '.rpm',
  '.msi',
  '.zip',
] as const;

function errorResponse(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function safeSegment(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) && !value.startsWith('.');
}

function validTarget(value: string): boolean {
  return AUTO_UPDATE_OPERATING_SYSTEMS.some((os) =>
    AUTO_UPDATE_ARCHITECTURES.some((arch) => value === `${os}-${arch}`)
  );
}

/** Compose the server route path from the same public SDK target vocabulary. */
export function createReleaseRoutePath(
  channel: string,
  os: AutoUpdateOperatingSystem,
  arch: AutoUpdateArchitecture,
): string {
  if (!safeSegment(channel) || !AUTO_UPDATE_OPERATING_SYSTEMS.includes(os) ||
    !AUTO_UPDATE_ARCHITECTURES.includes(arch)) {
    throw new TypeError('Invalid native release route.');
  }
  return `/${encodeURIComponent(channel)}/${os}-${arch}`;
}

function validPublicFile(value: string): boolean {
  return value === 'latest.json' ||
    (safeSegment(value) && PUBLIC_ARTIFACT_EXTENSIONS.some((extension) => value.endsWith(extension)));
}

function normalizeBaseSegments(basePath: string | undefined): readonly string[] {
  const value = basePath?.trim() || '/';
  if (!value.startsWith('/') || /[?#%]/.test(value)) {
    throw new TypeError('Release base path must be an absolute decoded URL path.');
  }
  const segments = value.split('/').filter(Boolean);
  if (segments.some((segment) => !safeSegment(segment))) {
    throw new TypeError('Release base path contains an unsafe segment.');
  }
  return segments;
}

/** Resolve a validated public path and prove it remains beneath the configured root. */
export function resolveReleaseFileUnderRoot(
  releaseRoot: string,
  channel: string,
  target: string,
  file: string,
): string | undefined {
  if (!safeSegment(channel) || !validTarget(target) || !validPublicFile(file)) return undefined;
  const root = resolve(releaseRoot);
  const candidate = resolve(root, channel, target, file);
  const resolvedRelative = relative(root, candidate);
  if (
    resolvedRelative.length === 0 || isAbsolute(resolvedRelative) || resolvedRelative === '..' ||
    resolvedRelative.startsWith(`..${SEPARATOR}`)
  ) return undefined;
  return candidate;
}

function artifactContentType(file: string): string {
  if (file === 'latest.json') return 'application/json; charset=utf-8';
  if (file.endsWith('.zip')) return 'application/zip';
  if (file.endsWith('.deb')) return 'application/vnd.debian.binary-package';
  if (file.endsWith('.rpm')) return 'application/x-rpm';
  if (file.endsWith('.dmg')) return 'application/x-apple-diskimage';
  return 'application/octet-stream';
}

/** Create a GET/HEAD-only native release request handler. */
export function createReleaseRequestHandler(
  releaseRoot: string,
  options: ReleaseHandlerOptions = {},
): (request: Request) => Promise<Response> {
  const root = resolve(releaseRoot);
  const baseSegments = normalizeBaseSegments(options.basePath);
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { allow: 'GET, HEAD', 'cache-control': 'no-store' },
      });
    }

    const pathname = new URL(request.url).pathname;
    if (/%(?:2e|2f|5c)/i.test(pathname)) {
      return errorResponse(400, 'Encoded path separators and dot segments are not allowed.');
    }
    let segments: string[];
    try {
      segments = pathname.split('/').filter(Boolean).map(decodeURIComponent);
    } catch {
      return errorResponse(400, 'Malformed release path.');
    }
    if (
      segments.length !== baseSegments.length + 3 ||
      baseSegments.some((segment, index) => segments[index] !== segment)
    ) return errorResponse(404, 'Release artifact not found.');
    const [channel, target, file] = segments.slice(baseSegments.length);
    const path = resolveReleaseFileUnderRoot(root, channel, target, file);
    if (path === undefined) return errorResponse(404, 'Release artifact not found.');

    try {
      const info = await Deno.stat(path);
      if (!info.isFile) return errorResponse(404, 'Release artifact not found.');
      const realRoot = await Deno.realPath(root);
      const realFile = await Deno.realPath(path);
      const realRelative = relative(realRoot, realFile);
      if (
        isAbsolute(realRelative) || realRelative === '..' || realRelative.startsWith(`..${SEPARATOR}`)
      ) return errorResponse(404, 'Release artifact not found.');
      const headers = new Headers({
        'content-type': artifactContentType(file),
        'content-length': String(info.size),
        'cache-control': file === 'latest.json'
          ? RELEASE_MANIFEST_CACHE_CONTROL
          : RELEASE_ARTIFACT_CACHE_CONTROL,
        'x-content-type-options': 'nosniff',
      });
      return new Response(request.method === 'HEAD' ? null : await Deno.readFile(path), { headers });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return errorResponse(404, 'Release artifact not found.');
      return errorResponse(500, 'Unable to read release artifact.');
    }
  };
}
