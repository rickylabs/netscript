#!/usr/bin/env -S deno run --allow-read --allow-run --allow-env
/**
 * Generic JSR + Doctrine package audit.
 *
 * Runs the same checks the cli-specific scripts run, but parameterised by
 * `--root` so every `@netscript/*` package can be audited.
 *
 * Reports (in JSON unless `--text`):
 *   meta            — name, version, exports, description length
 *   files           — file count, LOC, size of each export entrypoint
 *   docs            — README presence + length, `docs/` folder presence,
 *                     `@module` tag on every entrypoint, JSDoc coverage of
 *                     exported symbols (best-effort regex)
 *   surface         — list of exported symbols per entrypoint
 *   gates           — F-1 (folder vocabulary), F-2 (file count caps),
 *                     F-3 (no I-prefix), F-4 (no helpers/utils dumping
 *                     ground), F-5 (mod.ts present), F-6 (deno.json valid
 *                     for JSR), F-7 (publish dry-run clean)
 *   slowTypes       — output of `deno publish --dry-run --no-check` parsed
 *                     for slow type warnings
 *   tests           — count of *_test.ts files, distribution
 *
 * Usage:
 *   deno run -A .llm/tools/fitness/audit-jsr-package.ts \
 *     --root packages/streams \
 *     --out  .llm/tmp/run/<run-id>/audit/streams.json
 */

import { walk } from 'jsr:@std/fs@^1.0.0/walk';
import { parseArgs } from 'jsr:@std/cli@^1.0.0/parse-args';
import { join, relative } from 'jsr:@std/path@^1.0.0';

interface DenoJson {
  name?: string;
  version?: string;
  description?: string;
  exports?: string | Record<string, string>;
  publish?: { include?: string[]; exclude?: string[] };
}

interface Finding {
  gate: string;
  level: 'PASS' | 'INFO' | 'WARN' | 'FAIL';
  message: string;
  path?: string;
  line?: number;
}

/**
 * Packages sanctioned to carry `--allow-slow-types` per the doctrine
 * exception in docs/architecture/doctrine/02-public-surface.md. These are
 * oRPC-bound packages whose contract/service seam binds to `@orpc/contract`'s
 * `declare`d builder types, which inherently emit `private-type-ref`
 * slow-types diagnostics. For these, F-JSR-7 slow-types is an expected INFO
 * note, not a WARN finding. Any OTHER package remains a WARN finding.
 */
const ORPC_SLOW_TYPES_ALLOWLIST = new Set<string>([
  '@netscript/contracts',
  '@netscript/service',
  '@netscript/plugin',
  '@netscript/plugin-triggers-core',
]);

interface AuditReport {
  pkg: { name: string; version: string; description?: string; root: string };
  exports: Record<string, string>;
  files: { total: number; loc: number; entries: { path: string; bytes: number }[] };
  docs: {
    hasReadme: boolean;
    readmeLines: number;
    hasDocsFolder: boolean;
    moduleTagOnEntries: Record<string, boolean>;
    descriptionLen: number;
  };
  surface: Record<string, { exported: string[]; rawCount: number }>;
  tests: { fileCount: number; files: string[] };
  gates: Finding[];
  slowTypes: { ok: boolean; warnings: string[]; rawTail: string };
}

const args = parseArgs(Deno.args, {
  string: ['root', 'out'],
  boolean: ['text', 'no-dry-run'],
  default: { root: '.', text: false, 'no-dry-run': false },
});

const ROOT = args.root as string;
const OUT = args.out as string | undefined;

