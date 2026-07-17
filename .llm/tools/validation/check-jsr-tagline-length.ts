/**
 * check-jsr-tagline-length.ts — JSR package-description length gate.
 *
 * The JSR package description shown on jsr.io is NOT read from `deno.json`. It is derived from each
 * package README's **bold tagline** — the first prose paragraph after the H1 and badge block — by
 * `.llm/tools/release/jsr-set-package-settings.ts`, and PATCHed onto JSR after publish.
 *
 * JSR validates that description in **BYTES** (Rust `String::len`), not UTF-16 code units, and caps
 * it at 250. An em-dash costs 3 bytes. A tagline over the cap is silently truncated at a word
 * boundary, which is how several published NetScript packages ended up with descriptions cut
 * mid-sentence on jsr.io.
 *
 * This gate keeps taglines inside the cap so they land whole on first publish. The surplus belongs
 * in a SECOND paragraph: the extractor stops at the first blank line, so prose after it stays in the
 * README without ever reaching JSR.
 *
 * Usage:
 *   deno run --allow-read .llm/tools/validation/check-jsr-tagline-length.ts [--pretty] [paths...]
 *
 * Exit: 0 = every tagline fits; 1 = at least one is over the cap.
 */

import { expandGlob } from 'jsr:@std/fs/expand-glob';
import { relative } from 'jsr:@std/path';

/** JSR validates the description in bytes and rejects/truncates past this. */
export const DESCRIPTION_MAX_BYTES = 250;

const DEFAULT_GLOBS = ['packages/*/README.md', 'plugins/*/README.md'];

interface TaglineResult {
  readonly path: string;
  readonly bytes: number;
  readonly ok: boolean;
  readonly tagline: string;
}

/** True for an H1, a rule, or a line that is nothing but badge markup. */
function isSkippableHeaderLine(line: string): boolean {
  if (line.startsWith('#')) return true;
  if (line.startsWith('---') || line.startsWith('***') || line.startsWith('===')) return true;
  const withoutBadges = line
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .trim();
  return withoutBadges.length === 0;
}

/** Flatten inline markdown to the plain text JSR stores. */
function flattenMarkdown(text: string): string {
  return text.replace(/\*\*/g, '').replace(/`/g, '').replace(/\*/g, '').trim();
}

/**
 * Extract the tagline exactly as `jsr-set-package-settings.ts` does: the first prose paragraph after
 * the H1/badge block, joined and flattened, stopping at the first blank line.
 */
export function extractTagline(readme: string): string {
  const paragraph: string[] = [];
  for (const rawLine of readme.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (paragraph.length === 0) {
      if (line.length === 0 || isSkippableHeaderLine(line)) continue;
      paragraph.push(line);
      continue;
    }
    if (line.length === 0) break;
    paragraph.push(line);
  }
  return flattenMarkdown(paragraph.join(' '));
}

export function taglineBytes(readme: string): number {
  return new TextEncoder().encode(extractTagline(readme)).byteLength;
}

async function main(): Promise<void> {
  const args = Deno.args.filter((arg) => arg !== '--pretty');
  const pretty = Deno.args.includes('--pretty');
  const globs = args.length > 0 ? args : DEFAULT_GLOBS;

  const results: TaglineResult[] = [];
  for (const glob of globs) {
    for await (const entry of expandGlob(glob)) {
      if (!entry.isFile) continue;
      const readme = await Deno.readTextFile(entry.path);
      const tagline = extractTagline(readme);
      const bytes = new TextEncoder().encode(tagline).byteLength;
      results.push({
        path: relative(Deno.cwd(), entry.path).replaceAll('\\', '/'),
        bytes,
        ok: bytes <= DESCRIPTION_MAX_BYTES,
        tagline,
      });
    }
  }

  results.sort((left, right) => left.path.localeCompare(right.path));
  const over = results.filter((result) => !result.ok);

  if (pretty) {
    console.log(`JSR tagline length gate — cap ${DESCRIPTION_MAX_BYTES} bytes`);
    console.log(`  checked=${results.length} over=${over.length}`);
    for (const result of over) {
      console.log(`  ✗ ${result.path} — ${result.bytes} B (over by ${result.bytes - 250})`);
    }
    if (over.length === 0) console.log('  OK — every tagline lands whole on JSR.');
  } else {
    console.log(JSON.stringify({
      maxBytes: DESCRIPTION_MAX_BYTES,
      checked: results.length,
      over: over.length,
      violations: over.map(({ path, bytes }) => ({ path, bytes, overBy: bytes - 250 })),
    }));
  }

  if (over.length > 0) Deno.exit(1);
}

if (import.meta.main) await main();
