/**
 * @module kernel/constants/version-drift_test
 *
 * Guard test: fails if any CLI `src/**` file reintroduces a hardcoded pinned
 * NetScript JSR specifier (e.g. `jsr:@netscript/fresh@0.0.1-alpha.2`).
 *
 * Scaffold version specifiers must be derived from `NETSCRIPT_RELEASE_VERSION`
 * (see `./jsr-specifiers.ts`) so a `deno bump-version` rewrite of the manifest
 * cannot leave stale pins behind. The version-neutral doc form
 * `jsr:@netscript/<pkg>@<release>` is intentionally NOT matched.
 */

import { assertEquals } from 'jsr:@std/assert@^1';
import { walk } from '@std/fs';
import { fromFileUrl } from 'jsr:@std/path@^1';

/** Matches a hardcoded pinned NetScript JSR specifier (e.g. `@0.0.1-alpha.2`). */
const PINNED_JSR_SPECIFIER = /jsr:@netscript\/[^@'"\s]+@0\.0\.1-alpha\.\d+/;

const SRC_ROOT = fromFileUrl(new URL('../../', import.meta.url));
const SELF_PATH = fromFileUrl(import.meta.url);

Deno.test('no hardcoded pinned NetScript JSR specifiers in CLI src', async () => {
  const offenders: string[] = [];

  for await (
    const entry of walk(SRC_ROOT, {
      includeDirs: false,
      exts: ['ts', 'tsx'],
    })
  ) {
    // Skip the guard itself (it contains the pattern source) and deno.json files.
    if (entry.path === SELF_PATH) continue;
    if (entry.name === 'deno.json') continue;

    const text = await Deno.readTextFile(entry.path);
    if (PINNED_JSR_SPECIFIER.test(text)) {
      offenders.push(entry.path);
    }
  }

  assertEquals(
    offenders,
    [],
    `Found hardcoded pinned NetScript JSR specifiers. Derive them from ` +
      `NETSCRIPT_RELEASE_VERSION / netscriptJsrSpecifier instead:\n` +
      offenders.join('\n'),
  );
});
