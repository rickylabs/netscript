const cssPath = "packages/fresh-ui/registry/theme/tokens.css";
const runDir =
  ".llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation";

const worktreeBytes = await Deno.readFile(cssPath);
const head = await new Deno.Command("git", {
  args: ["show", `HEAD:${cssPath}`],
  stdout: "piped",
  stderr: "piped",
}).output();

if (!head.success) {
  const stderr = new TextDecoder().decode(head.stderr);
  throw new Error(`git show failed: ${stderr}`);
}

const worktreeText = new TextDecoder().decode(worktreeBytes);
const result = {
  cssPath,
  byteParity: arraysEqual(worktreeBytes, head.stdout),
  headSha256: await sha256(head.stdout),
  generatedSha256: await sha256(worktreeBytes),
  rootDeclarations: countDeclarations(worktreeText, ":root"),
  lightDeclarations: countDeclarations(worktreeText, "light"),
  visualParityInference:
    "Generated CSS is byte-identical to the checked-in baseline, so rendered token values are unchanged.",
};

await Deno.writeTextFile(
  `${runDir}/slice-03-token-build-parity.json`,
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(JSON.stringify(result, null, 2));

if (!result.byteParity) Deno.exit(1);

async function sha256(bytes: Uint8Array) {
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function arraysEqual(left: Uint8Array, right: Uint8Array) {
  if (left.byteLength !== right.byteLength) return false;
  return left.every((value, index) => value === right[index]);
}

function countDeclarations(css: string, selector: ":root" | "light") {
  const pattern = selector === ":root"
    ? /:root\s*\{([\s\S]*?)\}\s*\n\s*\[data-theme='light'\]/m
    : /\[data-theme='light'\]\s*\{([\s\S]*?)\}/m;
  const block = css.match(pattern)?.[1];
  if (!block) throw new Error(`Missing ${selector} block`);
  return [...block.matchAll(/--ns-[a-z0-9-]+:\s*[^;]+;/g)].length;
}
