import { join } from '@std/path';

export interface BrowserPathOptions {
  envPath?: string;
  cacheDir?: string;
}

function revision(name: string): number {
  const match = /^chromium-(\d+)$/.exec(name);
  return match ? Number(match[1]) : -1;
}

/** Resolves an explicit Chromium executable without downloading a browser. */
export async function resolveChromiumPath(
  options: BrowserPathOptions,
): Promise<string | undefined> {
  if (options.envPath) return options.envPath;
  if (!options.cacheDir) return undefined;

  const candidates: Array<{ revision: number; path: string }> = [];
  try {
    for await (const entry of Deno.readDir(options.cacheDir)) {
      if (!entry.isDirectory) continue;
      const parsedRevision = revision(entry.name);
      if (parsedRevision < 0) continue;
      const path = join(options.cacheDir, entry.name, 'chrome-linux64', 'chrome');
      try {
        if ((await Deno.stat(path)).isFile) candidates.push({ revision: parsedRevision, path });
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      }
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }

  candidates.sort((left, right) => right.revision - left.revision);
  return candidates[0]?.path;
}

/** Returns the default Playwright browser cache directory for the current user. */
export function defaultBrowserCacheDir(home: string | undefined): string | undefined {
  return home ? join(home, '.cache', 'ms-playwright') : undefined;
}

/** Adds browser-revision recovery guidance without leaking navigation URLs. */
export function browserLaunchError(error: unknown, explicitPath: string | undefined): Error {
  const cause = error instanceof Error ? error.message : String(error);
  const source = explicitPath
    ? `Chromium executable ${explicitPath} could not be launched.`
    : 'Playwright could not resolve or launch its expected Chromium build.';
  return new Error(
    `${source} The installed Playwright package and cached browser revision may not match. ` +
      'Set CANVAS_SHOTS_CHROMIUM to a compatible chrome executable, or explicitly install the ' +
      `pinned browser build with "deno run -A npm:playwright install chromium". ` +
      `No browser was downloaded automatically. Cause: ${cause}`,
  );
}
