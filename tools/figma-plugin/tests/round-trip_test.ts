import { assert, assertEquals, assertThrows } from '@std/assert';
import { collections } from '../../../packages/fresh-ui/src/tokens/assets/figma.generated.ts';
import {
  exportFigmaTokenBundle,
  importFigmaTokenBundle,
} from '../../../packages/fresh-ui/src/tokens/adapters/figma-round-trip.ts';
import { assertFigmaTokenNames } from '../../../packages/fresh-ui/src/tokens/adapters/figma-token-names.ts';
import { resolveTokenSources } from '../../../packages/fresh-ui/src/tokens/domain/resolve-tokens.ts';
import { Ajv } from 'npm:ajv@8.20.0';
import {
  formatSchema,
  resolverSchema,
} from '../../../packages/fresh-ui/src/tokens/assets/schemas.generated.ts';
import { exportSnapshot, snapshotFiles, snapshotValue } from '../src/snapshot.ts';
import { fixtureFigma } from './mock-figma.ts';

Deno.test('Plugin API export reproduces all ten handoff fixtures byte-for-byte', async () => {
  const api = fixtureFigma(collections);
  const snapshot = await exportSnapshot(api);
  const files = snapshotFiles(snapshot, 'pGRLnkPPRZJZy74evNcQBr', '2026-10-31');
  assertEquals(
    snapshotFiles(
      importFigmaTokenBundle(exportFigmaTokenBundle(snapshot)),
      'pGRLnkPPRZJZy74evNcQBr',
      '2026-10-31',
    ),
    files,
  );
  assertEquals(Object.keys(files).length, 10);
  assertEquals(snapshot.reduce((sum, collection) => sum + collection.variables.length, 0), 2186);
  for (const [name, bytes] of Object.entries(files)) {
    assertEquals(
      bytes,
      await Deno.readTextFile(
        new URL(
          `../../../.llm/runs/docs-fresh-ui-design-system--design-handoff/figma-variables/${name}`,
          import.meta.url,
        ),
      ),
      name,
    );
  }
  assertEquals(api.mutations, 0);
});

Deno.test('DTCG 2025.10 preserves every mode, alias, WEB name, float and oklch', () => {
  const bundle = exportFigmaTokenBundle(collections);
  const validate = new Ajv({ strict: false, validateFormats: false }).compile(formatSchema);
  const resolver = new Ajv({ strict: false, validateFormats: false }).compile(resolverSchema);
  assert(resolver(bundle.sources.resolver), JSON.stringify(resolver.errors));
  for (const document of Object.values(bundle.sources.documents)) {
    assert(validate(document), JSON.stringify(validate.errors));
  }
  assertEquals(importFigmaTokenBundle(bundle), collections);
  const router = bundle.collections.findIndex((entry) => entry.collection === 'Theme set');
  const themeB = bundle.collections.findIndex((entry) => entry.collection === 'Theme B');
  const b = resolveTokenSources(bundle.sources, { [`c${router}`]: 'B', [`c${themeB}`]: 'Liquid' });
  assert(b[`c${router}`]);
  const serialized = JSON.stringify(bundle);
  assert(serialized.includes('oklch'));
  assert(serialized.includes('-2.4000000953674316'));
});

Deno.test('alpha and absent alpha use exact fixture channel rounding', () => {
  assertEquals(snapshotValue({ r: 1, g: 0, b: 0, a: 4 / 255 }, new Map()), '#ff000004');
  assertEquals(snapshotValue({ r: 1, g: 0, b: 0 }, new Map()), '#ff0000');
});

Deno.test('unknown WEB names and unknown variable identities fail with their origin', () => {
  const changed = structuredClone(collections);
  const scheme = changed.find((collection) => collection.collection === 'Scheme')!;
  const variable = scheme.variables[0];
  const data = { ...variable, codeSyntax: 'var(--ns-unknown-token)' };
  const input = changed.map((collection) =>
    collection === scheme
      ? { ...collection, variables: [data, ...collection.variables.slice(1)] }
      : collection
  );
  assertThrows(() => assertFigmaTokenNames(input), Error, `Scheme/${variable.name}`);
  const unknown = changed.map((collection) =>
    collection.collection === 'Scheme'
      ? {
        ...collection,
        variables: [...collection.variables, { ...variable, name: 'unknown/new' }],
      }
      : collection
  );
  assertThrows(
    () => exportFigmaTokenBundle(unknown),
    Error,
    'Unknown Figma token name: Scheme/unknown/new',
  );
});

Deno.test('malformed sources, alias targets and resolver URLs fail before import', () => {
  const original = exportFigmaTokenBundle(collections);
  assertThrows(() => importFigmaTokenBundle({ ...original, surprise: true }));
  assertThrows(() =>
    importFigmaTokenBundle({
      ...original,
      sources: {
        ...original.sources,
        resolver: {
          version: '2025.10',
          sets: { remote: { sources: [{ $ref: 'https://example.test/tokens.json' }] } },
        },
      },
    })
  );
  const bundle = structuredClone(original);
  const c = bundle.collections.findIndex((entry) => entry.collection === 'Theme set');
  const doc = bundle.sources.documents[`c${c}-m0.tokens.json`];
  const group = doc[`c${c}`];
  assert(typeof group !== 'string' && !('$value' in group));
  const prior = group.v0;
  assert(typeof prior !== 'string' && '$value' in prior);
  group.v0 = { ...prior, $value: '{c99.v99}' };
  assertThrows(() => importFigmaTokenBundle(bundle), Error, 'Unknown Figma DTCG alias');
});