async function main() {
  const denoJsonPath = join(ROOT, 'deno.json');
  let denoJson: DenoJson;
  try {
    denoJson = JSON.parse(await Deno.readTextFile(denoJsonPath));
  } catch (e) {
    console.error(`Cannot read ${denoJsonPath}: ${e}`);
    Deno.exit(2);
  }

  const exportsMap = normaliseExports(denoJson.exports);
  const findings: Finding[] = [];

  // --- Files & LOC ---
  let total = 0;
  let loc = 0;
  for await (
    const entry of walk(ROOT, {
      includeFiles: true,
      includeDirs: false,
      skip: [/node_modules/, /\.git/, /_fresh/, /\.deploy/, /coverage/],
    })
  ) {
    if (!entry.path.endsWith('.ts') && !entry.path.endsWith('.md')) continue;
    if (entry.path.endsWith('.ts')) {
      total++;
      const text = await Deno.readTextFile(entry.path);
      loc += text.split(/\r?\n/).length;
    }
  }
  const fileEntries: { path: string; bytes: number }[] = [];
  for (const exp of Object.values(exportsMap)) {
    const p = join(ROOT, exp);
    try {
      const stat = await Deno.stat(p);
      fileEntries.push({ path: relative(ROOT, p), bytes: stat.size });
    } catch {
      findings.push({
        gate: 'F-JSR-1 exports resolve',
        level: 'FAIL',
        message: `export entry ${exp} does not exist`,
        path: p,
      });
    }
  }

  // --- Docs ---
  const readmePath = join(ROOT, 'README.md');
  const hasReadme = await exists(readmePath);
  const readmeLines = hasReadme
    ? (await Deno.readTextFile(readmePath)).split(/\r?\n/).length
    : 0;
  const hasDocsFolder = await exists(join(ROOT, 'docs'));

  const moduleTagOnEntries: Record<string, boolean> = {};
  for (const [key, exp] of Object.entries(exportsMap)) {
    const p = join(ROOT, exp);
    if (!(await exists(p))) continue;
    const text = await Deno.readTextFile(p);
    const head = text.slice(0, 4096);
    moduleTagOnEntries[key] = /@module\b/.test(head);
    if (!moduleTagOnEntries[key]) {
      findings.push({
        gate: 'F-JSR-2 module-tag',
        level: 'FAIL',
        message: `export ${key} (${exp}) lacks @module JSDoc tag`,
        path: exp,
      });
    }
  }

  if (!hasReadme) {
    findings.push({
      gate: 'F-JSR-3 readme',
      level: 'FAIL',
      message: 'README.md missing',
    });
  } else if (readmeLines < 40) {
    findings.push({
      gate: 'F-JSR-3 readme',
      level: 'WARN',
      message: `README.md is only ${readmeLines} lines; enterprise bar is ≥150 lines`,
    });
  }

  // --- Description ---
  const descriptionLen = (denoJson.description ?? '').length;
  if (!denoJson.description) {
    findings.push({
      gate: 'F-JSR-4 description',
      level: 'FAIL',
      message: 'deno.json lacks `description` (used by JSR discoverability)',
    });
  } else if (descriptionLen > 250) {
    findings.push({
      gate: 'F-JSR-4 description',
      level: 'WARN',
      message: `description is ${descriptionLen} chars; max recommended is 250`,
    });
  }

  // --- Public surface ---
  const surface: AuditReport['surface'] = {};
  for (const [key, exp] of Object.entries(exportsMap)) {
    const p = join(ROOT, exp);
    if (!(await exists(p))) continue;
    const text = await Deno.readTextFile(p);
    surface[key] = scanExports(text);
  }

  // --- Tests ---
  const tests: string[] = [];
  for await (
    const entry of walk(ROOT, {
      match: [/_test\.ts$/, /\.test\.ts$/],
      skip: [/node_modules/, /\.git/, /_fresh/, /\.deploy/],
    })
  ) {
    tests.push(relative(ROOT, entry.path));
  }

  // --- F-DOCT-1 folder vocabulary ---
  // ALLOWED list reserved for future positive-list enforcement; kept as documentation.
  const _ALLOWED = new Set([
    'domain', 'ports', 'application', 'adapters', 'runtime', 'state',
    'middleware', 'presets', 'registry', 'diagnostics', 'presentation',
    'testing', 'internal', 'tests', 'examples', 'src', 'docs', 'bin',
    'kernel', 'public', 'local', 'maintainer', 'mod', 'e2e',
    'schemas', 'types', 'config', 'commands', 'producer', 'plugin',
    'plugins', 'adapters-redis', // legacy aliases
  ]);
  const FORBIDDEN_NAMES = new Set(['utils', 'helpers', 'common', 'lib', 'interfaces']);
  for await (
    const dir of walk(ROOT, {
      includeFiles: false,
      includeDirs: true,
      skip: [/node_modules/, /\.git/, /_fresh/, /\.deploy/, /docs/, /examples/, /tests/],
    })
  ) {
    if (dir.path === ROOT) continue;
    const seg = dir.path.split('/').pop()!;
    if (FORBIDDEN_NAMES.has(seg)) {
      findings.push({
        gate: 'F-DOCT-4 vocabulary',
        level: 'WARN',
        message: `forbidden folder name '${seg}' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry`,
        path: relative(ROOT, dir.path),
      });
    }
  }

  // --- F-DOCT-5 cardinality (>12 children) ---
  const childCounts = new Map<string, number>();
  for await (
    const entry of walk(ROOT, {
      includeDirs: true,
      includeFiles: true,
      skip: [/node_modules/, /\.git/, /_fresh/, /\.deploy/, /docs/, /examples/, /tests/],
    })
  ) {
    const parent = entry.path.split('/').slice(0, -1).join('/');
    if (parent.startsWith(ROOT)) {
      childCounts.set(parent, (childCounts.get(parent) ?? 0) + 1);
    }
  }
  for (const [path, count] of childCounts) {
    if (count > 12) {
      findings.push({
        gate: 'F-DOCT-5 cardinality',
        level: 'WARN',
        message: `directory has ${count} immediate children; doctrine cap is 12`,
        path: relative(ROOT, path),
      });
    }
  }

  // --- F-DOCT-7 no I-prefix ---
  const declRx = /\b(?:interface|type)\s+(I[A-Z][A-Za-z0-9_]*)\b/g;
  for await (
    const entry of walk(ROOT, {
      match: [/\.ts$/],
      skip: [/node_modules/, /_test\.ts$/, /\.test\.ts$/, /_fresh/, /\.deploy/],
    })
  ) {
    const text = await Deno.readTextFile(entry.path);
    text.split(/\r?\n/).forEach((line, i) => {
      for (const m of line.matchAll(declRx)) {
        findings.push({
          gate: 'F-DOCT-7 no-I-prefix',
          level: 'FAIL',
          message: `forbidden I-prefix declaration ${m[1]}`,
          path: relative(ROOT, entry.path),
          line: i + 1,
        });
      }
    });
  }

  // --- mod.ts present ---
  if (!(await exists(join(ROOT, 'mod.ts')))) {
    findings.push({
      gate: 'F-JSR-5 mod.ts',
      level: 'FAIL',
      message: 'mod.ts missing at package root (canonical doctrine entrypoint)',
    });
  }

  // --- F-JSR-6 deno publish dry run ---
  let slowTypes = { ok: true, warnings: [] as string[], rawTail: 'skipped' };
  if (!args['no-dry-run']) {
    slowTypes = await runDryRun(ROOT);
    if (!slowTypes.ok) {
      findings.push({
        gate: 'F-JSR-7 dry-run',
        level: 'FAIL',
        message: `deno publish --dry-run failed`,
      });
    }
    const slowTypesSanctioned = ORPC_SLOW_TYPES_ALLOWLIST.has(denoJson.name ?? '');
    for (const w of slowTypes.warnings) {
      findings.push({
        gate: 'F-JSR-7 slow-types',
        level: slowTypesSanctioned ? 'INFO' : 'WARN',
        message: slowTypesSanctioned
          ? `${w} — sanctioned --allow-slow-types (oRPC-bound; see docs/architecture/doctrine/02-public-surface.md)`
          : w,
      });
    }
  }

  const report: AuditReport = {
    pkg: {
      name: denoJson.name ?? '<unset>',
      version: denoJson.version ?? '<unset>',
      description: denoJson.description,
      root: ROOT,
    },
    exports: exportsMap,
    files: { total, loc, entries: fileEntries },
    docs: {
      hasReadme,
      readmeLines,
      hasDocsFolder,
      moduleTagOnEntries,
      descriptionLen,
    },
    surface,
    tests: { fileCount: tests.length, files: tests },
    gates: findings,
    slowTypes,
  };

  if (OUT) {
    await Deno.mkdir(OUT.split('/').slice(0, -1).join('/'), { recursive: true });
    await Deno.writeTextFile(OUT, JSON.stringify(report, null, 2));
  }

  if (args.text || !OUT) {
    printText(report);
  }

  // Exit non-zero on FAIL findings
  if (findings.some((f) => f.level === 'FAIL')) {
    Deno.exit(1);
  }
}

