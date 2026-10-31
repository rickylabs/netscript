import { assert, assertEquals, assertThrows } from '@std/assert';
import { importFigmaTokens } from '../../src/tokens/adapters/figma-token-source.ts';
import { figmaCollections } from '../../src/tokens/adapters/figma-collections.ts';
import { figmaPrimitive } from '../../src/tokens/adapters/token-values.ts';
import { resolveFigmaValue } from '../../src/tokens/domain/figma-aliases.ts';
import { figmaModes, TOKEN_PRESETS, tokenPreset } from '../../src/tokens/domain/token-presets.ts';
import { tokenEntries } from '../../src/tokens/domain/token-contract.ts';
import type { DesignToken, TokenDocument } from '../../src/tokens/domain/token-contract.ts';
import { legacy } from '../../src/tokens/assets/legacy.generated.ts';
import { nameMigrations } from '../../src/tokens/assets/metadata.generated.ts';

const collections = figmaCollections();
let imported: ReturnType<typeof importFigmaTokens> | undefined;
const sources = () => imported ??= importFigmaTokens(collections, legacy);

Deno.test('every Theme/Theme B language has its own routed preset, including all faithful modes', () => {
  assertEquals(TOKEN_PRESETS.length, 24);
  for (const [name, set] of [['Theme', 'A'], ['Theme B', 'B']] as const) {
    const collection = collections.find((entry) => entry.collection === name)!;
    for (const mode of collection.modes) {
      assert(
        TOKEN_PRESETS.some((preset) => preset.themeSet === set && preset.themeMode === mode),
        mode,
      );
    }
  }
  for (
    const id of [
      'bloom',
      'cupertino',
      'liquid',
      'terminal',
      'macos-27',
      'apple-classic',
      'fluent-2-web',
    ]
  ) {
    assertEquals(tokenPreset(id).themeSet, 'B');
  }
  assertEquals(figmaModes(tokenPreset('studio-ledger'), 'dark')['Studio flavor'], 'Ledger');
  assertEquals(figmaModes(tokenPreset('ledger'), 'dark').Theme, 'Ledger');
  assertEquals(figmaModes(tokenPreset('liquid'), 'dark')['Theme B'], 'Liquid');
});

Deno.test('all exported Figma roles retain source values, collision types and routing metadata', () => {
  const imported = sources();
  const primitives = new Map(
    tokenEntries(imported.primitives).map(({ path, token }) => [path, token]),
  );
  for (const preset of TOKEN_PRESETS.filter((entry) => entry.id !== 'ns-one')) {
    for (const scheme of ['light', 'dark'] as const) {
      const contexts = (imported.presets[preset.id] as TokenDocument).context as TokenDocument;
      const tokens = contexts[scheme] as TokenDocument;
      for (const collection of collections) {
        if (['Primitives', 'Theme', 'Theme B'].includes(collection.collection)) continue;
        for (const variable of collection.variables) {
          // All variables, even hidden/no-code variables, must resolve for faithful eligibility.
          const resolved = resolveFigmaValue(
            collections,
            collection.collection,
            variable.name,
            figmaModes(preset, scheme),
          );
          if (!variable.codeSyntax) continue;
          const migration = nameMigrations.migrations.find((entry) =>
            entry.collection === collection.collection && entry.variable === variable.name
          );
          const name = migration?.cssVar.slice(5) ?? variable.codeSyntax.slice(9, -1);
          const token = tokens[name] as DesignToken;
          assert(token, `${preset.id}/${scheme}/${name}`);
          const value = primitives.get(String(token.$value).slice(1, -1));
          assertEquals(
            value,
            figmaPrimitive(variable.name, variable.type, resolved.value),
            `${preset.id}/${scheme}/${name}`,
          );
          assertEquals(token.$extensions?.netscript?.figma?.themeSet, preset.themeSet);
          assertEquals(token.$extensions?.netscript?.figma?.themeMode, preset.themeMode);
        }
      }
      for (const migration of nameMigrations.migrations) {
        assertEquals((tokens[migration.cssVar.slice(5)] as DesignToken).$type, 'dimension');
        assertEquals((tokens[migration.originalCssVar.slice(5)] as DesignToken).$type, 'color');
      }
    }
  }
});

Deno.test('collection order and inactive Theme values cannot overwrite routed names', () => {
  const expected = sources();
  assertEquals(importFigmaTokens([...collections].reverse(), legacy), expected);
  const changed = structuredClone(collections);
  const theme = changed.find((entry) => entry.collection === 'Theme')!;
  const canvas = theme.variables.find((entry) => entry.name === 'surface/l/canvas')!;
  Object.assign(canvas.values, { Studio: '#123456' });
  const result = importFigmaTokens(changed, legacy);
  // Primitive IDs can change as active A contexts change: compare resolved B values instead.
  const literals = (source: typeof result, id: string) => {
    const primitive = new Map(
      tokenEntries(source.primitives).map(({ path, token }) => [path, token]),
    );
    return tokenEntries(source.presets[id] as TokenDocument).map((
      { path, token },
    ) => [path, primitive.get(String(token.$value).slice(1, -1)) ?? token]);
  };
  for (const preset of TOKEN_PRESETS.filter((entry) => entry.themeSet === 'B')) {
    assertEquals(literals(result, preset.id), literals(expected, preset.id));
  }
  const other = structuredClone(collections);
  const themeB = other.find((entry) => entry.collection === 'Theme B')!;
  Object.assign(themeB.variables.find((entry) => entry.name === 'surface/l/canvas')!.values, {
    Bloom: '#654321',
  });
  const a = importFigmaTokens(other, legacy);
  for (const preset of TOKEN_PRESETS.filter((entry) => entry.themeSet === 'A')) {
    assertEquals(literals(a, preset.id), literals(expected, preset.id));
  }
});

Deno.test('unexpected shared WEB names and mismatched router definitions fail before import', () => {
  const duplicate = structuredClone(collections);
  const density = duplicate.find((entry) => entry.collection === 'Density')!;
  const variable = { ...density.variables[0], codeSyntax: 'var(--ns-bg)' };
  Object.assign(density, { variables: [...density.variables, variable] });
  assertThrows(() => importFigmaTokens(duplicate, legacy), Error, 'Duplicate Figma WEB name');
  const changed = structuredClone(collections);
  const theme = changed.find((entry) => entry.collection === 'Theme B')!;
  Object.assign(theme.variables[0], { codeSyntax: 'var(--ns-other)' });
  assertThrows(() => importFigmaTokens(changed, legacy), Error, 'Inconsistent shared Figma names');
});

Deno.test('misrouted router aliases and orphaned collision migrations fail closed', () => {
  const changed = structuredClone(collections);
  const router = changed.find((entry) => entry.collection === 'Theme set')!;
  Object.assign(router.variables[0].values, { A: { alias: 'Theme/surface/l/canvas' } });
  assertThrows(() => importFigmaTokens(changed, legacy), Error, 'Misrouted Figma Theme set');
  const removed = structuredClone(collections);
  const flavor = removed.find((entry) => entry.collection === 'Studio flavor')!;
  Object.assign(flavor, {
    variables: flavor.variables.filter((variable) => variable.name !== 'table/cell-rule'),
  });
  assertThrows(() => importFigmaTokens(removed, legacy), Error, 'Orphaned name migration');
});
