/**
 * MCP-friendly structured runner for `deno doc --lint`.
 *
 * Use this when `deno doc --lint` output is too noisy to attribute per-entrypoint or per-file.
 * The script runs `deno doc --lint` over specified entrypoints (or auto-discovers them from
 * deno.json exports), parses private-type-ref and missing-jsdoc errors, and emits grouped JSON
 * with per-entrypoint and per-file attribution.
 *
 * Examples:
 * - deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/plugin-workers-core --pretty
 * - deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/plugin-workers-core --entrypoints ./mod.ts ./src/builders/mod.ts --pretty
 * - deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/plugin-workers-core --output .llm/tmp/doc-lint.json
 */

interface Options {
  root: string;
  entrypoints?: string[];
  output?: string;
  pretty: boolean;
}

interface DocLintError {
  type: "private-type-ref" | "missing-jsdoc" | "other";
  message: string;
  file: string;
  line: number;
}

interface EntrypointResult {
  path: string;
  privateTypeRef: number;
  missingJSDoc: number;
  other: number;
  total: number;
}

interface FileResult {
  path: string;
  privateTypeRef: number;
  missingJSDoc: number;
  other: number;
  total: number;
}

interface PackageResult {
  name: string;
  dir: string;
  entrypoints: EntrypointResult[];
  files: FileResult[];
  combinedTotal: number;
  combinedPrivateTypeRef: number;
  combinedMissingJSDoc: number;
  combinedOther: number;
}

interface OutputReport {
  source: {
    mode: "auto" | "explicit";
    root: string;
    entrypoints: string[];
  };
  summary: {
    totalPackages: number;
    totalErrors: number;
    totalPrivateTypeRef: number;
    totalMissingJSDoc: number;
    totalOther: number;
  };
  packages: PackageResult[];
}

const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;
const ERROR_LINE = /^error\[([^\]]+)\]:\s*(.*)/;
const LOCATION_LINE = /^\s*-->\s+(.+?):(\d+):/;
const SUMMARY_LINE = /Found (\d+) documentation lint errors?/;

function printHelp(): void {
  console.log(
    [
      "Usage:",
      "  deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts [options]",
      "",
      "Options:",
      "  --root <path>       Package root directory (must contain deno.json). Required.",
      "  --entrypoints <…>   Explicit entrypoint paths relative to root. Repeatable.",
      "                      If omitted, auto-discovers from deno.json exports.",
      "  --output <path>     Write JSON report to file instead of stdout.",
      "  --pretty            Pretty-print JSON output.",
      "  --help              Show this help.",
      "",
      "Examples:",
      "  deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/logger --pretty",
      "  deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh --output .llm/tmp/doc-lint.json",
    ].join("\n"),
  );
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value) throw new Error(`Missing value for ${flag}`);
  return value;
}

function parseArgs(args: string[]): Options | null {
  let root: string | undefined;
  const entrypoints: string[] = [];
  let output: string | undefined;
  let pretty = false;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    switch (arg) {
      case "--root":
        root = requireValue(args, index, arg);
        index++;
        break;
      case "--entrypoints":
        entrypoints.push(requireValue(args, index, arg));
        index++;
        break;
      case "--output":
        output = requireValue(args, index, arg);
        index++;
        break;
      case "--pretty":
        pretty = true;
        break;
      case "--help":
        printHelp();
        return null;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!root) {
    console.error("Error: --root is required");
    printHelp();
    Deno.exit(1);
  }

  return {
    root,
    entrypoints: entrypoints.length > 0 ? entrypoints : undefined,
    output,
    pretty,
  };
}

function stripAnsi(text: string): string {
  return text.replaceAll(ANSI_PATTERN, "");
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

async function discoverEntrypoints(root: string): Promise<string[]> {
  const denoJsonPath = `${root}/deno.json`;
  let text: string;
  try {
    text = await Deno.readTextFile(denoJsonPath);
  } catch {
    throw new Error(`No deno.json found at ${denoJsonPath}`);
  }

  const parsed = JSON.parse(text);
  const exports = parsed.exports;
  if (!exports) return ["./mod.ts"];

  const paths: string[] = [];
  if (typeof exports === "string") {
    paths.push(exports);
  } else if (typeof exports === "object") {
    for (const key of Object.keys(exports)) {
      const value = exports[key];
      if (typeof value === "string") {
        paths.push(value);
      } else if (Array.isArray(value)) {
        paths.push(...value.filter((v) => typeof v === "string"));
      } else if (value && typeof value === "object") {
        if (value.default) paths.push(value.default);
        if (value.types) paths.push(value.types);
      }
    }
  }

  // Deduplicate and sort
  const unique = [...new Set(paths)];
  return unique.sort();
}

async function runDocLint(
  cwd: string,
  entrypoints: string[],
): Promise<{ text: string; code: number }> {
  const args = ["doc", "--lint", ...entrypoints];
  const result = await new Deno.Command("deno", {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  }).output();

  const text =
    new TextDecoder().decode(result.stdout) +
    new TextDecoder().decode(result.stderr);
  return { text, code: result.code };
}

function parseErrors(output: string): DocLintError[] {
  const clean = stripAnsi(output);
  const lines = clean.split(/\r?\n/);
  const errors: DocLintError[] = [];

  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(ERROR_LINE);
    if (!match) continue;

    const rawType = match[1];
    const message = match[2];
    let file = "unknown";
    let lineNum = 0;

    for (
      let scan = index + 1;
      scan < Math.min(index + 6, lines.length);
      scan++
    ) {
      const locMatch = lines[scan].match(LOCATION_LINE);
      if (locMatch) {
        file = normalizePath(locMatch[1]);
        lineNum = parseInt(locMatch[2], 10);
        break;
      }
    }

    const type: DocLintError["type"] =
      rawType === "private-type-ref"
        ? "private-type-ref"
        : rawType === "missing-jsdoc"
          ? "missing-jsdoc"
          : "other";

    errors.push({ type, message, file, line: lineNum });
  }

  return errors;
}

