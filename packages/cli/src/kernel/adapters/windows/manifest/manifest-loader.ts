/** Load the Aspire manifest used for Windows production env resolution. */
import type { AspireManifest } from './manifest-types.ts';

let _cache: { path: string; manifest: AspireManifest } | null = null;

/**
 * Load and parse the Aspire manifest. Results are cached per path.
 * Returns null if the file is not found (graceful degradation).
 */
export async function loadAspireManifest(projectRoot: string): Promise<AspireManifest | null> {
  const manifestPath = `${projectRoot}/.llm/aspire-manifest.json`;
  if (_cache?.path === manifestPath) return _cache.manifest;

  try {
    const raw = await Deno.readTextFile(manifestPath);
    const manifest = JSON.parse(raw) as AspireManifest;
    _cache = { path: manifestPath, manifest };
    return manifest;
  } catch {
    return null;
  }
}
