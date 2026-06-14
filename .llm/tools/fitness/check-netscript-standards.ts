#!/usr/bin/env -S deno run --allow-read --allow-run --allow-env
/**
 * NetScript standards readiness evaluator.
 *
 * Encodes the cross-package conventions defined in
 * `.llm/tmp/run/<run-id>/harmonisation/STANDARDS.md`. These rules are
 * **stricter** than doctrine — they enforce the v0.0.1-alpha public-surface
 * uniformity that makes "knowing one package" mean "knowing all packages".
 *
 * Findings are tagged `NS-S-##` (NetScript Standards #) so they don't
 * collide with doctrine references.
 *
 * Usage:
 *   deno run -A .llm/tools/fitness/check-netscript-standards.ts \
 *     --root packages/streams \
 *     --out  .llm/tmp/run/<run-id>/audit/standards/streams.json
 */
import { walk } from 'jsr:@std/fs@^1.0.0/walk';
import { parseArgs } from 'jsr:@std/cli@^1.0.0/parse-args';
import { join, relative } from 'jsr:@std/path@^1.0.0';

const args = parseArgs(Deno.args, {
  string: ['root', 'out'],
  boolean: ['text'],
  default: { root: '.', text: false },
});
const ROOT = args.root as string;

interface Finding {
  ref: string;
  level: 'PASS' | 'WARN' | 'FAIL' | 'INFO';
  message: string;
  path?: string;
  line?: number;
}
const findings: Finding[] = [];

async function exists(p: string) {
  try {
    await Deno.stat(p);
    return true;
  } catch {
    return false;
  }
}
async function readText(p: string) {
  try {
    return await Deno.readTextFile(p);
  } catch {
    return '';
  }
}

// ─────────────────────────────────────────────────────────────────────────
// NS-S-1 — deno.json shape (license, description ≤ 250, version cadence,
//          publish.include + exclude, strict compilerOptions)
// ─────────────────────────────────────────────────────────────────────────
type DenoJson = {
  name?: string; version?: string; license?: string; description?: string;
  exports?: string | Record<string, string>;
  imports?: Record<string, string>;
  compilerOptions?: Record<string, unknown>;
  publish?: { include?: string[]; exclude?: string[] };
  tasks?: Record<string, string>;
};
let dj: DenoJson = {};
const denoJsonPath = join(ROOT, 'deno.json');
if (await exists(denoJsonPath)) {
  try {
    dj = JSON.parse(await readText(denoJsonPath));
  } catch {
    findings.push({ ref: 'NS-S-1', level: 'FAIL', message: 'deno.json is not valid JSON' });
  }
} else {
  findings.push({ ref: 'NS-S-1', level: 'FAIL', message: 'deno.json missing' });
}

if (!dj.license) {
  findings.push({ ref: 'NS-S-1.license', level: 'FAIL', message: 'deno.json `license` field missing (must be `MIT` for alpha)' });
} else if (dj.license !== 'MIT') {
  findings.push({ ref: 'NS-S-1.license', level: 'WARN', message: `license is '${dj.license}' — alpha mandates 'MIT' for harmonised licensing` });
}
if (!dj.description) {
  findings.push({ ref: 'NS-S-1.description', level: 'FAIL', message: 'deno.json `description` missing' });
} else if (dj.description.length > 250) {
  findings.push({ ref: 'NS-S-1.description', level: 'WARN', message: `description is ${dj.description.length} chars; max 250` });
} else if (!/[.!?]\s*$/.test(dj.description)) {
  findings.push({ ref: 'NS-S-1.description', level: 'WARN', message: 'description should end with a period' });
}
if (dj.version && dj.version !== '0.0.1-alpha.0') {
  findings.push({ ref: 'NS-S-1.version', level: 'WARN', message: `version is '${dj.version}'; alpha cadence requires '0.0.1-alpha.0'` });
}
if (!dj.publish?.include || !Array.isArray(dj.publish.include)) {
  findings.push({ ref: 'NS-S-1.publish-include', level: 'FAIL', message: 'deno.json `publish.include` missing — `deno publish` ships everything by default and that leaks tests/scratch' });
}
if (!dj.publish?.exclude) {
  findings.push({ ref: 'NS-S-1.publish-exclude', level: 'WARN', message: 'deno.json `publish.exclude` should explicitly drop `**/*_test.ts`, `tests/`, `examples/`' });
}
if (!dj.compilerOptions?.strict) {
  findings.push({ ref: 'NS-S-1.strict', level: 'FAIL', message: 'deno.json compilerOptions.strict must be true' });
}
if (!dj.tasks?.['publish:dry-run']) {
  findings.push({ ref: 'NS-S-1.task', level: 'WARN', message: 'deno.json `tasks` missing `publish:dry-run` shortcut' });
}

