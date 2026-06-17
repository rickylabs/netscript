/**
 * MEASURE-FIRST sweep for sub-wave 5a (@netscript/service).
 * Spawns raw `deno` via Deno.Command (bypasses rtk filtering) and emits JSON.
 *
 * Run from repo root:
 *   deno run --allow-run --allow-read --allow-write .llm/temp/measure-5a-service.ts
 */

const PKG = 'packages/service';
const ENTRYPOINTS = ['mod.ts']; // from deno.json exports: { ".": "./mod.ts" }

function run(args: string[], cwd?: string): { code: number; stdout: string; stderr: string } {
  const out = new Deno.Command(Deno.execPath(), {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).outputSync();
  return {
    code: out.code,
    stdout: new TextDecoder().decode(out.stdout),
    stderr: new TextDecoder().decode(out.stderr),
  };
}

const result: Record<string, unknown> = { pkg: PKG, measuredAt: new Date().toISOString() };

// 1. deno check --unstable-kv over all entrypoints
const check = run(['check', '--unstable-kv', ...ENTRYPOINTS.map((e) => `${PKG}/${e}`)]);
result.check = { code: check.code, stderr: check.stderr.slice(0, 4000) };

// 2. doc-lint: combined over all entrypoints (== barrel run here, single EP)
const doclint = run(['doc', '--lint', ...ENTRYPOINTS.map((e) => `${PKG}/${e}`)]);
const lintErrors = doclint.stderr.split('\n').filter((l) => l.includes('error['));
const counts: Record<string, number> = {};
for (const l of lintErrors) {
  const m = l.match(/error\[([a-z-]+)\]/);
  if (m) counts[m[1]] = (counts[m[1]] ?? 0) + 1;
}
result.docLint = {
  code: doclint.code,
  total: lintErrors.length,
  byRule: counts,
  raw: doclint.stderr,
};

// 3. publish dry-run (slow types)
const dry = run(['publish', '--dry-run', '--allow-dirty'], PKG);
const dryErrors = (dry.stderr + dry.stdout).split('\n').filter((l) => l.includes('error['));
const dryCounts: Record<string, number> = {};
for (const l of dryErrors) {
  const m = l.match(/error\[([a-z-]+)\]/);
  if (m) dryCounts[m[1]] = (dryCounts[m[1]] ?? 0) + 1;
}
result.dryRun = {
  code: dry.code,
  errorLines: dryErrors.length,
  byRule: dryCounts,
  raw: (dry.stderr + '\n---stdout---\n' + dry.stdout).slice(0, 12000),
};

// 4. tests present?
let testFiles = 0;
try {
  for (const e of Deno.readDirSync(`${PKG}/tests`)) if (e.name.endsWith('.ts')) testFiles++;
} catch {
  testFiles = 0;
}
const grepTests: string[] = [];
for await (
  const entry of (async function* walk(dir: string): AsyncGenerator<string> {
    for (const e of Deno.readDirSync(dir)) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory) yield* walk(p);
      else if (/_test\.tsx?$|\.test\.tsx?$/.test(e.name)) yield p;
    }
  })(PKG)
) grepTests.push(entry);
result.tests = { testsDir: testFiles, testFileMatches: grepTests };

const outPath = '.llm/tmp/run/feat-package-quality-wave5-apps--5a-service/measure-5a.json';
Deno.writeTextFileSync(outPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(
  {
    check: check.code,
    docLintTotal: result.docLint && (result.docLint as { total: number }).total,
    docLintByRule: counts,
    dryRunCode: dry.code,
    dryRunByRule: dryCounts,
    tests: result.tests,
    out: outPath,
  },
  null,
  2,
));
