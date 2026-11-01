/** Focused native runtime proof for the persisted Northwind orders preset. */
import { resolveProjectAppUrls } from './probe-app-reference.ts';

const SEED_REFERENCE = 'NW-10253';
const SEED_FIELDS = [SEED_REFERENCE, 'Hanari Carnes', 'Brazil', '$1,444.80', 'pending'];
const REQUEST_TIMEOUT_MS = 30_000;

export type NorthwindProbeState = 'ready' | 'unavailable';

/** Inspect visible cells/fields, excluding hydration data and page scripts. */
export function assertNorthwindDom(dom: string, state: NorthwindProbeState): void {
  const markup = dom.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const fields = [...markup.matchAll(/<(td|dd)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((field) => field[2].replace(/<[^>]*>/g, ''));
  if (state === 'unavailable') {
    if (
      !/Records? unavailable/.test(markup) || fields.some((field) => field.includes(SEED_REFERENCE))
    ) {
      throw new Error('Northwind service-down page must show unavailable without stale seed rows.');
    }
    return;
  }
  for (const expected of SEED_FIELDS) {
    if (!fields.some((field) => field.includes(expected))) {
      throw new Error(`Northwind page did not render persisted field: ${expected}`);
    }
  }
  if (markup.includes('Records unavailable') || markup.includes('No connected data')) {
    throw new Error('Northwind page reports an unavailable service despite rendered rows.');
  }
}

/** Discover the actual app URL through Aspire, then require live list, overview and detail. */
export async function probeNorthwindOrders(
  projectRoot: string,
  appName: string,
  appHost: string,
  state: NorthwindProbeState = 'ready',
): Promise<{ readonly state: NorthwindProbeState; readonly paths: readonly string[] }> {
  const urls = await resolveProjectAppUrls(projectRoot, appName, appHost);
  if (!urls.length) throw new Error(`No live URL resolved for ${appName}.`);
  let lastError: unknown;
  for (const base of urls) {
    try {
      const read = async (path: string): Promise<string> => {
        const response = await fetch(new URL(path, base), {
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        const dom = await response.text();
        if (response.status !== 200) throw new Error(`${path} returned HTTP ${response.status}.`);
        assertNorthwindDom(dom, state);
        return dom;
      };
      const list = await read('/records');
      await read('/');
      const paths = ['/records', '/'];
      if (state === 'ready') {
        const markup = list.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
        const row = [...markup.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)]
          .find(([html]) => html.includes(SEED_REFERENCE))?.[0];
        const detail = row?.match(/href="(\/records\/[1-9]\d*)"/)?.[1];
        if (!detail) throw new Error('Seeded Northwind row has no generated detail link.');
        await read(detail);
        paths.push(detail);
      }
      return { state, paths };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

if (import.meta.main) {
  const [projectRoot, appName, appHost, state = 'ready'] = Deno.args;
  if (!projectRoot || !appName || !appHost || (state !== 'ready' && state !== 'unavailable')) {
    throw new Error(
      'Usage: probe-northwind.ts <project-root> <app-name> <apphost> [ready|unavailable]',
    );
  }
  console.log(JSON.stringify(await probeNorthwindOrders(projectRoot, appName, appHost, state)));
}