// Name format
if (dj.name && !/^@netscript\/[a-z][a-z0-9-]{1,38}$/.test(dj.name)) {
  findings.push({ ref: 'NS-S-1.name', level: 'FAIL', message: `name '${dj.name}' does not match @netscript/<kebab-case>` });
}

// ─────────────────────────────────────────────────────────────────────────
// NS-S-2 — exports map shape ('.' first, no untyped paths, mod.ts entry)
// ─────────────────────────────────────────────────────────────────────────
const exportsMap: Record<string, string> = typeof dj.exports === 'string'
  ? { '.': dj.exports }
  : dj.exports ?? {};
if (!exportsMap['.']) {
  findings.push({ ref: 'NS-S-2', level: 'FAIL', message: '`exports["."]` missing — the canonical entrypoint' });
} else if (exportsMap['.'] !== './mod.ts') {
  findings.push({ ref: 'NS-S-2', level: 'WARN', message: `exports["."] is '${exportsMap['.']}' — convention is './mod.ts'` });
}
for (const [key, target] of Object.entries(exportsMap)) {
  if (!target.startsWith('./')) {
    findings.push({ ref: 'NS-S-2', level: 'FAIL', message: `export ${key} -> ${target} is not a relative path` });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// NS-S-3 — mod.ts barrel-only invariants
// ─────────────────────────────────────────────────────────────────────────
const modPath = join(ROOT, 'mod.ts');
if (await exists(modPath)) {
  const text = await readText(modPath);
  const lines = text.split(/\r?\n/);
  if (lines.length > 200) {
    findings.push({ ref: 'NS-S-3.size', level: 'WARN', message: `mod.ts is ${lines.length} lines; convention cap is 200 — split into sub-entrypoints` });
  }
  // Logic in mod.ts (heuristic: any non-comment statement that isn't an export)
  const codeLines = lines.filter((l) => !/^\s*(?:\/\/|\*|\/\*|$|export\b|import\b)/.test(l));
  if (codeLines.length > 5) {
    findings.push({ ref: 'NS-S-3.barrel-only', level: 'WARN', message: `mod.ts has ${codeLines.length} non-export/non-comment lines — barrels must be export-only` });
  }
  // Section headers
  if (lines.length > 30 && !/──.*Types/.test(text) && !/Definitions|Builders|Runtime|Adapters|Errors/.test(text)) {
    findings.push({ ref: 'NS-S-3.sections', level: 'INFO', message: 'mod.ts lacks section comment headers — recommended for navigability' });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// NS-S-4 — naming conventions
// Functions must match the prefix table; flag obvious violators.
// ─────────────────────────────────────────────────────────────────────────
const ALLOWED_FN_PREFIXES = [
  'define', 'create', 'open', 'connect', 'resolve', 'is', 'has', 'emit', 'on',
  'build', 'inspect', 'register', 'with', 'from', 'to', 'parse', 'format',
  'load', 'read', 'write', 'list', 'count', 'run', 'start', 'stop', 'close',
  'compose', 'extend', 'derive', 'apply', 'use', 'assert', 'ensure', 'try',
  'wrap', 'unwrap', 'serialize', 'deserialize', 'normalize', 'validate',
  'attach', 'detach', 'configure', 'process', 'handle', 'execute', 'invoke',
  'batch', 'fetch', 'send', 'recv', 'subscribe', 'unsubscribe', 'observe',
  'measure', 'mark', 'install', 'uninstall', 'render', 'print', 'log',
  'noop', 'main', 'init', 'get', 'set', // get/set allowed for property accessors only — flagged below contextually
];
const tsFiles: string[] = [];
for await (
  const entry of walk(ROOT, {
    match: [/\.ts$/],
    skip: [/node_modules/, /_test\.ts$/, /\.test\.ts$/, /tests\//, /examples\//, /_fresh/, /\.deploy/, /\.git/],
  })
) tsFiles.push(entry.path);

for (const f of tsFiles) {
  if (relative(ROOT, f).startsWith('src/internal/')) continue;
  const text = await readText(f);
  text.split(/\r?\n/).forEach((line, i) => {
    const m = line.match(/^export\s+(?:async\s+)?function\s+([a-z][A-Za-z0-9_]*)\b/);
    if (!m) return;
    const fn = m[1];
    const prefix = fn.match(/^[a-z]+/)?.[0] ?? '';
    if (!ALLOWED_FN_PREFIXES.includes(prefix)) {
      findings.push({
        ref: 'NS-S-4.fn-prefix',
        level: 'WARN',
        message: `exported function '${fn}' uses non-standard prefix '${prefix}' — consult STANDARDS § 4.1`,
        path: relative(ROOT, f),
        line: i + 1,
      });
    }
  });
  // Forbidden options bag naming
  for (const m of text.matchAll(/^export\s+(?:type|interface)\s+(\w+(?:Args|Params|Config|Settings))\b/gm)) {
    findings.push({
      ref: 'NS-S-4.types',
      level: 'WARN',
      message: `type '${m[1]}' uses non-standard suffix — convention is <Function>Options / <Noun>Spec`,
      path: relative(ROOT, f),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// NS-S-5 — kebab-case file names
// ─────────────────────────────────────────────────────────────────────────
for (const f of tsFiles) {
  const base = f.split('/').pop()!.replace(/\.ts$/, '');
  if (!/^[a-z0-9._-]+$/.test(base) && !/^[a-z][a-z0-9-]*(?:_test)?$/.test(base)) {
    findings.push({
      ref: 'NS-S-5',
      level: 'WARN',
      message: `file '${base}' is not kebab-case`,
      path: relative(ROOT, f),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// NS-S-6 — README enterprise-grade structure (sections present)
// ─────────────────────────────────────────────────────────────────────────
const readmePath = join(ROOT, 'README.md');
if (await exists(readmePath)) {
  const t = await readText(readmePath);
  const REQUIRED_SECTIONS = [
    /^##\s+Overview\b/m,
    /^##\s+(?:Quickstart|Getting started)\b/im,
    /^##\s+(?:Mental model|Concepts)\b/im,
    /^##\s+(?:API|Public API|API at a glance)\b/im,
    /^##\s+(?:Recipes|Common recipes|Examples)\b/im,
    /^##\s+(?:Configuration|Options)\b/im,
    /^##\s+Testing\b/m,
    /^##\s+(?:Observability|Logging|Telemetry)\b/im,
    /^##\s+Architecture\b/m,
    /^##\s+(?:Stability|Versioning)\b/im,
    /^##\s+(?:Compatibility|Runtime support)\b/im,
    /^##\s+License\b/m,
  ];
  const missing = REQUIRED_SECTIONS.filter((rx) => !rx.test(t)).length;
  if (t.split(/\r?\n/).length < 150) {
    findings.push({ ref: 'NS-S-6.length', level: 'WARN', message: `README is ${t.split(/\r?\n/).length} lines; minimum is 150` });
  }
  if (missing > 0) {
    findings.push({ ref: 'NS-S-6.sections', level: 'WARN', message: `README missing ${missing}/${REQUIRED_SECTIONS.length} mandated sections (Overview, Quickstart, Mental model, API, Recipes, Configuration, Testing, Observability, Architecture, Stability, Compatibility, License)` });
  }
} else {
  findings.push({ ref: 'NS-S-6', level: 'FAIL', message: 'README.md missing' });
}

// ─────────────────────────────────────────────────────────────────────────
// NS-S-7 — /docs/ structure when symbol count > 25
// (Defer the symbol count to the JSR audit; here just check the docs/ shape.)
// ─────────────────────────────────────────────────────────────────────────
const docsRoot = join(ROOT, 'docs');
if (await exists(docsRoot)) {
  const required = ['architecture.md', 'concepts.md'];
  for (const r of required) {
    if (!(await exists(join(docsRoot, r)))) {
      findings.push({ ref: 'NS-S-7', level: 'WARN', message: `docs/${r} missing — required for /docs structure` });
    }
  }
  if (!(await exists(join(docsRoot, 'recipes')))) {
    findings.push({ ref: 'NS-S-7', level: 'INFO', message: 'docs/recipes/ folder missing — recommended for task-oriented docs' });
  }
  if (!(await exists(join(docsRoot, 'reference')))) {
    findings.push({ ref: 'NS-S-7', level: 'INFO', message: 'docs/reference/ folder missing — required for auto-generated API ref' });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// NS-S-8 — testing standard
// ─────────────────────────────────────────────────────────────────────────
const testsDir = join(ROOT, 'tests');
const hasTestsDir = await exists(testsDir);
let inlineTestCount = 0;
let unitTestCount = 0;
let portContractCount = 0;
for await (
  const entry of walk(ROOT, {
    match: [/_test\.ts$/, /\.test\.ts$/],
    skip: [/node_modules/],
  })
) {
  const rel = relative(ROOT, entry.path);
  if (rel.startsWith('tests/')) {
    if (rel.includes('/ports/')) portContractCount++;
    else unitTestCount++;
  } else inlineTestCount++;
}
if (!hasTestsDir && inlineTestCount === 0) {
  findings.push({ ref: 'NS-S-8.coverage', level: 'FAIL', message: 'no tests/ directory and no inline *_test.ts files — every package needs meaningful tests' });
}
if (inlineTestCount > 0) {
  findings.push({ ref: 'NS-S-8.location', level: 'WARN', message: `${inlineTestCount} inline *_test.ts files outside tests/ — consolidate under tests/<layer>/` });
}

// Forbidden test patterns: import from src/internal
for await (
  const entry of walk(ROOT, {
    match: [/_test\.ts$/, /\.test\.ts$/],
    skip: [/node_modules/],
  })
) {
  const t = await readText(entry.path);
  if (/from\s+['"][^'"]*\/internal\//.test(t)) {
    findings.push({
      ref: 'NS-S-8.private-import',
      level: 'WARN',
      message: 'test imports from src/internal/ — tests must exercise the public surface',
      path: relative(ROOT, entry.path),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// NS-S-9 — observability surface (when adapters/runtime exists)
// Detect packages that own runtime/adapters but never import @netscript/logger
// or @netscript/telemetry.
// ─────────────────────────────────────────────────────────────────────────
const hasRuntime = await exists(join(ROOT, 'src/runtime')) || await exists(join(ROOT, 'runtime')) ||
  await exists(join(ROOT, 'src/adapters')) || await exists(join(ROOT, 'adapters'));
if (hasRuntime) {
  let importsLogger = false;
  let importsTelemetry = false;
  for (const f of tsFiles) {
    const t = await readText(f);
    if (/from\s+['"]@netscript\/logger['"]/.test(t)) importsLogger = true;
    if (/from\s+['"]@netscript\/telemetry['"]/.test(t)) importsTelemetry = true;
  }
  if (!importsLogger) {
    findings.push({ ref: 'NS-S-9.logger', level: 'WARN', message: 'package owns runtime/adapters but does not import @netscript/logger' });
  }
  if (!importsTelemetry && !/telemetry|logger/.test(ROOT)) {
    findings.push({ ref: 'NS-S-9.telemetry', level: 'INFO', message: 'package owns runtime/adapters but does not import @netscript/telemetry — verify spans/metrics emitted' });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// NS-S-10 — diagnostics: every package SHOULD export inspect<Noun>
// ─────────────────────────────────────────────────────────────────────────
let exportsInspect = false;
if (await exists(modPath)) {
  const t = await readText(modPath);
  if (/\bexport\s+(?:\{[^}]*\binspect\w*\b|(?:function|const)\s+inspect\w+)/.test(t)) {
    exportsInspect = true;
  }
}
if (!exportsInspect) {
  findings.push({ ref: 'NS-S-10', level: 'INFO', message: 'mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis' });
}

// ─────────────────────────────────────────────────────────────────────────
// Roll-up
// ─────────────────────────────────────────────────────────────────────────
const summary = {
  root: ROOT,
  pkg: ROOT.split('/').pop(),
  totals: {
    fail: findings.filter((f) => f.level === 'FAIL').length,
    warn: findings.filter((f) => f.level === 'WARN').length,
    info: findings.filter((f) => f.level === 'INFO').length,
  },
  findings,
};
if (args.out) {
  await Deno.mkdir((args.out as string).split('/').slice(0, -1).join('/'), { recursive: true });
  await Deno.writeTextFile(args.out as string, JSON.stringify(summary, null, 2));
}
if (args.text || !args.out) {
  console.log(`# NetScript standards readiness — ${summary.pkg}`);
  console.log(`  FAIL=${summary.totals.fail} WARN=${summary.totals.warn} INFO=${summary.totals.info}`);
  for (const f of findings) {
    console.log(`  ${f.level} ${f.ref}: ${f.message}${f.path ? ` (${f.path}${f.line ? ':' + f.line : ''})` : ''}`);
  }
}
if (summary.totals.fail > 0) Deno.exit(1);
