#!/usr/bin/env -S deno run --allow-read --allow-run --allow-write
/**
 * MEASURE-FIRST doc-lint attribution script.
 * Runs `deno doc --lint` over a package's entrypoints and attributes
 * errors by source file + entrypoint.
 */

import { dirname, relative, resolve } from "jsr:@std/path@^1";

interface EntrypointResult {
  path: string;
  privateTypeRef: number;
  missingJSDoc: number;
  total: number;
}

interface PackageResult {
  name: string;
  dir: string;
  entrypoints: EntrypointResult[];
  combinedTotal: number;
  combinedPrivateTypeRef: number;
  combinedMissingJSDoc: number;
}

async function runDocLint(
  cwd: string,
  entrypoints: string[],
): Promise<{ stdout: string; stderr: string; code: number }> {
  const args = ["doc", "--lint", ...entrypoints];
  const cmd = new Deno.Command("deno", {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await cmd.output();
  return {
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr),
    code,
  };
}

function parseErrors(output: string): Array<{
  type: string;
  file: string;
  line: number;
  message: string;
}> {
  const errors: Array<{ type: string; file: string; line: number; message: string }> = [];
  const lines = output.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^error\[([^\]]+)\]:\s*(.*)/);
    if (match) {
      const errorType = match[1];
      const message = match[2];
      // Look ahead for file location
      let file = "unknown";
      let lineNum = 0;
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const locMatch = lines[j].match(/-->\s+(.+?):(\d+):/);
        if (locMatch) {
          file = locMatch[1];
          lineNum = parseInt(locMatch[2], 10);
          break;
        }
      }
      errors.push({ type: errorType, file, line: lineNum, message });
    }
  }
  return errors;
}

function countSummary(output: string): { total: number; ptr: number; jsdoc: number } {
  const totalMatch = output.match(/Found (\d+) documentation lint errors?/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;
  const ptr = (output.match(/error\[private-type-ref\]/g) || []).length;
  const jsdoc = (output.match(/error\[missing-jsdoc\]/g) || []).length;
  return { total, ptr, jsdoc };
}

async function measurePackage(
  pkgDir: string,
  entrypoints: string[],
  pkgName: string,
): Promise<PackageResult> {
  const absDir = resolve(pkgDir);

  // Combined run
  const combined = await runDocLint(absDir, entrypoints);
  const combinedCounts = countSummary(combined.stdout + combined.stderr);

  // Per-entrypoint runs (for attribution)
  const results: EntrypointResult[] = [];
  for (const ep of entrypoints) {
    const res = await runDocLint(absDir, [ep]);
    const counts = countSummary(res.stdout + res.stderr);
    results.push({
      path: ep,
      privateTypeRef: counts.ptr,
      missingJSDoc: counts.jsdoc,
      total: counts.total,
    });
  }

  // Parse combined for file-level attribution
  const allErrors = parseErrors(combined.stdout + combined.stderr);
  const fileCounts = new Map<string, { ptr: number; jsdoc: number; total: number }>();
  for (const err of allErrors) {
    const key = err.file;
    const existing = fileCounts.get(key) || { ptr: 0, jsdoc: 0, total: 0 };
    existing.total++;
    if (err.type === "private-type-ref") existing.ptr++;
    if (err.type === "missing-jsdoc") existing.jsdoc++;
    fileCounts.set(key, existing);
  }

  return {
    name: pkgName,
    dir: absDir,
    entrypoints: results,
    combinedTotal: combinedCounts.total,
    combinedPrivateTypeRef: combinedCounts.ptr,
    combinedMissingJSDoc: combinedCounts.jsdoc,
  };
}

// Main
const coreEntrypoints = [
  "./mod.ts",
  "./src/builders/mod.ts",
  "./src/contracts/v1/mod.ts",
  "./src/registry/mod.ts",
  "./src/state/mod.ts",
  "./src/executor/mod.ts",
  "./src/workflow/mod.ts",
  "./src/streams/mod.ts",
  "./src/presets/mod.ts",
  "./src/shutdown/mod.ts",
  "./src/domain/public-schema.ts",
  "./src/telemetry/mod.ts",
  "./src/abstracts/mod.ts",
  "./src/testing/mod.ts",
  "./src/config/mod.ts",
  "./src/runtime/mod.ts",
];

const pluginEntrypoints = [
  "./mod.ts",
  "./src/aspire/mod.ts",
  "./src/cli/composition/main.ts",
  "./contracts/v1/mod.ts",
  "./src/scaffolding/mod.ts",
  "./services/src/main.ts",
  "./streams/mod.ts",
  "./streams/server.ts",
  "./worker/mod.ts",
];

console.log("=== @netscript/plugin-workers-core ===");
const coreResult = await measurePackage(
  "packages/plugin-workers-core",
  coreEntrypoints,
  "@netscript/plugin-workers-core",
);
console.log(`Combined: ${coreResult.combinedTotal} (${coreResult.combinedPrivateTypeRef} ptr + ${coreResult.combinedMissingJSDoc} jsdoc)`);
for (const ep of coreResult.entrypoints) {
  console.log(`  ${ep.path}: ${ep.total} (${ep.privateTypeRef} ptr + ${ep.missingJSDoc} jsdoc)`);
}

console.log("\n=== @netscript/plugin-workers ===");
const pluginResult = await measurePackage(
  "plugins/workers",
  pluginEntrypoints,
  "@netscript/plugin-workers",
);
console.log(`Combined: ${pluginResult.combinedTotal} (${pluginResult.combinedPrivateTypeRef} ptr + ${pluginResult.combinedMissingJSDoc} jsdoc)`);
for (const ep of pluginResult.entrypoints) {
  console.log(`  ${ep.path}: ${ep.total} (${ep.privateTypeRef} ptr + ${ep.missingJSDoc} jsdoc)`);
}

// Write JSON for plan.md consumption
const outPath = ".llm/tmp/run/feat-package-quality-wave4-runtimes--4b-workers/measure-doc-lint.json";
await Deno.writeTextFile(outPath, JSON.stringify({ core: coreResult, plugin: pluginResult }, null, 2));
console.log(`\nWrote ${outPath}`);
