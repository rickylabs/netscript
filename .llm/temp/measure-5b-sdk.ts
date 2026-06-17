/**
 * MEASURE-FIRST sweep for sub-wave 5b (@netscript/sdk).
 * Spawns raw `deno` via Deno.Command (bypasses rtk filtering) and emits JSON.
 * Ground truth doc-lint = COMBINED over ALL exports entrypoints; barrel-only
 * run recorded separately for the undercount gap.
 *
 * Run from repo root:
 *   deno run --allow-run --allow-read --allow-write .llm/temp/measure-5b-sdk.ts
 */

const PKG = 'packages/sdk';

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

function lintCounts(stderr: string): { total: number; byRule: Record<string, number> } {
  const lines = stderr.split('\n').filter((l) => l.includes('error['));
  const byRule: Record<string, number> = {};
  for (const l of lines) {
    const m = l.match(/error\[([a-z-]+)\]/);
    if (m) byRule[m[1]] = (byRule[m[1]] ?? 0) + 1;
  }
  return { total: lines.length, byRule };
}

const denoJson = JSON.parse(Deno.readTextFileSync(`${PKG}/deno.json`));
const entrypoints: string[] = Object.values(denoJson.exports as Record<string, string>)
  .map((p) => `${PKG}/${p.replace(/^\.\//, '')}`);

const result: Record<string, unknown> = {
  pkg: PKG,
  measuredAt: new Date().toISOString(),
  entrypoints,
};

// 1. deno check --unstable-kv over all entrypoints
const check = run(['check', '--unstable-kv', ...entrypoints]);
result.check = { code: check.code, stderr: check.stderr.slice(0, 4000) };

// 2a. doc-lint COMBINED over all entrypoints (ground truth)
const combined = run(['doc', '--lint', ...entrypoints]);
result.docLintCombined = { code: combined.code, ...lintCounts(combined.stderr), raw: combined.stderr };

// 2b. doc-lint barrel-only (undercount comparison)
const barrel = run(['doc', '--lint', `${PKG}/mod.ts`]);
result.docLintBarrel = { code: barrel.code, ...lintCounts(barrel.stderr) };

// 2c. per-entrypoint doc-lint (cluster budgeting)
const perEp: Record<string, unknown> = {};
for (const ep of entrypoints) {
  const r = run(['doc', '--lint', ep]);
  perEp[ep] = { code: r.code, ...lintCounts(r.stderr) };
}
result.docLintPerEntrypoint = perEp;

// 3. publish dry-run (slow types)
const dry = run(['publish', '--dry-run', '--allow-dirty'], PKG);
const dryText = dry.stderr + dry.stdout;
result.dryRun = {
  code: dry.code,
  ...lintCounts(dryText),
  raw: dryText.slice(0, 16000),
};

// 4. tests + LOC inventory
const testFiles: string[] = [];
const srcFiles: { path: string; loc: number }[] = [];
function walk(dir: string) {
  for (const e of Deno.readDirSync(dir)) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory) walk(p);
    else if (/_test\.tsx?$|\.test\.tsx?$/.test(e.name)) testFiles.push(p);
    else if (/\.tsx?$/.test(e.name)) {
      srcFiles.push({ path: p, loc: Deno.readTextFileSync(p).split('\n').length });
    }
  }
}
walk(PKG);
srcFiles.sort((a, b) => b.loc - a.loc);
result.tests = testFiles;
result.srcLocTotal = srcFiles.reduce((s, f) => s + f.loc, 0);
result.srcFiles = srcFiles;
result.overCap350 = srcFiles.filter((f) => f.loc > 350);

const outPath = '.llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/measure-5b.json';
Deno.writeTextFileSync(outPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(
  {
    check: check.code,
    docLintCombined: (result.docLintCombined as { total: number }).total,
    combinedByRule: (result.docLintCombined as { byRule: unknown }).byRule,
    docLintBarrel: (result.docLintBarrel as { total: number }).total,
    dryRunCode: dry.code,
    dryRunByRule: (result.dryRun as { byRule: unknown }).byRule,
    testFiles: testFiles.length,
    srcLocTotal: result.srcLocTotal,
    overCap350: (result.overCap350 as unknown[]).length,
    out: outPath,
  },
  null,
  2,
));
