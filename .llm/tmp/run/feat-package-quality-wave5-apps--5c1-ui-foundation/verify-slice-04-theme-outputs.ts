const runDir =
  ".llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation";
const styles = await Deno.readTextFile(
  "packages/fresh-ui/registry/theme/styles.css",
);
const bridge = await Deno.readTextFile(
  "packages/fresh-ui/registry/theme/theme-bridge.css",
);
const tokens = JSON.parse(
  await Deno.readTextFile("packages/fresh-ui/registry/theme/tokens.json"),
);

const requiredBridgeLines = [
  "--color-ns-bg: var(--ns-bg);",
  "--color-ns-fg: var(--ns-fg);",
  "--color-ns-primary: var(--ns-primary);",
  "--color-ns-input: var(--ns-input-border);",
  "--font-sans: var(--ns-font-sans);",
  "--font-mono: var(--ns-font-mono);",
  "--radius-sm: var(--ns-radius-sm);",
  "--shadow-sm: var(--ns-shadow-sm);",
  "--spacing-ns-4: var(--ns-space-4);",
];

const result = {
  stylesImportsBridge: styles.includes('@import "./theme-bridge.css";'),
  stylesInlineThemeBlocks: [...styles.matchAll(/@theme\b/g)].length,
  bridgeUsesThemeInline: /@theme\s+inline\s*\{/.test(bridge),
  missingBridgeLines: requiredBridgeLines.filter((line) =>
    !bridge.includes(line)
  ),
  rootTokenCount: Object.keys(tokens.tokens ?? {}).length,
  lightTokenCount: Object.keys(tokens.themes?.light ?? {}).length,
};

await Deno.writeTextFile(
  `${runDir}/slice-04-theme-output-integrity.json`,
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(JSON.stringify(result, null, 2));

if (
  !result.stylesImportsBridge ||
  result.stylesInlineThemeBlocks !== 0 ||
  !result.bridgeUsesThemeInline ||
  result.missingBridgeLines.length ||
  result.rootTokenCount !== 134 ||
  result.lightTokenCount !== 27
) {
  Deno.exit(1);
}
