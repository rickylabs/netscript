import StyleDictionary from "npm:style-dictionary@5.4.4";

type TokenValue =
  | string
  | number
  | {
    colorSpace?: string;
    components?: number[];
    hex?: string;
  };

type DictionaryToken = {
  $type?: string;
  original?: {
    $value?: TokenValue;
  };
  $value?: TokenValue;
  $extensions?: {
    netscript?: {
      cssVar?: string;
    };
  };
  filePath?: string;
  path?: string[];
};

const ROOT_GROUPS = [
  range("gray", 1, 12),
  range("copper", 1, 8),
  range("teal", 1, 7),
  range("slate", 1, 7),
  ["red-4", "red-5", "red-6", "red-7"],
  ["amber-4", "amber-5", "amber-6"],
  ["bg", "fg", "surface", "surface-raised", "overlay"],
  ["card", "card-fg"],
  [
    "primary",
    "primary-fg",
    "primary-hover",
    "primary-subtle",
    "primary-border",
  ],
  [
    "secondary",
    "secondary-fg",
    "secondary-hover",
    "secondary-subtle",
    "secondary-border",
  ],
  ["muted", "muted-fg"],
  ["accent", "accent-fg", "accent-subtle", "accent-border"],
  ["success", "success-fg", "success-subtle", "success-border"],
  ["warning", "warning-fg", "warning-subtle", "warning-border"],
  ["destructive", "destructive-fg", "destructive-subtle", "destructive-border"],
  ["border", "border-hover", "border-strong", "input-border", "ring"],
  ["font-sans", "font-mono"],
  [
    "text-xs",
    "text-sm",
    "text-base",
    "text-lg",
    "text-xl",
    "text-2xl",
    "text-3xl",
    "text-4xl",
  ],
  ["leading-tight", "leading-snug", "leading-normal", "leading-relaxed"],
  ["tracking-tight", "tracking-normal", "tracking-wide"],
  [
    "space-0",
    "space-px",
    "space-0-5",
    "space-1",
    "space-1-5",
    "space-2",
    "space-3",
    "space-4",
    "space-5",
    "space-6",
    "space-8",
    "space-10",
    "space-12",
    "space-16",
    "space-20",
  ],
  [
    "radius-sm",
    "radius-md",
    "radius-lg",
    "radius-xl",
    "radius-2xl",
    "radius-full",
  ],
  ["shadow-xs", "shadow-sm", "shadow-md", "shadow-lg", "shadow-xl"],
  ["ease-fast", "ease-normal", "ease-slow", "ease-spring"],
  ["z-base", "z-dropdown", "z-sticky", "z-overlay", "z-modal", "z-toast"],
];

const LIGHT_GROUPS = [
  ["bg", "fg", "surface", "surface-raised", "overlay"],
  ["card", "card-fg"],
  ["primary-subtle", "primary-border", "secondary-subtle", "secondary-border"],
  ["muted", "muted-fg"],
  [
    "success-subtle",
    "success-border",
    "warning-subtle",
    "warning-border",
    "destructive-subtle",
    "destructive-border",
  ],
  ["border", "border-hover", "border-strong", "input-border"],
  ["shadow-xs", "shadow-sm", "shadow-md", "shadow-lg"],
];

const PACKAGE_ROOT = new URL("../", import.meta.url);
Deno.chdir(PACKAGE_ROOT);

const darkTheme = await readJson("tokens/themes/dark.tokens.json");
const lightTheme = await readJson("tokens/themes/light.tokens.json");
const rootTokens = await loadDictionaryTokens({
  include: ["tokens/primitives.tokens.json"],
  source: ["tokens/semantic.tokens.json"],
});
const lightTokens = await loadDictionaryTokens({
  include: ["tokens/primitives.tokens.json"],
  source: ["tokens/themes/light.tokens.json"],
});

const css = [
  "/*",
  " * Initial token seed for @netscript/fresh-ui.",
  " *",
  " * Current state:",
  " *   - checked-in CSS custom properties",
  " *   - copied into consumer apps as owned source",
  " *",
  " * Planned direction:",
  " *   - Style Dictionary becomes the canonical token source",
  " *   - this file becomes a generated artifact",
  " */",
  "",
  ":root {",
  ...renderBlock(rootTokens, themeColorScheme(darkTheme, "dark"), ROOT_GROUPS),
  "}",
  "",
  "[data-theme='light'] {",
  ...renderBlock(
    lightTokens.filter((token) =>
      token.filePath?.endsWith("tokens/themes/light.tokens.json")
    ),
    themeColorScheme(lightTheme, "light"),
    LIGHT_GROUPS,
  ),
  "}",
].join("\n");

