#!/usr/bin/env -S deno run --allow-read
/**
 * Internal-doc link / anchor / orphan checker (doc-maintenance gate, E1 / G-links).
 *
 * Keeps the internal/contributor documentation surface from silently rotting by
 * proving:
 *
 *   1. Every relative Markdown link [text](path) and [text](path#anchor) resolves
 *      to a file that exists on disk (enforced by default).
 *   2. Every #anchor fragment (same-file or cross-file) matches a heading slug
 *      in the target Markdown file (enforced by default).
 *   3. (opt-in, --check-orphans) No internal Markdown doc is unreachable: every
 *      doc under a root is referenced from another internal doc, counting both
 *      Markdown links AND backtick code-span path references (e.g. `gates/plan-gate.md`
 *      in a "Reference Files" table), which is how harness/doctrine docs actually
 *      cross-reference. Orphans are opt-in because reference style varies widely.
 *
 * Scope: internal/contributor docs only -- the harness (.llm/harness/),
 * architecture doctrine (docs/architecture/doctrine/), agent-skill source
 * (.agents/skills/), and the root agent-surface files (AGENTS.md, CLAUDE.md,
 * README.md, CONTRIBUTING.md). It deliberately does NOT scan the generated
 * .claude/skills/ mirror (regenerated from .agents/skills/; staleness is the job
 * of `deno task agentic:sync-claude:check`) or the user/external doc site.
 *
 * External links (http(s)://, mailto:) are skipped. Relative link targets are
 * always existence-checked regardless of whether the target lives under a scanned
 * root -- so a source doc that links to a never-created out-of-scope file IS
 * flagged as a broken link rather than silently skipped.
 *
 * Usage:
 *   deno run --allow-read .llm/tools/validation/check-internal-doc-links.ts --pretty
 *   deno run --allow-read .llm/tools/validation/check-internal-doc-links.ts --check-orphans --pretty
 *   deno run --allow-read .llm/tools/validation/check-internal-doc-links.ts --json
 *   deno run --allow-read .llm/tools/validation/check-internal-doc-links.ts --root .llm/harness --pretty
 *
 * Exit code: 0 when no enforced violation is found, 1 otherwise. Broken links and
 * broken anchors are always enforced; orphans are enforced only with --check-orphans.
 * This is wired into `deno task docs:maintenance` alongside the skill-mirror
 * staleness check (agentic:sync-claude:check) and the Claude-surface check
 * (agentic:check-claude).
 */
import { walk } from 'jsr:@std/fs@^1.0.0/walk';
import { parseArgs } from 'jsr:@std/cli@^1.0.0/parse-args';
import { dirname, fromFileUrl, join, normalize, relative, resolve } from 'jsr:@std/path@^1.0.0';

const args = parseArgs(Deno.args, {
  string: ['root'],
  boolean: ['pretty', 'json', 'help', 'check-orphans'],
  collect: ['root'],
  default: { pretty: false, json: false, help: false, 'check-orphans': false },
});

if (args.help) {
  console.log(
    [
      'Internal-doc link / anchor / orphan checker',
      '',
      'Usage:',
      '  deno run --allow-read .llm/tools/validation/check-internal-doc-links.ts [options]',
      '',
      'Options:',
      '  --root <path>     Doc root to scan (repeatable). Defaults to the internal',
      '                    doc roots: .llm/harness, docs/architecture/doctrine,',
      '                    .agents/skills, plus root agent-surface *.md files.',
      '  --check-orphans   Also fail on docs never referenced by another internal doc.',
      '  --json            Emit a structured JSON report.',
      '  --pretty          Human-readable report (default when neither flag set).',
      '  --help            Show this help.',
    ].join('\n'),
  );
  Deno.exit(0);
}

function norm(p: string): string {
  return normalize(p).replaceAll('\\', '/');
}

// Repo root = two levels up from this file (.llm/tools/<file>).
const REPO_ROOT = resolve(dirname(fromFileUrl(import.meta.url)), '..', '..');

// Default internal doc roots (scanned recursively) plus the explicit root-level
// agent-surface files. The generated .claude/skills/ mirror is excluded.
const DEFAULT_DIR_ROOTS = [
  '.llm/harness',
  'docs/architecture/doctrine',
  '.agents/skills',
];
const ROOT_SURFACE_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  'CONTRIBUTING.md',
];

