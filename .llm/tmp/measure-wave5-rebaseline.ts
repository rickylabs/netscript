// Wave 5 re-baseline (post Wave-4 merge @ dfab7a4). Spawns `deno` directly to
// bypass the RTK shell hook so counts/exit codes are raw ground truth.
// Output: .llm/tmp/wave5-rebaseline.json  (run from the wave5-apps worktree root)

const PKGS = ["service", "sdk", "fresh-ui", "fresh"];
const ROOT = Deno.args[0] ?? Deno.cwd();

function sh(cwd: string, args: string[]): { code: number; out: string } {
  const o = new Deno.Command("deno", {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  }).outputSync();
  return {
    code: o.code,
    out: new TextDecoder().decode(o.stdout) + new TextDecoder().decode(o.stderr),
  };
}

function count(hay: string, needle: string): number {
  return hay.split(needle).length - 1;
}

async function exportsOf(pkgDir: string): Promise<string[]> {
  const cfg = JSON.parse(await Deno.readTextFile(`${pkgDir}/deno.json`));
  const ex = cfg.exports;
  if (typeof ex === "string") return [ex];
  if (ex && typeof ex === "object") return Object.values(ex) as string[];
  return ["./mod.ts"];
}

async function countTestFiles(dir: string): Promise<number> {
  let n = 0;
  async function walk(d: string) {
    for await (const e of Deno.readDir(d)) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      const p = `${d}/${e.name}`;
      if (e.isDirectory) await walk(p);
      else if (e.name.endsWith("_test.ts") || e.name.endsWith("_test.tsx") || e.name.endsWith(".test.ts")) n++;
    }
  }
  try { await walk(dir); } catch { /* ignore */ }
  return n;
}

const results: Record<string, unknown> = {};

for (const pkg of PKGS) {
  const dir = `${ROOT}/packages/${pkg}`;
  console.error(`\n=== ${pkg} ===`);
  let entrypoints: string[] = [];
  try { entrypoints = await exportsOf(dir); } catch (e) { results[pkg] = { error: String(e) }; continue; }

  // publish dry-run (slow types)
  console.error(`  publish --dry-run ...`);
  const dry = sh(dir, ["publish", "--dry-run", "--allow-dirty", "--no-check=remote"]);
  const slowTypes = count(dry.out, "slow type") + count(dry.out, "slow-type");

  // combined doc-lint (ground truth) over ALL entrypoints in one invocation
  console.error(`  doc --lint (combined ${entrypoints.length} eps) ...`);
  const docCombined = sh(dir, ["doc", "--lint", ...entrypoints]);
  const combinedArrows = count(docCombined.out, "\n    --> ") + count(docCombined.out, "\n   --> ") + count(docCombined.out, " --> ");
  const combinedPtr = count(docCombined.out, "private-type-ref") + count(docCombined.out, "not exported from") + count(docCombined.out, "is private");

  // barrel-only doc-lint (mod.ts) — catches the merged-graph leak the per-EP run misses
  const barrel = entrypoints.includes("./mod.ts") ? "./mod.ts" : entrypoints[0];
  console.error(`  doc --lint (barrel ${barrel}) ...`);
  const docBarrel = sh(dir, ["doc", "--lint", barrel]);
  const barrelArrows = count(docBarrel.out, " --> ");

  // type check
  console.error(`  check ...`);
  const chk = sh(dir, ["check", "--unstable-kv", ...entrypoints]);

  const testFiles = await countTestFiles(dir);

  results[pkg] = {
    entrypoints: entrypoints.length,
    entrypointList: entrypoints,
    dryRun: { exit: dry.code, slowTypeHits: slowTypes },
    docLintCombined: { exit: docCombined.code, diagnostics: combinedArrows, privateTypeRefish: combinedPtr },
    docLintBarrel: { exit: docBarrel.code, diagnostics: barrelArrows },
    check: { exit: chk.code },
    testFiles,
  };
  console.error(`  -> dryRun exit ${dry.code} (slowHits ${slowTypes}); docCombined exit ${docCombined.code} (diag ${combinedArrows}, ptr-ish ${combinedPtr}); barrel diag ${barrelArrows}; check exit ${chk.code}; tests ${testFiles}`);
}

await Deno.writeTextFile(`${ROOT}/.llm/tmp/wave5-rebaseline.json`, JSON.stringify({ at: "dfab7a4", measuredAt: new Date().toISOString(), results }, null, 2));
console.error("\nWROTE .llm/tmp/wave5-rebaseline.json");
