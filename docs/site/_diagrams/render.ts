#!/usr/bin/env -S deno run -A
/**
 * docs/site/_diagrams/render.ts — diagram render step (SEPARATE dev task, OD1).
 *
 * Diagrams are authored as Mermaid `.mmd` sources in THIS folder and rendered to
 * committed static SVGs under `../assets/diagrams/`. The site build
 * (`deno task build`) NEVER invokes this — the published site depends only on the
 * committed SVGs, so the build stays dependency-free and offline-safe.
 *
 * Run it explicitly when a `.mmd` changes:
 *
 *     deno run -A docs/site/_diagrams/render.ts
 *
 * It shells out to `@mermaid-js/mermaid-cli` (`mmdc`) via npm. If that toolchain
 * is unavailable it prints clear instructions and exits NON-ZERO — it must never
 * break the site build (which does not call it).
 */

const here = new URL(".", import.meta.url);
const outDir = new URL("../assets/diagrams/", import.meta.url);

async function listMmd(): Promise<string[]> {
  const names: string[] = [];
  for await (const entry of Deno.readDir(here)) {
    if (entry.isFile && entry.name.endsWith(".mmd")) names.push(entry.name);
  }
  return names.sort();
}

async function hasMmdc(): Promise<boolean> {
  try {
    const cmd = new Deno.Command("npx", {
      args: ["--yes", "@mermaid-js/mermaid-cli", "--version"],
      stdout: "null",
      stderr: "null",
    });
    const { success } = await cmd.output();
    return success;
  } catch {
    return false;
  }
}

async function render(name: string): Promise<boolean> {
  const input = new URL(name, here);
  const output = new URL(name.replace(/\.mmd$/, ".svg"), outDir);
  const cmd = new Deno.Command("npx", {
    args: [
      "--yes",
      "@mermaid-js/mermaid-cli",
      "-i",
      decodeURIComponent(input.pathname),
      "-o",
      decodeURIComponent(output.pathname),
      "-b",
      "transparent",
    ],
    stdout: "inherit",
    stderr: "inherit",
  });
  const { success } = await cmd.output();
  return success;
}

function instructionsAndExit(): never {
  console.error(
    [
      "[render] @mermaid-js/mermaid-cli (mmdc) is not available.",
      "",
      "Diagrams are committed static SVGs; rendering is a separate dev step and",
      "is intentionally NOT part of `deno task build`. To (re)render:",
      "",
      "  1. Ensure Node/npm is installed (mermaid-cli is an npm package).",
      "  2. Run:  deno run -A docs/site/_diagrams/render.ts",
      "     (it invokes `npx --yes @mermaid-js/mermaid-cli`).",
      "",
      "Until then, hand-authored SVGs under docs/site/assets/diagrams/ remain the",
      "source of truth and the site build is unaffected.",
    ].join("\n"),
  );
  Deno.exit(1);
}

if (import.meta.main) {
  const sources = await listMmd();
  if (sources.length === 0) {
    console.log("[render] no .mmd sources found; nothing to do.");
    Deno.exit(0);
  }
  if (!(await hasMmdc())) instructionsAndExit();

  let failures = 0;
  for (const name of sources) {
    console.log(`[render] ${name} -> ${name.replace(/\.mmd$/, ".svg")}`);
    if (!(await render(name))) failures++;
  }
  if (failures > 0) {
    console.error(`[render] ${failures} diagram(s) failed to render.`);
    Deno.exit(1);
  }
  console.log(`[render] rendered ${sources.length} diagram(s).`);
}