// Docs allowed to be unreferenced (navigation entry points / well-known roots).
const ORPHAN_EXEMPT = new Set(
  [
    'AGENTS.md',
    'CLAUDE.md',
    'README.md',
    'CONTRIBUTING.md',
    'CODE_OF_CONDUCT.md',
    'SECURITY.md',
    '.llm/harness/README.md',
    'docs/architecture/doctrine/README.md',
  ].map((p) => norm(p)),
);

interface Finding {
  kind: 'broken-link' | 'broken-anchor' | 'orphan';
  source: string;
  detail: string;
  target?: string;
  line?: number;
}

async function exists(absPath: string): Promise<boolean> {
  try {
    await Deno.stat(absPath);
    return true;
  } catch {
    return false;
  }
}

/** GitHub-style heading slug (lowercase, strip punctuation, spaces to dashes). */
function slugify(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/[^\w\- ]+/g, '')
    .replace(/\s+/g, '-');
}

function headingSlugs(text: string): Set<string> {
  const slugs = new Set<string>();
  const counts = new Map<string, number>();
  let inFence = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^#{1,6}\s+(.*?)\s*#*\s*$/);
    if (!m) continue;
    const base = slugify(m[1]);
    if (!base) continue;
    const n = counts.get(base) ?? 0;
    counts.set(base, n + 1);
    slugs.add(n === 0 ? base : `${base}-${n}`);
  }
  return slugs;
}

