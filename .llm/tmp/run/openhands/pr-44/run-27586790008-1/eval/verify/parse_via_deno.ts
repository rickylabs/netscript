// Parse all deno.json files using Deno's actual config parser (JSON5 with comments).
// Output: per-file path + a JSON dump of just the imports + catalog fields.
import * as JSONC from "https://deno.land/std@0.224.0/jsonc/mod.ts";

const ROOT = "/home/runner/work/netscript/netscript";

function* walk(dir: string): Generator<string> {
  for (const entry of Deno.readDirSync(dir)) {
    const p = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      if (entry.name === "node_modules" || entry.name === ".deno" || entry.name === ".llm") continue;
      yield* walk(p);
    } else if (entry.name === "deno.json" || entry.name === "deno.json.template") {
      yield p;
    }
  }
}

const out: string[] = [];
for (const p of walk(ROOT)) {
  const text = Deno.readTextFileSync(p);
  try {
    const d = JSONC.parse(text) as Record<string, unknown>;
    const rel = p.replace(ROOT + "/", "");
    out.push(`=== ${rel} ===`);
    out.push(`# name: ${d.name ?? ""}`);
    const imports = (d.imports ?? {}) as Record<string, string>;
    const catalog = (d.catalog ?? {}) as Record<string, string>;
    out.push(`# catalog_entries: ${Object.keys(catalog).length}`);
    for (const k of Object.keys(catalog).sort()) out.push(`  CAT ${k} ${catalog[k]}`);
    out.push(`# import_entries: ${Object.keys(imports).length}`);
    for (const k of Object.keys(imports).sort()) out.push(`  IMP ${k} ${imports[k]}`);
  } catch (e) {
    out.push(`=== ${p} ===`);
    out.push(`# ERROR: ${(e as Error).message}`);
  }
}
Deno.writeTextFileSync("/home/runner/work/netscript/netscript/.llm/tmp/run/openhands/pr-44/run-27586790008-1/eval/verify/imports.all.txt", out.join("\n"));
console.log("Wrote", out.length, "lines");
