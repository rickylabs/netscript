/**
 * @module
 *
 * Probe for `behavior.app-home`: asks the running generated app for its home page and
 * requires a 2xx that is actually an HTML document. Asserting the status alone would not
 * do — a Fresh error overlay is `text/html` too.
 *
 * `runtime.wait.<app>` proves Aspire *calls* the app healthy. This probe proves the claim
 * is true. It never assumes the port: it reads one the project pins, and otherwise asks the
 * running AppHost which port Aspire allocated (the pristine scaffold pins nothing so that
 * `aspire start --isolated` works — see `generated-app-endpoint.ts`). Guessing would make a
 * failure unreadable, because a refused connection and a broken render are indistinguishable
 * from the outside: both look like "the home page never arrived".
 *
 * Usage: `deno run --allow-read --allow-net=127.0.0.1 --allow-run=aspire probe-app-home.ts
 * <projectRoot> <appName> [appHost]`
 */

import { generatedAppHomeUrls } from './generated-app-endpoint.ts';

const ATTEMPTS = 60;
const RETRY_DELAY_MS = 1_000;

const projectRoot = Deno.args[0];
const appName = Deno.args[1];
const appHost = Deno.args[2];
if (!projectRoot) throw new Error('project root argument is required');
if (!appName) throw new Error('app name argument is required');

// Resolved once, up front: a pinned port yields one URL, an Aspire-allocated one yields the
// endpoint the AppHost reports plus its 127.0.0.1 twin. Each attempt tries them all, so a
// candidate that is merely unreachable never masks one that works.
const urls = await generatedAppHomeUrls(projectRoot, appName, appHost);
console.info(`probing ${appName} home page at: ${urls.join(', ')}`);

const lastFailure = new Map<string, string>();

for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  for (const url of urls) {
    try {
      const response = await fetch(url, { headers: { accept: 'text/html' } });
      const contentType = response.headers.get('content-type') ?? '';
      const body = await response.text();
      if (response.ok && contentType.includes('text/html') && body.includes('<html')) {
        console.info(
          `app home page rendered at ${url}: HTTP ${response.status} (${body.length} bytes)`,
        );
        Deno.exit(0);
      }
      lastFailure.set(url, `HTTP ${response.status} (${contentType}): ${body.slice(0, 200)}`);
    } catch (error) {
      lastFailure.set(url, error instanceof Error ? error.message : String(error));
    }
  }
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
}

throw new Error(
  `app home page did not render after ${ATTEMPTS} attempts:\n` +
    [...lastFailure].map(([url, reason]) => `  ${url} -> ${reason}`).join('\n'),
);
