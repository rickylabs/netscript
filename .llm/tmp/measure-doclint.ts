// Refined Wave 5 doc-lint + dry-run counts (authoritative "Found N" summaries).
const ROOT = Deno.args[0];
const PKGS: Record<string, string[]> = {
  service: ["./mod.ts"],
  sdk: ["./mod.ts", "./adapters/mod.ts", "./cache/mod.ts", "./client/mod.ts", "./collections/mod.ts", "./discovery/mod.ts", "./interfaces/mod.ts", "./openapi/mod.ts", "./query/mod.ts", "./query-client/mod.ts", "./streams.ts", "./telemetry/mod.ts"],
  "fresh-ui": ["./mod.ts", "./interactive.ts"],
  fresh: ["./mod.ts", "./server.ts", "./builders/mod.ts", "./route/mod.ts", "./defer/mod.ts", "./form/mod.ts", "./error/mod.ts", "./utils/mod.ts", "./streams/mod.ts", "./query/mod.ts", "./interactive.ts", "./config/vite.ts"],
};
const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
const sh = (cwd: string, args: string[]) => {
  const o = new Deno.Command("deno", { args, cwd, stdout: "piped", stderr: "piped" }).outputSync();
  return { code: o.code, out: strip(new TextDecoder().decode(o.stdout) + new TextDecoder().decode(o.stderr)) };
};
const found = (s: string, re: RegExp) => { const m = s.match(re); return m ? Number(m[1]) : null; };
const occ = (s: string, n: string) => s.split(n).length - 1;

const out: Record<string, unknown> = {};
for (const [pkg, eps] of Object.entries(PKGS)) {
  const dir = `${ROOT}/packages/${pkg}`;
  console.error(`=== ${pkg} (combined ${eps.length} eps) ===`);
  const combined = sh(dir, ["doc", "--lint", ...eps]);
  const barrel = sh(dir, ["doc", "--lint", eps[0]]);
  const dry = sh(dir, ["publish", "--dry-run", "--allow-dirty"]);
  out[pkg] = {
    docLintCombinedTotal: found(combined.out, /Found (\d+) documentation lint errors/),
    breakdown: {
      privateTypeRef: occ(combined.out, "error[private-type-ref]"),
      missingReturnType: occ(combined.out, "error[missing-return-type]"),
      missingJsDoc: occ(combined.out, "error[missing-jsdoc]"),
      missingExplicitType: occ(combined.out, "error[missing-explicit-type]"),
    },
    docLintBarrelTotal: found(barrel.out, /Found (\d+) documentation lint errors/),
    dryRunExit: dry.code,
    dryRunSlowTypes: found(dry.out, /Found (\d+) slow type/),
  };
  console.error(`  -> combined ${JSON.stringify(out[pkg])}`);
}
await Deno.writeTextFile(`${ROOT}/.llm/tmp/wave5-doclint.json`, JSON.stringify({ at: "dfab7a4", results: out }, null, 2));
console.error("WROTE wave5-doclint.json");
