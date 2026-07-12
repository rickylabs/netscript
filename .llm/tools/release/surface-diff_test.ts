import { assertEquals } from 'jsr:@std/assert@^1';
import {
  evaluateSurfaceDiff,
  snapshotDocJson,
  SURFACE_SCHEMA_VERSION,
  type SurfaceSnapshot,
} from './surface-diff.ts';

const fixtureRoot = new URL('./tests/fixtures/', import.meta.url);

Deno.test('surface classifier reports changed/removal as major and addition as minor', async () => {
  const beforeDoc = JSON.parse(
    await Deno.readTextFile(new URL('surface-before.json', fixtureRoot)),
  );
  const afterDoc = JSON.parse(await Deno.readTextFile(new URL('surface-after.json', fixtureRoot)));
  const before = snapshot(await snapshotDocJson(beforeDoc), '1.1.0');
  const after = snapshot(await snapshotDocJson(afterDoc, deprecatedSource), '1.2.0');

  const result = evaluateSurfaceDiff(before, after);
  assertEquals(result.verdict, 'major');
  assertEquals(result.changes.map((item) => [item.kind, item.symbol, item.reason]), [
    ['minor', 'NewThing', 'symbol added'],
    ['major', 'OldThing', 'symbol removed'],
    ['major', 'createThing', 'export signature changed'],
  ]);
  assertEquals(result.undeclaredMajors.length, 2);
  assertEquals(result.deprecationWarnings, [{
    package: '@netscript/example',
    export: '.',
    symbol: 'createThing',
    removal: '1.2',
    currentVersion: '1.2.0',
  }]);
});

Deno.test('surface classifier accepts explicitly declared majors without hiding verdict', async () => {
  const beforeDoc = JSON.parse(
    await Deno.readTextFile(new URL('surface-before.json', fixtureRoot)),
  );
  const afterDoc = JSON.parse(await Deno.readTextFile(new URL('surface-after.json', fixtureRoot)));
  const result = evaluateSurfaceDiff(
    snapshot(await snapshotDocJson(beforeDoc), '1.1.0'),
    snapshot(await snapshotDocJson(afterDoc, deprecatedSource), '1.2.0'),
    [
      {
        package: '@netscript/example',
        export: '.',
        symbol: 'OldThing',
        reason: 'Reviewed symbol removal.',
      },
      {
        package: '@netscript/example',
        export: '.',
        symbol: 'createThing',
        reason: 'Reviewed signature change.',
      },
    ],
  );
  assertEquals(result.verdict, 'major');
  assertEquals(result.undeclaredMajors, []);
});

Deno.test('surface normalization ignores locations, docs, bodies, and resolution paths', async () => {
  const beforeDoc = JSON.parse(
    await Deno.readTextFile(new URL('surface-before.json', fixtureRoot)),
  );
  const relocatedDoc = structuredClone(beforeDoc);
  const declaration = relocatedDoc.nodes['file:///fixture/mod.ts'].symbols[0].declarations[0];
  declaration.location = { filename: 'elsewhere.ts', line: 500 };
  declaration.jsDoc = { doc: 'Different prose.' };
  declaration.def.hasBody = false;
  declaration.def.returnType.value.resolution = { kind: 'import', specifier: './elsewhere.ts' };
  assertEquals(await snapshotDocJson(relocatedDoc), await snapshotDocJson(beforeDoc));
});

function snapshot(
  exportSnapshot: Awaited<ReturnType<typeof snapshotDocJson>>,
  version: string,
): SurfaceSnapshot {
  return {
    schemaVersion: SURFACE_SCHEMA_VERSION,
    rootVersion: version,
    packages: {
      '@netscript/example': { path: 'packages/example', exports: { '.': exportSnapshot } },
    },
  };
}

function deprecatedSource(): Promise<string> {
  return Promise.resolve(`/**
 * @deprecated{removal: 1.2} Use createCurrentThing instead.
 */
export function createThing(name: number): Thing {}`);
}