// Markdown inline link: [text](target) -- capture the target only.
const LINK_RE = /\[(?:[^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
// Backtick code-span that looks like a relative doc path (a/b.md or a/b/).
const CODESPAN_PATH_RE = /`([\w./-]+\.(?:md|ts|tsx))`/g;

async function collectDocs(roots: string[]): Promise<string[]> {
  const docs = new Set<string>();
  for (const root of roots) {
    const abs = join(REPO_ROOT, root);
    if (!(await exists(abs))) continue;
    const stat = await Deno.stat(abs);
    if (stat.isFile) {
      if (root.toLowerCase().endsWith('.md')) docs.add(norm(root));
      continue;
    }
    for await (
      const entry of walk(abs, {
        match: [/\.md$/i],
        skip: [/node_modules/, /\.git/],
      })
    ) {
      docs.add(norm(relative(REPO_ROOT, entry.path)));
    }
  }
  return [...docs].sort();
}

function isExternal(target: string): boolean {
  return /^(?:https?:|mailto:|tel:|data:)/i.test(target) || target.startsWith('//');
}

async function main(): Promise<void> {
  const explicitRoots = (args.root as string[] | undefined) ?? [];
  const useDefaults = explicitRoots.length === 0;
  const roots = useDefaults ? [...DEFAULT_DIR_ROOTS, ...ROOT_SURFACE_FILES] : explicitRoots;
  const checkOrphans = args['check-orphans'] as boolean;

  const docs = await collectDocs(roots);
  const docSet = new Set(docs);
  const findings: Finding[] = [];
  const referenced = new Set<string>();

  const slugCache = new Map<string, Set<string>>();
  const textCache = new Map<string, string>();
  async function getText(repoRel: string): Promise<string> {
    let t = textCache.get(repoRel);
    if (t === undefined) {
      t = await Deno.readTextFile(join(REPO_ROOT, repoRel));
      textCache.set(repoRel, t);
    }
    return t;
  }
  async function getSlugs(repoRel: string): Promise<Set<string>> {
    let s = slugCache.get(repoRel);
    if (!s) {
      s = headingSlugs(await getText(repoRel));
      slugCache.set(repoRel, s);
    }
    return s;
  }

  // Mark an in-scope doc as referenced, resolving a code-span path against both the
  // doc's directory and every doc root (harness docs cite siblings by bare name).
  function markCodeSpanRef(docDir: string, rel: string): void {
    const candidates = new Set<string>([norm(join(docDir, rel))]);
    for (const r of [...DEFAULT_DIR_ROOTS, '.']) candidates.add(norm(join(r, rel)));
    candidates.add(norm(rel));
    for (const c of candidates) if (docSet.has(c)) referenced.add(c);
  }

  for (const doc of docs) {
    const text = await getText(doc);
    const docDir = dirname(doc);
    const lines = text.split(/\r?\n/);
    let inFence = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;

      // Code-span path references count toward reachability (orphan detection).
      CODESPAN_PATH_RE.lastIndex = 0;
      let cs: RegExpExecArray | null;
      while ((cs = CODESPAN_PATH_RE.exec(line)) !== null) markCodeSpanRef(docDir, cs[1]);

      LINK_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = LINK_RE.exec(line)) !== null) {
        const raw = m[1];
        if (!raw || isExternal(raw)) continue;

        const hashIndex = raw.indexOf('#');
        const pathPart = hashIndex === -1 ? raw : raw.slice(0, hashIndex);
        const anchor = hashIndex === -1 ? '' : raw.slice(hashIndex + 1);

        if (pathPart === '') {
          if (!anchor) continue;
          const slugs = await getSlugs(doc);
          if (!slugs.has(anchor)) {
            findings.push({
              kind: 'broken-anchor',
              source: doc,
              detail: `same-file anchor #${anchor} has no matching heading`,
              line: i + 1,
            });
          }
          continue;
        }

        // A leading "/" denotes a repo-root-relative link; resolve it from the
        // repo root rather than the doc's directory (join() would otherwise nest
        // it under docDir and mis-report a broken link).
        const targetRel = pathPart.startsWith('/')
          ? norm(pathPart.slice(1))
          : norm(join(docDir, pathPart));
        const targetAbs = join(REPO_ROOT, targetRel);

        if (!(await exists(targetAbs))) {
          findings.push({
            kind: 'broken-link',
            source: doc,
            target: targetRel,
            detail: 'link target does not exist',
            line: i + 1,
          });
          continue;
        }

        if (docSet.has(targetRel)) referenced.add(targetRel);

        if (anchor && docSet.has(targetRel)) {
          const slugs = await getSlugs(targetRel);
          if (!slugs.has(anchor)) {
            findings.push({
              kind: 'broken-anchor',
              source: doc,
              target: targetRel,
              detail: `anchor #${anchor} has no matching heading in target`,
              line: i + 1,
            });
          }
        }
      }
    }
  }

  if (checkOrphans) {
    for (const doc of docs) {
      if (referenced.has(doc)) continue;
      if (ORPHAN_EXEMPT.has(norm(doc))) continue;
      // Skill source SKILL.md files are surface entry points discovered by name.
      if (/^\.agents\/skills\/[^/]+\/SKILL\.md$/.test(doc)) continue;
      findings.push({
        kind: 'orphan',
        source: doc,
        detail: 'doc is not referenced (link or code-span path) by any other internal doc',
      });
    }
  }

  const summary = {
    rootsScanned: roots,
    docsScanned: docs.length,
    checkOrphans,
    totals: {
      brokenLinks: findings.filter((f) => f.kind === 'broken-link').length,
      brokenAnchors: findings.filter((f) => f.kind === 'broken-anchor').length,
      orphans: findings.filter((f) => f.kind === 'orphan').length,
    },
    findings,
  };

  if (args.json) {
    console.log(JSON.stringify(summary, null, args.pretty ? 2 : undefined));
  } else {
    console.log('# Internal-doc link / anchor / orphan check');
    console.log(
      `  docs=${summary.docsScanned} broken-links=${summary.totals.brokenLinks} ` +
        `broken-anchors=${summary.totals.brokenAnchors} orphans=${summary.totals.orphans}` +
        `${checkOrphans ? '' : ' (orphans informational; pass --check-orphans to enforce)'}`,
    );
    for (const f of findings) {
      const loc = f.line ? `:${f.line}` : '';
      const tgt = f.target ? ` -> ${f.target}` : '';
      console.log(`  ${f.kind.toUpperCase()} ${f.source}${loc}${tgt}: ${f.detail}`);
    }
    if (findings.length === 0) {
      console.log('  OK - no broken links, anchors, or orphans.');
    }
  }

  // Enforced: broken links + anchors always; orphans only with --check-orphans.
  let failures = summary.totals.brokenLinks + summary.totals.brokenAnchors;
  if (checkOrphans) failures += summary.totals.orphans;
  if (failures > 0) Deno.exit(1);
}

await main();
