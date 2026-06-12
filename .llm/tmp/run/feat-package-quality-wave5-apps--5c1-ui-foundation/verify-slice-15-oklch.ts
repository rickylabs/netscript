type ColorToken = {
  $value?: {
    colorSpace?: string;
    components?: unknown[];
    hex?: string;
  };
  $extensions?: {
    netscript?: {
      cssVar?: string;
    };
  };
};

type PrimitiveTokens = {
  color: Record<string, Record<string, ColorToken>>;
};

const TARGETS = {
  gray: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
  copper: ["1", "2", "3", "4", "5", "6", "7", "8"],
  teal: ["1", "2", "3", "4", "5", "6", "7"],
  slate: ["1", "2", "3", "4", "5", "6", "7"],
  red: ["4", "5", "6", "7"],
  amber: ["4", "5", "6"],
} as const;

const primitives = JSON.parse(
  await Deno.readTextFile("packages/fresh-ui/tokens/primitives.tokens.json"),
) as PrimitiveTokens;
const css = await Deno.readTextFile(
  "packages/fresh-ui/registry/theme/tokens.css",
);
const visualHtml =
  ".llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-15-oklch-visual-review.html";
const visualPng =
  ".llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-15-oklch-visual-review.png";

const failures: string[] = [];
let checked = 0;

for (const [family, steps] of Object.entries(TARGETS)) {
  for (const step of steps) {
    const token = primitives.color[family]?.[step];
    const cssVar = token?.$extensions?.netscript?.cssVar ??
      `--ns-${family}-${step}`;
    checked += 1;

    if (token?.$value?.colorSpace !== "oklch") {
      failures.push(`${cssVar}: expected source colorSpace oklch`);
    }
    if (
      !Array.isArray(token?.$value?.components) ||
      token.$value.components.length !== 3
    ) {
      failures.push(`${cssVar}: expected three OKLCH components`);
    }
    if (
      typeof token?.$value?.hex !== "string" ||
      !/^#[0-9a-f]{6}$/i.test(token.$value.hex)
    ) {
      failures.push(`${cssVar}: expected hex fallback`);
    }
    if (!css.includes(`  ${cssVar}: ${token?.$value?.hex};`)) {
      failures.push(`${cssVar}: missing CSS hex fallback declaration`);
    }
    if (!new RegExp(`  ${escapeRegExp(cssVar)}: oklch\\(`).test(css)) {
      failures.push(`${cssVar}: missing CSS OKLCH declaration`);
    }
  }
}

const htmlStat = await Deno.stat(visualHtml).catch(() => undefined);
const pngStat = await Deno.stat(visualPng).catch(() => undefined);
if (!htmlStat?.isFile) failures.push("visual review HTML missing");
if (!pngStat?.isFile || pngStat.size === 0) {
  failures.push("visual review PNG missing");
}

const result = {
  checked,
  failures,
  visualReview: {
    html: visualHtml,
    png: visualPng,
    pngBytes: pngStat?.size ?? 0,
  },
};

await Deno.writeTextFile(
  ".llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/slice-15-oklch-verification.json",
  `${JSON.stringify(result, null, 2)}\n`,
);

if (failures.length) {
  console.error(JSON.stringify(result, null, 2));
  Deno.exit(1);
}

console.log(`slice-15-oklch: PASS ${checked} color tokens verified`);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
