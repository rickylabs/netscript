/** Served-surface acceptance probe for the generated route-local Fresh island. */

import { dirname } from '@std/path';
import type { IslandScriptReceipt, IslandServedSurfaceReceipt } from './island-receipts.ts';
import { resolveProjectAppUrls } from './probe-app-reference.ts';

const ISLAND_NAME = 'ServiceShowcaseLab';
const ISLAND_PATH = '/examples/users';

export interface ProbeIslandServedSurfaceOptions {
  readonly resolveLiveUrls?: (appHost: string, appName: string) => Promise<string[]>;
  readonly fetch?: typeof fetch;
  readonly persist?: (receipt: IslandServedSurfaceReceipt) => Promise<void>;
}

/** Fetch the generated page and every module resource named by its Fresh boot surface. */
export async function collectIslandServedSurface(
  pageUrl: string,
  options: Pick<ProbeIslandServedSurfaceOptions, 'fetch'> = {},
): Promise<IslandServedSurfaceReceipt> {
  const fetcher = options.fetch ?? fetch;
  const pageResponse = await fetcher(pageUrl);
  if (pageResponse.status !== 200) {
    throw new Error(`generated island page ${pageUrl} returned ${pageResponse.status}`);
  }
  const html = await pageResponse.text();
  const markers = [...html.matchAll(/<!--(frsh:island:[^>]+)-->/g)].map((match) => match[1]);
  const scripts: IslandScriptReceipt[] = [];
  for (const specifier of moduleSpecifiers(html)) {
    const url = new URL(specifier, pageUrl).toString();
    try {
      const response = await fetcher(url);
      const body = await response.text();
      scripts.push({
        url,
        status: response.status,
        contentType: response.headers.get('content-type'),
        bundleHit: body.includes(ISLAND_NAME),
      });
    } catch (error) {
      scripts.push({
        url,
        status: null,
        contentType: null,
        bundleHit: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return {
    markers,
    scripts,
    bundleHit: scripts.some((script) => script.bundleHit),
  };
}

/** Resolve the live app, retain a receipt, and fail on the first missing served-island invariant. */
export async function probeIslandServedSurface(
  projectRoot: string,
  appName: string,
  appHost: string | undefined,
  options: ProbeIslandServedSurfaceOptions & { readonly receiptPath?: string } = {},
): Promise<IslandServedSurfaceReceipt> {
  const baseUrls = options.resolveLiveUrls
    ? appHost === undefined ? [] : await options.resolveLiveUrls(appHost, appName)
    : await resolveProjectAppUrls(projectRoot, appName, appHost);
  if (baseUrls.length === 0) throw new Error(`No live URL resolved for generated app ${appName}.`);

  const persist = options.persist ??
    (options.receiptPath
      ? (receipt: IslandServedSurfaceReceipt) => writeReceipt(options.receiptPath!, receipt)
      : () => Promise.resolve());
  let lastError: unknown;
  for (const baseUrl of baseUrls) {
    try {
      const receipt = await collectIslandServedSurface(
        new URL(ISLAND_PATH, baseUrl).toString(),
        options,
      );
      await persist(receipt);
      assertServedSurfaceReceipt(receipt);
      return receipt;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** Validate the exact evidence required by behavior.island-served-surface. */
export function assertServedSurfaceReceipt(receipt: IslandServedSurfaceReceipt): void {
  if (!receipt.markers.some((marker) => marker.startsWith(`frsh:island:${ISLAND_NAME}:`))) {
    throw new Error(`served HTML did not contain the Fresh ${ISLAND_NAME} island marker`);
  }
  if (receipt.scripts.length === 0) {
    throw new Error('served HTML did not reference any Fresh module scripts or preloads');
  }
  for (const script of receipt.scripts) {
    if (script.status !== 200) {
      throw new Error(`island module ${script.url} returned ${script.status ?? script.error}`);
    }
    if (!isJavaScriptContentType(script.contentType)) {
      throw new Error(
        `island module ${script.url} returned non-JavaScript content type ${script.contentType}`,
      );
    }
  }
  if (!receipt.bundleHit) {
    throw new Error(`resolved island bundle did not contain ${ISLAND_NAME}`);
  }
}

function moduleSpecifiers(html: string): string[] {
  const found: string[] = [];
  for (const match of html.matchAll(/<link\b([^>]*)>/gi)) {
    if (attribute(match[1], 'rel')?.toLowerCase() !== 'modulepreload') continue;
    const href = attribute(match[1], 'href');
    if (href) found.push(href);
  }
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (attribute(match[1], 'type')?.toLowerCase() !== 'module') continue;
    const src = attribute(match[1], 'src');
    if (src) found.push(src);
    for (
      const imported of match[2].matchAll(
        /(?:\bfrom\s*|\bimport\s*\()\s*["']([^"']+)["']/g,
      )
    ) {
      found.push(imported[1]);
    }
  }
  return [...new Set(found)];
}

function attribute(source: string, name: string): string | undefined {
  const match = source.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match?.[1];
}

function isJavaScriptContentType(value: string | null): boolean {
  return value !== null && /(?:java|ecma)script/i.test(value);
}

async function writeReceipt(path: string, receipt: IslandServedSurfaceReceipt): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, `${JSON.stringify(receipt, null, 2)}\n`);
}

if (import.meta.main) {
  const [projectRoot, appName, appHost, receiptPath] = Deno.args;
  if (!projectRoot || !appName || !receiptPath) {
    throw new Error('project root, app name, app host, and receipt path are required');
  }
  await probeIslandServedSurface(projectRoot, appName, appHost, { receiptPath });
}
