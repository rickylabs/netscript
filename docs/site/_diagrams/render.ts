#!/usr/bin/env -S deno run -A
/**
 * Render and verify committed Mermaid diagrams for the docs site.
 *
 * The docs build consumes committed SVGs so it stays offline-safe. This helper
 * is the authoritative regeneration and drift gate for `_diagrams/*.mmd`.
 */

const here = new URL(".", import.meta.url);
const outDir = new URL("../assets/diagrams/", import.meta.url);
const configFile = new URL("mermaid.config.json", import.meta.url);
const mermaidCliVersion = "10.9.1";
const mermaidPackage = `@mermaid-js/mermaid-cli@${mermaidCliVersion}`;

type RenderOptions = {
  outDir: URL;
};

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
      args: ["--yes", mermaidPackage, "--version"],
      stdout: "null",
      stderr: "null",
    });
    const { success } = await cmd.output();
    return success;
  } catch {
    return false;
  }
}

async function render(name: string, options: RenderOptions): Promise<boolean> {
  const input = new URL(name, here);
  const output = new URL(name.replace(/\.mmd$/, ".svg"), options.outDir);
  const cmd = new Deno.Command("npx", {
    args: [
      "--yes",
      mermaidPackage,
      "-i",
      decodeURIComponent(input.pathname),
      "-o",
      decodeURIComponent(output.pathname),
      "-c",
      decodeURIComponent(configFile.pathname),
      "-b",
      "transparent",
    ],
    stdout: "inherit",
    stderr: "inherit",
  });
  const { success } = await cmd.output();
  return success;
}

async function renderAll(options: RenderOptions): Promise<number> {
  const sources = await listMmd();
  if (sources.length === 0) {
    console.log("[diagram:render] no .mmd sources found; nothing to do.");
    return 0;
  }
  if (!(await hasMmdc())) instructionsAndExit();

  await Deno.mkdir(options.outDir, { recursive: true });
  let failures = 0;
  for (const name of sources) {
    console.log(
      `[diagram:render] ${name} -> ${name.replace(/\.mmd$/, ".svg")}`,
    );
    if (!(await render(name, options))) failures++;
  }
  if (failures > 0) {
    console.error(`[diagram:render] ${failures} diagram(s) failed to render.`);
    return 1;
  }
  console.log(`[diagram:render] rendered ${sources.length} diagram(s).`);
  return 0;
}

async function filesEqual(left: URL, right: URL): Promise<boolean> {
  try {
    const [leftBytes, rightBytes] = await Promise.all([
      Deno.readFile(left),
      Deno.readFile(right),
    ]);
    if (leftBytes.byteLength !== rightBytes.byteLength) return false;
    return leftBytes.every((byte, index) => byte === rightBytes[index]);
  } catch {
    return false;
  }
}

async function checkCommittedSvgDrift(): Promise<number> {
  const sources = await listMmd();
  if (sources.length === 0) {
    console.log("[diagram:check] no .mmd sources found; nothing to check.");
    return 0;
  }

  const tempDir = await Deno.makeTempDir({ prefix: "netscript-diagrams-" });
  const tempUrl = new URL(`${tempDir.replace(/\/$/, "")}/`, "file://");
  try {
    const renderCode = await renderAll({ outDir: tempUrl });
    if (renderCode !== 0) return renderCode;

    const drift: string[] = [];
    for (const name of sources) {
      const svgName = name.replace(/\.mmd$/, ".svg");
      const rendered = new URL(svgName, tempUrl);
      const committed = new URL(svgName, outDir);
      if (!(await filesEqual(rendered, committed))) drift.push(svgName);
    }

    if (drift.length > 0) {
      console.error("[diagram:check] committed SVG drift detected:");
      for (const name of drift) {
        console.error(`  - docs/site/assets/diagrams/${name}`);
      }
      console.error(
        `[diagram:check] run: deno run -A docs/site/_diagrams/render.ts`,
      );
      return 1;
    }

    console.log(
      `[diagram:check] ${sources.length} committed SVGs match Mermaid sources.`,
    );
    return 0;
  } finally {
    await Deno.remove(tempUrl, { recursive: true }).catch(() => {});
  }
}

function instructionsAndExit(): never {
  console.error(
    [
      `[diagram:render] ${mermaidPackage} (mmdc) is not available.`,
      "",
      "Diagrams are committed static SVGs; rendering is a separate dev step and",
      "is intentionally NOT part of `deno task build`. To (re)render:",
      "",
      "  1. Ensure Node/npm is installed (mermaid-cli is an npm package).",
      "  2. Run:  npx --yes @mermaid-js/mermaid-cli@10.9.1 --version",
      "  3. Run:  deno run -A docs/site/_diagrams/render.ts",
      "",
      "The docs build uses committed SVGs and separately validates that referenced",
      "diagram assets exist.",
    ].join("\n"),
  );
  Deno.exit(1);
}

if (import.meta.main) {
  const check = Deno.args.includes("--check");
  Deno.exit(
    check ? await checkCommittedSvgDrift() : await renderAll({ outDir }),
  );
}
