import { assert, assertEquals, assertMatch, assertStringIncludes } from '@std/assert';

const TOKENS_CSS = new URL('../../registry/theme/tokens.css', import.meta.url);
const TOKENS_JSON = new URL('../../registry/theme/tokens.json', import.meta.url);

/** Intents whose tint and border tokens must follow the base color. */
const INTENTS = ['primary', 'secondary', 'accent', 'success', 'warning', 'destructive'] as const;
/** Intents with an interactive hover companion. */
const HOVER_INTENTS = ['primary', 'secondary'] as const;

type TokenBlock = ReadonlyMap<string, string>;

interface TokenManifest {
  readonly tokens: Readonly<Record<string, { readonly value: string }>>;
  readonly themes: { readonly dark: Readonly<Record<string, { readonly value: string }>> };
}

const css = await Deno.readTextFile(TOKENS_CSS);
const root = readBlock(css, ':root');
const dark = readBlock(css, "[data-theme='dark']");

Deno.test('intent tints, borders, and hovers derive from their base color in both themes', () => {
  for (const block of [root, dark]) {
    for (const intent of INTENTS) {
      for (const companion of ['subtle', 'border']) {
        const name = `${intent}-${companion}`;
        const value = block.get(name);
        if (value === undefined) {
          // The dark block only overrides theme-variant roles; the rest inherit :root.
          assert(block === dark, `:root must declare --ns-${name}`);
          continue;
        }
        assertMatch(
          value,
          new RegExp(`^color-mix\\(in oklab, var\\(--ns-${intent}\\) \\d+%, transparent\\)$`),
          `--ns-${name}`,
        );
      }
    }
  }
  for (const intent of HOVER_INTENTS) {
    assertEquals(
      root.get(`${intent}-hover`),
      `color-mix(in oklab, var(--ns-${intent}) 86%, black)`,
    );
  }
});

Deno.test('accent and focus ring follow the primary brand knob', () => {
  assertEquals(root.get('accent'), 'var(--ns-primary)');
  assertEquals(root.get('accent-fg'), 'var(--ns-primary-fg)');
  assertEquals(root.get('ring'), 'var(--ns-primary)');
});

Deno.test('one :root edit rebrands both themes', () => {
  for (const knob of ['primary', 'primary-fg', 'accent', 'ring']) {
    assert(root.has(knob), `:root must declare --ns-${knob}`);
    assert(!dark.has(knob), `the dark block must inherit --ns-${knob} from :root`);
  }
});

Deno.test('tokens.json mirrors the derived CSS values', async () => {
  const manifest: TokenManifest = JSON.parse(await Deno.readTextFile(TOKENS_JSON));
  for (const intent of INTENTS) {
    for (const name of [`${intent}-subtle`, `${intent}-border`]) {
      assertEquals(manifest.tokens[name]?.value, root.get(name), name);
      if (dark.has(name)) assertEquals(manifest.themes.dark[name]?.value, dark.get(name), name);
    }
  }
});

Deno.test('the copied tokens.css header maps the app-wide theme chain', () => {
  const header = css.slice(0, css.indexOf('*/'));
  for (
    const fact of [
      'theme-bridge.css',
      'styles.css',
      'client.ts',
      "[data-theme='dark']",
      'routes/_app.tsx',
      '--ns-primary',
    ]
  ) {
    assertStringIncludes(header, fact);
  }
});

/** Reads the last declaration of every `--ns-*` property inside one top-level selector block. */
function readBlock(source: string, selector: string): TokenBlock {
  const start = source.indexOf(`${selector} {`);
  assert(start >= 0, `missing ${selector} block`);
  const end = source.indexOf('\n}', start);
  const body = source.slice(start, end);
  const declarations = new Map<string, string>();
  for (const match of body.matchAll(/^\s+--ns-([a-z0-9-]+):\s*(.+?);/gm)) {
    declarations.set(match[1], match[2]);
  }
  return declarations;
}
