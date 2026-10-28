import { legacy } from '../assets/legacy.generated.ts';
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
    '/* Generated through Style Dictionary 5.7.1; edit DTCG sources or semantic app overrides. */',
    legacy.css.trimEnd(),
  ];
  const modernSelectors: { selector: string; tokens: Readonly<Record<string, BuiltToken>> }[] = [];
  for (const context of selected) {
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
      } {\n  color-scheme: ${context.scheme};\n${declarations(context.tokens)}\n}`,
    );
    modernSelectors.push({ selector: selectors.join(',\n'), tokens: context.tokens });
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
  for (const [name, token] of Object.entries(context.tokens)) {
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