function countSummary(
  output: string,
  parsedErrors: DocLintError[],
): { total: number; ptr: number; jsdoc: number; other: number } {
  const totalMatch = output.match(SUMMARY_LINE);
  const ptr = (output.match(/error\[private-type-ref\]/g) || []).length;
  const jsdoc = (output.match(/error\[missing-jsdoc\]/g) || []).length;
  // Use summary line when available; otherwise derive from parsed errors
  const total = totalMatch ? parseInt(totalMatch[1], 10) : parsedErrors.length;
  const other = total - ptr - jsdoc;
  return { total, ptr, jsdoc, other };
}

async function measurePackage(
  root: string,
  entrypoints: string[],
): Promise<PackageResult> {
  // Read package name from deno.json
  let name = root.split("/").pop() ?? root;
  try {
    const denoJson = JSON.parse(await Deno.readTextFile(`${root}/deno.json`));
    name = denoJson.name ?? name;
  } catch {
    /* ignore */
  }

  // Combined run
  const combined = await runDocLint(root, entrypoints);
  const allErrors = parseErrors(combined.text);
  const combinedCounts = countSummary(combined.text, allErrors);

  // Per-entrypoint runs
  const epResults: EntrypointResult[] = [];
  for (const ep of entrypoints) {
    const res = await runDocLint(root, [ep]);
    const epErrors = parseErrors(res.text);
    const counts = countSummary(res.text, epErrors);
    epResults.push({
      path: ep,
      privateTypeRef: counts.ptr,
      missingJSDoc: counts.jsdoc,
      other: counts.other,
      total: counts.total,
    });
  }

  // Per-file attribution from combined errors
  const fileMap = new Map<string, FileResult>();
  for (const err of allErrors) {
    const existing = fileMap.get(err.file);
    if (existing) {
      existing.total++;
      if (err.type === "private-type-ref") existing.privateTypeRef++;
      else if (err.type === "missing-jsdoc") existing.missingJSDoc++;
      else existing.other++;
    } else {
      fileMap.set(err.file, {
        path: err.file,
        privateTypeRef: err.type === "private-type-ref" ? 1 : 0,
        missingJSDoc: err.type === "missing-jsdoc" ? 1 : 0,
        other: err.type === "other" ? 1 : 0,
        total: 1,
      });
    }
  }

  const files = [...fileMap.values()].sort((a, b) => b.total - a.total);

  return {
    name,
    dir: root,
    entrypoints: epResults,
    files,
    combinedTotal: combinedCounts.total,
    combinedPrivateTypeRef: combinedCounts.ptr,
    combinedMissingJSDoc: combinedCounts.jsdoc,
    combinedOther: combinedCounts.other,
  };
}

async function main(): Promise<void> {
  const options = parseArgs(Deno.args);
  if (!options) return;

  const entrypoints =
    options.entrypoints ?? (await discoverEntrypoints(options.root));
  if (entrypoints.length === 0) {
    console.error(`No entrypoints discovered in ${options.root}`);
    Deno.exit(1);
  }

  const pkg = await measurePackage(options.root, entrypoints);

  const report: OutputReport = {
    source: {
      mode: options.entrypoints ? "explicit" : "auto",
      root: options.root,
      entrypoints,
    },
    summary: {
      totalPackages: 1,
      totalErrors: pkg.combinedTotal,
      totalPrivateTypeRef: pkg.combinedPrivateTypeRef,
      totalMissingJSDoc: pkg.combinedMissingJSDoc,
      totalOther: pkg.combinedOther,
    },
    packages: [pkg],
  };

  const json = JSON.stringify(report, null, options.pretty ? 2 : undefined);

  if (options.output) {
    await Deno.writeTextFile(options.output, json);
    console.log(`Wrote ${options.output}`);
  } else {
    console.log(json);
  }
}

await main();
