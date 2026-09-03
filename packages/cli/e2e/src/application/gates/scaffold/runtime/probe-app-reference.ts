/** Browser acceptance probe for the generated canonical app reference. */

import { generatedAppHomeUrlsFromAppHost, readPinnedAppPort } from '../generated-app-endpoint.ts';

export interface BrowserViewport {
  readonly name: 'desktop' | 'mobile';
  readonly width: number;
  readonly height: number;
}

export interface ReferenceExpectation {
  readonly path: string;
  readonly markers: readonly string[];
}

export interface ProbeAppReferenceOptions {
  readonly resolveLiveUrls?: (appHost: string, appName: string) => Promise<string[]>;
  readonly render?: (url: string, viewport: BrowserViewport) => Promise<string>;
  readonly log?: (message: string) => void;
}

export const REFERENCE_VIEWPORTS: readonly BrowserViewport[] = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

export const REFERENCE_EXPECTATIONS: readonly ReferenceExpectation[] = [
  {
    path: '/',
    markers: ['href="/design"', 'href="/design/composition"'],
  },
  {
    path: '/design/composition',
    markers: ['Composition', 'L0'],
  },
  {
    path: '/examples/users',
    markers: ['Users', 'Cache-first query', 'Managed form', 'Deferred summary'],
  },
  {
    path: '/people',
    markers: ['People', 'Cache-first query', 'Deferred summary'],
  },
];

/** Assert semantic markers in browser-rendered DOM without depending on terminal or color output. */
export function assertReferenceDom(
  dom: string,
  expectation: ReferenceExpectation,
  viewport: BrowserViewport,
): void {
  for (const marker of expectation.markers) {
    if (!dom.includes(marker)) {
      throw new Error(
        `${viewport.name} reference probe ${expectation.path} did not render ${marker}`,
      );
    }
  }
}

/** Render the canonical scaffold and generated resource references in a real headless browser. */
export async function probeAppReference(
  projectRoot: string,
  appName: string,
  appHost?: string,
  options: ProbeAppReferenceOptions = {},
): Promise<void> {
  const baseUrls = options.resolveLiveUrls
    ? appHost === undefined ? [] : await options.resolveLiveUrls(appHost, appName)
    : await resolveProjectAppUrls(projectRoot, appName, appHost);
  if (baseUrls.length === 0) {
    throw new Error(`No live URL resolved for generated app ${appName}.`);
  }

  const render = options.render ?? renderWithHeadlessChrome;
  const log = options.log ?? console.info;
  let lastError: unknown;
  for (const baseUrl of baseUrls) {
    try {
      for (const viewport of REFERENCE_VIEWPORTS) {
        for (const expectation of REFERENCE_EXPECTATIONS) {
          const url = new URL(expectation.path, baseUrl).toString();
          const dom = await render(url, viewport);
          assertReferenceDom(dom, expectation, viewport);
        }
        log(
          `generated app reference rendered ${REFERENCE_EXPECTATIONS.length} routes at ${viewport.name}`,
        );
      }
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function resolveProjectAppUrls(
  projectRoot: string,
  appName: string,
  appHost?: string,
): Promise<string[]> {
  const pinned = readPinnedAppPort(projectRoot, appName);
  if (pinned !== undefined) return [`http://127.0.0.1:${pinned}/`];
  return appHost === undefined ? [] : await generatedAppHomeUrlsFromAppHost(appHost, appName);
}

async function renderWithHeadlessChrome(
  url: string,
  viewport: BrowserViewport,
): Promise<string> {
  const executable = await findBrowserExecutable();
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--disable-background-networking',
    `--window-size=${viewport.width},${viewport.height}`,
    '--virtual-time-budget=3000',
    '--dump-dom',
    url,
  ];
  const output = await new Deno.Command(executable, {
    args,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  const stdout = decoder.decode(output.stdout);
  const stderr = decoder.decode(output.stderr);
  if (!output.success) {
    throw new Error(
      `headless browser failed for ${url} at ${viewport.name} (exit ${output.code}): ${stderr}`,
    );
  }
  return stdout;
}

export async function findBrowserExecutable(): Promise<string> {
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
    '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const candidate of candidates) {
    try {
      const stat = await Deno.stat(candidate);
      if (stat.isFile) return candidate;
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  throw new Error(
    `No supported headless Chrome/Chromium executable found. Checked: ${candidates.join(', ')}`,
  );
}

if (import.meta.main) {
  const projectRoot = Deno.args[0];
  const appName = Deno.args[1];
  const appHost = Deno.args[2];
  if (!projectRoot) throw new Error('project root argument is required');
  if (!appName) throw new Error('app name argument is required');
  await probeAppReference(projectRoot, appName, appHost);
}