await Deno.writeTextFile("registry/theme/tokens.css", css);
await Deno.writeTextFile(
  "registry/theme/theme-bridge.css",
  renderThemeBridge(rootTokens),
);
await Deno.writeTextFile(
  "registry/theme/tokens.json",
  `${JSON.stringify(renderTokensJson(rootTokens, lightTokens), null, 2)}\n`,
);

async function loadDictionaryTokens(
  options: { include: string[]; source: string[] },
) {
  const dictionary = new StyleDictionary({
    include: options.include,
    source: options.source,
    platforms: {
      css: {
        transformGroup: "css",
      },
    },
  });
  await dictionary.init();
  const tokens = await dictionary.getPlatformTokens("css");
  return (tokens.allTokens as DictionaryToken[]).filter((token) =>
    tokenSourceCssVar(token)
  );
}

function renderBlock(
  tokens: DictionaryToken[],
  colorScheme: string,
  groups: string[][],
) {
  const values = new Map(tokens.map((token) => {
    const name = tokenSourceCssVar(token)?.replace(/^--ns-/, "");
    if (!name) throw new Error("Token is missing $extensions.netscript.cssVar");
    return [name, tokenCssDeclarations(name, token)] as const;
  }));
  const claimed = new Set<string>();
  const lines = [`  color-scheme: ${colorScheme};`];

  for (const group of groups) {
    lines.push("");
    for (const name of group) {
      const value = values.get(name);
      if (value === undefined) {
        throw new Error(`Missing token for --ns-${name}`);
      }
      claimed.add(name);
      lines.push(...value);
    }
  }

  const extras = [...values.keys()].filter((name) => !claimed.has(name));
  if (extras.length) {
    throw new Error(
      `Token layout is missing ${
        extras.map((name) => `--ns-${name}`).join(", ")
      }`,
    );
  }

  return lines;
}

function tokenCssDeclarations(name: string, token: DictionaryToken) {
  const value = token.original?.$value ?? token.$value;
  if (
    value && typeof value === "object" &&
    value.colorSpace === "oklch" &&
    Array.isArray(value.components) &&
    typeof value.hex === "string"
  ) {
    return [
      `  --ns-${name}: ${value.hex};`,
      `  --ns-${name}: ${oklchCssValue(value.components)};`,
    ];
  }
  return [`  --ns-${name}: ${tokenCssValue(token)};`];
}

function tokenCssValue(token: DictionaryToken) {
  const value = token.original?.$value ?? token.$value;
  if (
    value && typeof value === "object" &&
    value.colorSpace === "oklch" &&
    Array.isArray(value.components)
  ) {
    return oklchCssValue(value.components);
  }
  if (value && typeof value === "object" && typeof value.hex === "string") {
    return value.hex;
  }
  if (typeof value === "string") {
    const colorRef = value.match(/^\{color\.([a-z0-9-]+)\.([a-z0-9-]+)\}$/);
    if (colorRef) return `var(--ns-${colorRef[1]}-${colorRef[2]})`;
    const flatRef = value.match(/^\{([a-z0-9-]+)\}$/);
    if (flatRef) return `var(--ns-${flatRef[1]})`;
    return value;
  }
  return String(value);
}

function oklchCssValue(components: number[]) {
  const [lightness, chroma, hue] = components;
  return `oklch(${round(lightness * 100, 2)}% ${round(chroma, 4)} ${
    round(hue, 2)
  })`;
}

function tokenSourceCssVar(token: DictionaryToken) {
  return token.$extensions?.netscript?.cssVar;
}

