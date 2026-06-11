const css = await Deno.readTextFile(
  "packages/fresh-ui/registry/theme/tokens.css",
);
const primitives = JSON.parse(
  await Deno.readTextFile("packages/fresh-ui/tokens/primitives.tokens.json"),
);
const semantic = JSON.parse(
  await Deno.readTextFile("packages/fresh-ui/tokens/semantic.tokens.json"),
);
const light = JSON.parse(
  await Deno.readTextFile("packages/fresh-ui/tokens/themes/light.tokens.json"),
);

const runDir =
  ".llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation";

function parseBlock(selector: ":root" | "light"): Map<string, string> {
  const pattern = selector === ":root"
    ? /:root\s*\{([\s\S]*?)\}\s*\n\s*\[data-theme='light'\]/m
    : /\[data-theme='light'\]\s*\{([\s\S]*?)\}/m;
  const block = css.match(pattern)?.[1];
  if (!block) throw new Error(`Missing ${selector} block`);
  return new Map(
    [...block.matchAll(/--ns-([a-z0-9-]+):\s*([^;]+);/g)].map((
      match,
    ) => [match[1], match[2].trim()]),
  );
}

function walkTokens(node: unknown, entries: Record<string, unknown>[] = []) {
  if (!node || typeof node !== "object") return entries;
  const record = node as Record<string, unknown>;
  if ("$value" in record) {
    entries.push(record);
    return entries;
  }
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith("$")) continue;
    walkTokens(value, entries);
  }
  return entries;
}

function tokenCssValue(token: Record<string, unknown>) {
  const value = token.$value;
  if (value && typeof value === "object") {
    const hex = (value as Record<string, unknown>).hex;
    if (typeof hex === "string") return hex;
  }
  if (typeof value === "string") {
    const colorRef = value.match(/^\{color\.([a-z0-9-]+)\.([a-z0-9-]+)\}$/);
    if (colorRef) return `var(--ns-${colorRef[1]}-${colorRef[2]})`;
    const flatRef = value.match(/^\{([a-z0-9-]+)\}$/);
    if (flatRef) return `var(--ns-${flatRef[1]})`;
  }
  return value;
}

function cssVarName(token: Record<string, unknown>) {
  const extensions = token.$extensions as Record<string, unknown> | undefined;
  const netscript = extensions?.netscript as
    | Record<string, unknown>
    | undefined;
  return typeof netscript?.cssVar === "string"
    ? netscript.cssVar.replace(/^--ns-/, "")
    : undefined;
}

function check(
  expected: Map<string, string>,
  tokens: Record<string, unknown>[],
) {
  const seen = new Map<string, unknown>();
  for (const token of tokens) {
    const name = cssVarName(token);
    if (!name) throw new Error("Token missing $extensions.netscript.cssVar");
    seen.set(name, tokenCssValue(token));
  }
  const missing = [...expected.keys()].filter((name) => !seen.has(name));
  const extra = [...seen.keys()].filter((name) => !expected.has(name));
  const valueMismatches = [...expected.entries()]
    .filter(([name]) => seen.has(name))
    .filter(([name, value]) => seen.get(name) !== value)
    .map(([name, value]) => ({ name, css: value, token: seen.get(name) }));
  return {
    expected: expected.size,
    actual: seen.size,
    missing,
    extra,
    valueMismatches,
  };
}

const result = {
  root: check(parseBlock(":root"), [
    ...walkTokens(primitives),
    ...walkTokens(semantic),
  ]),
  light: check(parseBlock("light"), walkTokens(light)),
};

await Deno.writeTextFile(
  `${runDir}/slice-02-token-parity.json`,
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(JSON.stringify(result, null, 2));

const failed = [result.root, result.light].some((entry) =>
  entry.missing.length || entry.extra.length || entry.valueMismatches.length
);
if (failed) Deno.exit(1);
