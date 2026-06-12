#!/usr/bin/env -S deno run --allow-read
/**
 * DS fitness gate for @netscript/fresh-ui: no off-vocabulary color
 * utilities in components.
 *
 * The token rule (docs/l0-conventions.md) limits component markup to the
 * semantic `*-ns-*` Tailwind utilities (bg-ns-surface, text-ns-fg, ...).
 * Stock Tailwind palette utilities (bg-red-500, text-gray-700, bg-white)
 * and arbitrary color values (bg-[#fff], text-[oklch(...)]) bypass the
 * theme and are forbidden.
 *
 * Documented exceptions may opt out with a `ds-allow-color-utility`
 * comment on the same line.
 *
 * CI command:
 * deno run --allow-read .llm/tools/fitness/check-ds-color-utilities.ts
 */

const PACKAGE_ROOT = 'packages/fresh-ui';
const SCAN_EXTENSIONS = ['.css', '.ts', '.tsx'];
const EXCLUDED_SEGMENTS = ['registry/theme/', 'scripts/', 'docs/'];
const ALLOW_MARKER = 'ds-allow-color-utility';

const COLOR_PREFIXES =
  'bg|text|border|ring|fill|stroke|outline|decoration|divide|accent|caret|from|via|to|shadow';
const TAILWIND_PALETTE =
  'red|blue|gray|grey|slate|zinc|neutral|stone|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose';

const STOCK_PALETTE_UTILITY = new RegExp(
  `(?<![a-zA-Z0-9-])(?:${COLOR_PREFIXES})-(?:${TAILWIND_PALETTE})-\\d{2,3}(?![\\w-])`,
  'g',
);
const KEYWORD_COLOR_UTILITY = new RegExp(
  `(?<![a-zA-Z0-9-])(?:${COLOR_PREFIXES})-(?:white|black)(?![\\w-])`,
  'g',
);
const ARBITRARY_COLOR_UTILITY = new RegExp(
  `(?<![a-zA-Z0-9-])(?:${COLOR_PREFIXES})-\\[(?:#|rgba?|hsla?|oklch|oklab|hwb)`,
  'g',
);

const violations: string[] = [];
let scanned = 0;

for await (const path of walk(PACKAGE_ROOT)) {
  scanned++;
  const lines = (await Deno.readTextFile(path)).split('\n');
  lines.forEach((line, index) => {
    if (line.includes(ALLOW_MARKER)) return;
    for (
      const pattern of [STOCK_PALETTE_UTILITY, KEYWORD_COLOR_UTILITY, ARBITRARY_COLOR_UTILITY]
    ) {
      pattern.lastIndex = 0;
      const match = pattern.exec(line);
      if (match) {
        violations.push(`${path}:${index + 1}: ${match[0]} — ${line.trim()}`);
      }
    }
  });
}

if (violations.length) {
  console.error(`ds-color-utilities: FAIL ${violations.length} off-vocabulary color utility(ies)`);
  for (const violation of violations) console.error(`  ${violation}`);
  Deno.exit(1);
}

console.log(`ds-color-utilities: PASS ${scanned} files clean`);

async function* walk(dir: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(dir)) {
    const path = `${dir}/${entry.name}`;
    if (EXCLUDED_SEGMENTS.some((segment) => `${path}/`.includes(`/${segment}`))) {
      continue;
    }
    if (entry.isDirectory) {
      yield* walk(path);
    } else if (
      SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext)) &&
      !/[._]test\.(ts|tsx)$/.test(entry.name)
    ) {
      yield path;
    }
  }
}
