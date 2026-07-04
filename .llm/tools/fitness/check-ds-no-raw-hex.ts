#!/usr/bin/env -S deno run --allow-read
/**
 * DS fitness gate for @netscript/fresh-ui: no raw color literals in
 * components.
 *
 * The token rule (docs/l0-conventions.md) says component CSS and runtime
 * code consume only the semantic `--ns-*` vocabulary (plus `color-mix()`
 * over it). Raw hex values and raw color functions are forbidden outside
 * the generated theme artifacts (`registry/theme/`), which legitimately
 * carry hex fallbacks for OKLCH ramps.
 *
 * Documented platform fallbacks may opt out with a `ds-allow-raw-color`
 * comment on the same line.
 *
 * CI command:
 * deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts
 */

const DEFAULT_PACKAGE_ROOT = 'packages/fresh-ui';
const PACKAGE_ROOT = parseRootArg(Deno.args);
const SCAN_EXTENSIONS = ['.css', '.ts', '.tsx'];
const EXCLUDED_SEGMENTS = ['registry/theme/', 'scripts/', 'docs/'];
const ALLOW_MARKER = 'ds-allow-raw-color';

const RAW_HEX = /#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z-])/g;
const RAW_COLOR_FN = /(?<![a-zA-Z.-])(?:rgba?|hsla?|oklch|oklab|hwb)\(/g;

if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
  console.log(
    [
      'check-ds-no-raw-hex.ts — DS gate: no raw color literals in @netscript/fresh-ui components',
      '',
      'Usage:',
      '  deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts [--root <dir>]',
      '',
      'Flags:',
      `  --root <dir>   package root to scan (default: ${DEFAULT_PACKAGE_ROOT})`,
      '  --help, -h     show this help',
      '',
      'Opt out a documented fallback with a `ds-allow-raw-color` comment on the same line.',
      'Exit codes: 0 = clean · 1 = at least one raw color literal.',
    ].join('\n'),
  );
  Deno.exit(0);
}

const violations: string[] = [];
let scanned = 0;

for await (const path of walk(PACKAGE_ROOT)) {
  scanned++;
  const lines = (await Deno.readTextFile(path)).split('\n');
  lines.forEach((line, index) => {
    if (line.includes(ALLOW_MARKER)) return;
    for (const pattern of [RAW_HEX, RAW_COLOR_FN]) {
      pattern.lastIndex = 0;
      const match = pattern.exec(line);
      if (match) {
        violations.push(`${path}:${index + 1}: ${match[0]} — ${line.trim()}`);
      }
    }
  });
}

if (violations.length) {
  console.error(`ds-no-raw-hex: FAIL ${violations.length} raw color literal(s)`);
  for (const violation of violations) console.error(`  ${violation}`);
  Deno.exit(1);
}

console.log(`ds-no-raw-hex: PASS ${scanned} files clean`);

function parseRootArg(args: string[]): string {
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--root') {
      const value = args[index + 1];
      if (!value) throw new Error('Missing value for --root');
      return value;
    }
    if (arg.startsWith('--root=')) {
      return arg.slice('--root='.length);
    }
  }
  return DEFAULT_PACKAGE_ROOT;
}

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
      !/[._]test\.(ts|tsx)$/.test(entry.name) &&
      // Generated asset barrels embed already-gated source verbatim
      // (incl. registry/theme's legitimate ramp hex) — don't double-scan.
      !/\.generated\.(ts|tsx)$/.test(entry.name)
    ) {
      yield path;
    }
  }
}
