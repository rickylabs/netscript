import { legacy } from '../assets/legacy.generated.ts';
import { TOKEN_PRESETS } from '../domain/token-presets.ts';
import type { BuiltToken, TokenContextOutput } from '../domain/token-output.ts';

/** Deduplicate effective presets while retaining all requested inputs in build metadata. */
export function effectiveContexts(contexts: readonly TokenContextOutput[]): TokenContextOutput[] {
  const seen = new Set<string>();
  return contexts.filter((context) => {
    const key = `${context.preset.id}/${context.scheme}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

type ModernColor = 'oklch' | 'mix';

function modernColor(token: BuiltToken): ModernColor | undefined {
  return token.type !== 'color'
    ? undefined
    : token.value.startsWith('oklch(')
    ? 'oklch'
    : token.value.startsWith('color-mix(')
    ? 'mix'
    : undefined;
}

function declarations(tokens: Readonly<Record<string, BuiltToken>>, modern?: ModernColor): string {
  return Object.values(tokens).filter((token) => !modern || modernColor(token) === modern).map(
    (token) => {
      // Custom properties accept unsupported functions; real fallbacks need @supports.
      const value = !modern && modernColor(token) ? token.hex : token.value;
      if (value === undefined) throw new Error(`Missing color fallback: ${token.cssVar}`);
      return `  ${token.cssVar}: ${value};${token.path[0] === 'ease' ? ' /* @kind other */' : ''}`;
    },
  ).join('\n');
}

/** NS One needs its compatibility ramps and core roles, not every other language pack. */
function appContextTokens(context: TokenContextOutput): Readonly<Record<string, BuiltToken>> {
  if (context.preset.id !== 'ns-one') return context.tokens;
  const packs = new Set(
    TOKEN_PRESETS.map((preset) => preset.language).filter((name) => name !== 'ns-one'),
  );
  const names = new Set(
    Object.entries(context.tokens).filter(([name, token]) =>
      !token.sourceOnly &&
      ![...packs].some((pack) => name.startsWith(`${pack}-`)) &&
      (token.path[0] !== 'color' || Object.hasOwn(legacy.tokens, name))
    ).map(([name]) => name),
  );
  // Preserve references introduced by app aliases, including a normally unused ramp or pack.
  const visit = (name: string): void => {
    const token = context.tokens[name];
    if (!token) throw new Error(`Unknown CSS token dependency: ${name}`);
    for (const match of token.value.matchAll(/var\(--ns-([a-z0-9-]+)/g)) {
      if (!names.has(match[1])) {
        names.add(match[1]);
        visit(match[1]);
      }
    }
  };
  for (const name of names) visit(name);
  return Object.fromEntries(Object.entries(context.tokens).filter(([name]) => names.has(name)));
}

/** Ship only the configured preset and the NS One compatibility contexts. */
export function formatTokensCss(
  contexts: readonly TokenContextOutput[],
  defaultPreset: string,
): string {
  const unique = effectiveContexts(contexts);
  // Compatibility follows configured defaults so legacy selectors beat :root on a tie.
  const selected = [
    ...unique.filter((context) => context.preset.id === defaultPreset),
    ...unique.filter((context) => defaultPreset !== 'ns-one' && context.preset.id === 'ns-one'),
  ];
  const blocks = [
    legacy.css,
    '/* Generated through Style Dictionary 5.7.1; edit DTCG sources or semantic app overrides. */',
  ];
  const modernSelectors: { selector: string; tokens: Readonly<Record<string, BuiltToken>> }[] = [];
  for (const context of selected) {
    const tokens = appContextTokens(context);
    const { language, flavor } = context.preset;
    const scheme = context.scheme === 'dark'
      ? "[data-scheme='dark']"
      : ":not([data-scheme='dark'])";
    const base = `[data-theme='${language}']${flavor ? `[data-flavor='${flavor}']` : ''}`;
    const selectors = [`${base}${scheme}`];
    if (context.preset.id === defaultPreset && context.scheme === 'light') {
      selectors.unshift(':root');
    }
    if (context.preset.id === 'studio-utility') {
      selectors.push(`[data-theme='studio']:not([data-flavor])${scheme}`);
    }
    if (context.preset.id === 'ns-one') {
      selectors.push(`[data-theme='${context.scheme}']`);
      if (context.scheme === 'dark') selectors.push("[data-scheme='dark']:not([data-theme])");
    }
    blocks.push(
      `/* Preset ${context.preset.id}/${context.scheme} */\n${
        selectors.join(',\n')
      } {\n  color-scheme: ${context.scheme};\n${declarations(tokens)}\n}`,
    );
    modernSelectors.push({ selector: selectors.join(',\n'), tokens });
  }
  for (
    const [kind, condition] of [
      ['oklch', '(color: oklch(50% 0.1 120))'],
      ['mix', '(color: oklch(50% 0.1 120)) and (color: color-mix(in oklab, red, blue))'],
    ] as const
  ) {
    const modern = modernSelectors.map(({ selector, tokens }) => {
      const values = declarations(tokens, kind);
      return values ? `${selector} {\n${values}\n}` : '';
    }).filter(Boolean);
    blocks.push(`@supports ${condition} {\n${modern.join('\n\n')}\n}`);
  }
  return blocks.join('\n\n') + '\n';
}

/** Extend the original bridge without changing any existing Tailwind aliases. */
export function formatThemeBridge(context: TokenContextOutput, oldBridge: string): string {
  const known = new Set(Object.keys(legacy.tokens));
  const lines: string[] = [];
  for (const [name, token] of Object.entries(appContextTokens(context))) {
    if (known.has(name) || token.path[0] === 'component') continue;
    if (token.type === 'color' && token.path[0] !== 'color') {
      lines.push(`  --color-ns-${name}: var(${token.cssVar});`);
    } else if (name.startsWith('font-') && token.type === 'fontFamily') {
      lines.push(`  --font-${name.slice(5)}: var(${token.cssVar});`);
    } else if (name.startsWith('radius-')) {
      lines.push(`  --radius-ns-${name.slice(7)}: var(${token.cssVar});`);
    } else if (name.startsWith('text-')) {
      lines.push(`  --text-ns-${name.slice(5)}: var(${token.cssVar});`);
    }
  }
  return oldBridge.trimEnd() + '\n\n@theme inline {\n' + lines.join('\n') + '\n}\n';
}