function renderThemeBridge(tokens: DictionaryToken[]) {
  const colorLines = tokens
    .filter((token) => token.$type === "color")
    .map((token) => tokenSourceCssVar(token)?.replace(/^--ns-/, ""))
    .filter((name): name is string => Boolean(name))
    .filter((name) => !isPrimitiveColorName(name))
    .map((name) => `  --color-ns-${name}: var(--ns-${name});`);

  const lines = [
    "/* Generated by `deno task tokens:build`. */",
    "@theme inline {",
    ...colorLines,
    "  --color-ns-input: var(--ns-input-border);",
    "  --font-sans: var(--ns-font-sans);",
    "  --font-mono: var(--ns-font-mono);",
    "  --spacing-ns-0: var(--ns-space-0);",
    "  --spacing-ns-px: var(--ns-space-px);",
    "  --spacing-ns-0-5: var(--ns-space-0-5);",
    "  --spacing-ns-1: var(--ns-space-1);",
    "  --spacing-ns-1-5: var(--ns-space-1-5);",
    "  --spacing-ns-2: var(--ns-space-2);",
    "  --spacing-ns-3: var(--ns-space-3);",
    "  --spacing-ns-4: var(--ns-space-4);",
    "  --spacing-ns-5: var(--ns-space-5);",
    "  --spacing-ns-6: var(--ns-space-6);",
    "  --spacing-ns-8: var(--ns-space-8);",
    "  --spacing-ns-10: var(--ns-space-10);",
    "  --spacing-ns-12: var(--ns-space-12);",
    "  --spacing-ns-16: var(--ns-space-16);",
    "  --spacing-ns-20: var(--ns-space-20);",
    "  --radius-xs: 2px;",
    "  --radius-sm: var(--ns-radius-sm);",
    "  --radius-md: var(--ns-radius-md);",
    "  --radius-lg: var(--ns-radius-lg);",
    "  --radius-xl: var(--ns-radius-xl);",
    "  --radius-2xl: var(--ns-radius-2xl);",
    "  --radius-ns-sm: var(--ns-radius-sm);",
    "  --radius-ns-md: var(--ns-radius-md);",
    "  --radius-ns-lg: var(--ns-radius-lg);",
    "  --radius-ns-xl: var(--ns-radius-xl);",
    "  --radius-ns-2xl: var(--ns-radius-2xl);",
    "  --radius-ns-full: var(--ns-radius-full);",
    "  --shadow-xs: var(--ns-shadow-xs);",
    "  --shadow-sm: var(--ns-shadow-sm);",
    "  --shadow-md: var(--ns-shadow-md);",
    "  --shadow-lg: var(--ns-shadow-lg);",
    "  --shadow-ns-xs: var(--ns-shadow-xs);",
    "  --shadow-ns-sm: var(--ns-shadow-sm);",
    "  --shadow-ns-md: var(--ns-shadow-md);",
    "  --shadow-ns-lg: var(--ns-shadow-lg);",
    "  --shadow-ns-xl: var(--ns-shadow-xl);",
    "}",
    "",
  ];

  return lines.join("\n");
}

function renderTokensJson(
  rootTokens: DictionaryToken[],
  lightTokens: DictionaryToken[],
) {
  return {
    version: 1,
    generatedBy: "packages/fresh-ui/scripts/build-tokens.ts",
    tokens: flatTokenMap(rootTokens),
    themes: {
      light: flatTokenMap(
        lightTokens.filter((token) =>
          token.filePath?.endsWith("tokens/themes/light.tokens.json")
        ),
      ),
    },
  };
}

function flatTokenMap(tokens: DictionaryToken[]) {
  return Object.fromEntries(tokens.map((token) => {
    const cssVar = tokenSourceCssVar(token);
    if (!cssVar) {
      throw new Error("Token is missing $extensions.netscript.cssVar");
    }
    const name = cssVar.replace(/^--ns-/, "");
    return [name, {
      type: token.$type ?? "string",
      value: tokenCssValue(token),
      cssVar,
      path: token.path ?? [],
    }];
  }));
}

function isPrimitiveColorName(name: string) {
  return /^(gray|copper|teal|slate|red|amber)-/.test(name);
}

async function readJson(path: string) {
  return JSON.parse(await Deno.readTextFile(path));
}

function themeColorScheme(theme: Record<string, unknown>, fallback: string) {
  const extensions = theme.$extensions as Record<string, unknown> | undefined;
  const netscript = extensions?.netscript as
    | Record<string, unknown>
    | undefined;
  return typeof netscript?.colorScheme === "string"
    ? netscript.colorScheme
    : fallback;
}

function range(prefix: string, start: number, end: number) {
  return Array.from(
    { length: end - start + 1 },
    (_, index) => `${prefix}-${start + index}`,
  );
}

function round(value: number, places: number) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
