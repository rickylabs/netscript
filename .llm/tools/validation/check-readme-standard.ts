/**
 * check-readme-standard.ts - A2 / US-9 README conformance gate.
 *
 * Validates that every publishable unit README.md follows the single
 * standardized shape captured in docs/site/_includes/readme-template.md.
 *
 * A conformant README MUST contain, in any order:
 *   1. An H1 title line starting with "# @netscript/" (the JSR package name).
 *   2. An "## Install" section whose body contains the literal
 *      "deno add jsr:@netscript/".
 *   3. A "## Quick example" OR "## Quick start" section, with at least one
 *      fenced code block after it.
 *   4. A "## Docs" OR "## Documentation" section whose body contains at least
 *      one Markdown link [text](url).
 *
 * Single responsibility: structural conformance of unit READMEs. It does not
 * lint prose or verify link targets resolve (link-checking is a separate gate).
 *
 * Usage:
 *   deno run --no-lock --allow-read .llm/tools/validation/check-readme-standard.ts [paths...] [--pretty] [--json] [--help]
 *
 * With no path arguments it scans the default glob set:
 *   packages/<star>/README.md and plugins/<star>/README.md
 *
 * Exit codes: 0 = all conform; 1 = at least one non-conformant.
 * Read-only: safe as a CI gate (--allow-read only).
 */

import { expandGlob } from 'jsr:@std/fs/expand-glob';
import { relative } from 'jsr:@std/path';

interface Args {
  paths: string[];
  pretty: boolean;
  json: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const paths: string[] = [];
  let pretty = false;
  let json = false;
  let help = false;
  for (const arg of argv) {
    if (arg === '--pretty') pretty = true;
    else if (arg === '--json') json = true;
    else if (arg === '--help' || arg === '-h') help = true;
    else if (arg.startsWith('--')) {
      console.error('Unknown flag: ' + arg);
      Deno.exit(2);
    } else paths.push(arg);
  }
  return { paths, pretty, json, help };
}

const HELP = [
  'check-readme-standard.ts - A2 / US-9 README conformance gate.',
  '',
  'Usage:',
  '  deno run --no-lock --allow-read .llm/tools/validation/check-readme-standard.ts [paths...] [flags]',
  '',
  'Arguments:',
  '  paths     One or more README.md paths. Default: packages/*/README.md + plugins/*/README.md.',
  '',
  'Flags:',
  '  --pretty  Human-readable output.',
  '  --json    Emit a JSON report.',
  '  --help    Show this help.',
  '',
  'Conformance rules (all required per README):',
  "  1. H1 title starting with '# @netscript/'.",
  "  2. '## Install' section containing 'deno add jsr:@netscript/'.",
  "  3. '## Quick example' or '## Quick start' section with a fenced code block.",
  "  4. '## Docs' or '## Documentation' section with at least one Markdown link.",
  '',
  'Exit: 0 = all conform; 1 = non-conformant README; 2 = bad usage.',
].join('\n');

export interface ReadmeViolation {
  rule: string;
  message: string;
}

interface UnitResult {
  path: string;
  ok: boolean;
  violations: ReadmeViolation[];
}

/** Split a Markdown body into sections keyed by H2 heading text (lowercased, trimmed). */
function sectionBodies(lines: string[]): Map<string, string> {
  const sections = new Map<string, string>();
  let current: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (current !== null) sections.set(current, buf.join('\n'));
  };
  for (const line of lines) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) {
      flush();
      current = m[1].toLowerCase();
      buf = [];
    } else if (current !== null) {
      buf.push(line);
    }
  }
  flush();
  return sections;
}

function getSection(sections: Map<string, string>, ...names: string[]): string | null {
  for (const name of names) {
    const body = sections.get(name.toLowerCase());
    if (body !== undefined) return body;
  }
  return null;
}

const FENCE_RE = /```[\s\S]*?```/;
const LINK_RE = /\[[^\]]+\]\([^)]+\)/;

export function validateReadmeStandard(text: string): ReadmeViolation[] {
  const violations: ReadmeViolation[] = [];
  const lines = text.split(/\r?\n/);

  const h1 = lines.find((l) => /^#\s+/.test(l));
  if (!h1 || !/^#\s+@netscript\//.test(h1.trim())) {
    violations.push({
      rule: 'h1-title',
      message: "missing H1 title starting with '# @netscript/'",
    });
  }

  const sections = sectionBodies(lines);

  const install = getSection(sections, 'Install', 'Installation');
  if (install === null) {
    violations.push({ rule: 'install-section', message: "missing '## Install' section" });
  } else if (!install.includes('deno add jsr:@netscript/')) {
    violations.push({
      rule: 'install-command',
      message: "'## Install' section missing 'deno add jsr:@netscript/'",
    });
  }

  const quick = getSection(sections, 'Quick example', 'Quick start');
  if (quick === null) {
    violations.push({
      rule: 'quick-section',
      message: "missing '## Quick example' (or '## Quick start') section",
    });
  } else if (!FENCE_RE.test(quick)) {
    violations.push({
      rule: 'quick-code-block',
      message: "'## Quick example' section missing a fenced code block",
    });
  }

  const docs = getSection(sections, 'Docs', 'Documentation');
  if (docs === null) {
    violations.push({
      rule: 'docs-section',
      message: "missing '## Docs' (or '## Documentation') section",
    });
  } else if (!LINK_RE.test(docs)) {
    violations.push({
      rule: 'docs-link',
      message: "'## Docs' section missing at least one Markdown link",
    });
  }

  return violations;
}

async function resolvePaths(args: Args): Promise<string[]> {
  if (args.paths.length > 0) return args.paths;
  const found: string[] = [];
  for (const glob of ['packages/*/README.md', 'plugins/*/README.md']) {
    for await (const entry of expandGlob(glob, { root: Deno.cwd() })) {
      if (entry.isFile) found.push(relative(Deno.cwd(), entry.path).replaceAll('\\', '/'));
    }
  }
  return found.sort();
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args);
  if (args.help) {
    console.log(HELP);
    Deno.exit(0);
  }

  const paths = await resolvePaths(args);
  const results: UnitResult[] = [];

  for (const path of paths) {
    let text: string;
    try {
      text = await Deno.readTextFile(path);
    } catch {
      results.push({
        path,
        ok: false,
        violations: [{ rule: 'missing-file', message: 'README.md not found' }],
      });
      continue;
    }
    const violations = validateReadmeStandard(text);
    results.push({ path, ok: violations.length === 0, violations });
  }

  const failed = results.filter((r) => !r.ok);
  const ok = failed.length === 0;
  const report = {
    gate: 'A2',
    ok,
    scanned: results.length,
    nonConformant: failed.length,
    results,
  };

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else if (args.pretty) {
    if (results.length === 0) {
      console.log('A2 README standard - no README.md files matched.');
    } else if (ok) {
      console.log('A2 README standard OK - ' + results.length + ' README(s) conform.');
    } else {
      console.error(
        'A2 README standard FAIL - ' + failed.length + '/' + results.length + ' non-conformant:',
      );
      for (const r of failed) {
        console.error('  ' + r.path);
        for (const v of r.violations) console.error('    - [' + v.rule + '] ' + v.message);
      }
    }
  } else {
    console.log(JSON.stringify(report));
  }

  Deno.exit(ok ? 0 : 1);
}

if (import.meta.main) await main();