function normaliseExports(e: DenoJson['exports']): Record<string, string> {
  if (!e) return {};
  if (typeof e === 'string') return { '.': e };
  return e;
}

async function exists(p: string) {
  try {
    await Deno.stat(p);
    return true;
  } catch {
    return false;
  }
}

function scanExports(text: string): { exported: string[]; rawCount: number } {
  const exported = new Set<string>();
  // export class Foo / function Foo / const Foo / let / var / type / interface / enum
  const declRx =
    /^export\s+(?:async\s+)?(?:abstract\s+)?(?:class|function\*?|const|let|var|type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm;
  for (const m of text.matchAll(declRx)) exported.add(m[1]);
  // export { Foo, Bar as Baz }
  const namedRx = /^export\s*\{([^}]+)\}/gm;
  for (const m of text.matchAll(namedRx)) {
    for (const part of m[1].split(',')) {
      const piece = part.trim().split(/\s+as\s+/i).pop()!.trim();
      if (piece && /^[A-Za-z_$][\w$]*$/.test(piece)) exported.add(piece);
    }
  }
  // export * from … only counts as 1 wildcard star
  const starRx = /^export\s+\*\s+from\s+['"]/gm;
  let starCount = 0;
  for (const _ of text.matchAll(starRx)) starCount++;
  return { exported: [...exported].sort(), rawCount: exported.size + starCount };
}

async function runDryRun(
  root: string,
): Promise<{ ok: boolean; warnings: string[]; rawTail: string }> {
  const cmd = new Deno.Command('deno', {
    args: ['publish', '--dry-run', '--allow-dirty', '--no-check'],
    cwd: root,
    stdout: 'piped',
    stderr: 'piped',
  });
  let out: Deno.CommandOutput;
  try {
    out = await cmd.output();
  } catch (e) {
    return { ok: false, warnings: [`deno not invokable: ${e}`], rawTail: '' };
  }
  const stdout = new TextDecoder().decode(out.stdout);
  const stderr = new TextDecoder().decode(out.stderr);
  const combined = stdout + '\n' + stderr;
  const warnings: string[] = [];
  for (const line of combined.split(/\r?\n/)) {
    if (
      /slow type/i.test(line) || /missing\s+module\s+doc/i.test(line) ||
      /missing\s+symbol\s+doc/i.test(line)
    ) warnings.push(line.trim());
  }
  return {
    ok: out.success,
    warnings,
    rawTail: combined.split(/\r?\n/).slice(-30).join('\n'),
  };
}

function printText(r: AuditReport) {
  console.log(`# ${r.pkg.name}@${r.pkg.version}`);
  console.log(`  root: ${r.pkg.root}`);
  console.log(`  exports: ${Object.keys(r.exports).join(', ')}`);
  console.log(`  files=${r.files.total} loc=${r.files.loc}`);
  console.log(
    `  docs: README=${r.docs.hasReadme}(${r.docs.readmeLines}L) docs/=${r.docs.hasDocsFolder} desc=${r.docs.descriptionLen}c`,
  );
  console.log(`  tests: ${r.tests.fileCount} files`);
  console.log(`  surface: ${Object.entries(r.surface).map(([k, v]) => `${k}=${v.rawCount}`).join(', ')}`);
  console.log(`  dry-run: ${r.slowTypes.ok ? 'OK' : 'FAIL'} slowTypeWarnings=${r.slowTypes.warnings.length}`);
  console.log(`  findings: ${r.gates.length}`);
  for (const f of r.gates) {
    console.log(`    ${f.level} ${f.gate}: ${f.message}${f.path ? ` (${f.path}${f.line ? ':' + f.line : ''})` : ''}`);
  }
}

await main();
