import { assert, assertEquals, assertThrows } from '@std/assert';
import { AA_TEXT_CONTRAST, contrastRatio } from './contrast.ts';
import {
  generateTokens,
  loadCollections,
  resolveVariable,
  UTILITY_MODES,
} from './generate-tokens.ts';

Deno.test('every generated syntax role reaches AA on code and API table backgrounds in both schemes', async () => {
  const collections = await loadCollections();
  for (const Scheme of ['Light', 'Dark']) {
    const modes = { ...UTILITY_MODES, Scheme };
    const colour = (name: string) => String(resolveVariable(collections, `Scheme/${name}`, modes));
    const backgrounds = [colour('code/bg'), colour('surface/bg')];
    for (
      const name of ['keyword', 'function', 'type', 'string', 'number', 'comment', 'punctuation']
    ) {
      for (const background of backgrounds) {
        const ratio = contrastRatio(colour(`code/syntax/${name}`), background);
        assert(ratio >= AA_TEXT_CONTRAST, `${Scheme} ${name}: ${ratio.toFixed(4)}:1`);
      }
    }
    assert(contrastRatio(colour('important/text'), colour('important/subtle')) >= AA_TEXT_CONTRAST);
  }
});

Deno.test('contrast calculation rejects transparent paint and never rounds up a failure', () => {
  assertEquals(contrastRatio('#000000', '#ffffff'), 21);
  assertEquals(contrastRatio('rgb(0, 0, 0)', 'rgb(255, 255, 255)'), 21);
  assertEquals(contrastRatio('#ffffff', '#ffffff'), 1);
  assert(contrastRatio('#777777', '#ffffff') < AA_TEXT_CONTRAST);
  assertThrows(() => contrastRatio('rgba(0, 0, 0, 0.5)', '#ffffff'), Error, 'opaque sRGB');
});

Deno.test('generated API kind text reaches AA on canvas, code and surface without changing syntax', async () => {
  const collections = await loadCollections();
  const css = generateTokens(collections);
  for (const scheme of ['light', 'dark']) {
    const modes = { ...UTILITY_MODES, Scheme: scheme === 'light' ? 'Light' : 'Dark' };
    const block = css.split(`:root[data-scheme="${scheme}"] {`)[1].split('}')[0];
    const tokens = new Map(
      [...block.matchAll(/(--ns-[\w-]+): ([^;]+);/g)].map((m) => [m[1], m[2]]),
    );
    const backgrounds = ['--ns-bg', '--ns-code-bg', '--ns-surface'].map((name) =>
      tokens.get(name)!
    );
    for (
      const [role, ramp] of Object.entries({
        keyword: 'violet',
        function: 'blue',
        type: 'teal',
        number: 'orange',
      })
    ) {
      const syntax = String(resolveVariable(collections, `Scheme/code/syntax/${role}`, modes));
      assertEquals(tokens.get(`--ns-code-syntax-${role}`), syntax);
      const expected = scheme === 'light' && role !== 'keyword'
        ? String(resolveVariable(collections, `Primitives/color/${ramp}/l/12`, modes))
        : syntax;
      assertEquals(tokens.get(`--ns-studio-api-kind-${role}-text`), expected);
      for (const bg of backgrounds) {
        assert(contrastRatio(expected, bg) >= AA_TEXT_CONTRAST, `${scheme} ${role} on ${bg}`);
      }
    }
    for (const bg of backgrounds) {
      assert(contrastRatio(tokens.get('--ns-fg')!, bg) >= AA_TEXT_CONTRAST);
    }
  }
});
