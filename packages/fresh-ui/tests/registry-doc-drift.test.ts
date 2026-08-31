import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { freshUiRegistryManifest } from '../registry.manifest.ts';
import type { RegistryManifest } from '../registry.schema.ts';

type RegistryCatalogItem = {
  readonly name: string;
  readonly kind: string;
  readonly layer: 2 | 3 | null;
  readonly description: string;
};

type RegistryCatalogCollection = {
  readonly name: string;
  readonly items: readonly string[];
};

type RegistryCatalogMeta = {
  readonly name: string;
  readonly version: string;
  readonly packageName: string;
  readonly total: number;
};

type RegistryCatalogSnapshot = {
  readonly registryMeta: RegistryCatalogMeta;
  readonly registryCatalog: readonly RegistryCatalogItem[];
  readonly registryCollections: readonly RegistryCatalogCollection[];
};

const CLI_REGISTRY_TEMPLATE_URL = new URL(
  '../../cli/src/kernel/assets/app/routes/(design)/design/(_shared)/registry.ts.template',
  import.meta.url,
);

function projectManifest(manifest: RegistryManifest): RegistryCatalogSnapshot {
  return {
    registryMeta: {
      name: manifest.name,
      version: manifest.version,
      packageName: manifest.packageName,
      total: manifest.items.length,
    },
    registryCatalog: manifest.items.map(({ name, kind, layer, description }) => ({
      name,
      kind,
      layer: layer ?? null,
      description,
    })),
    registryCollections: manifest.collections.map(({ name, items }) => ({ name, items })),
  };
}

async function loadGeneratedCatalog(): Promise<RegistryCatalogSnapshot> {
  const source = await Deno.readTextFile(CLI_REGISTRY_TEMPLATE_URL);
  const encoded = new TextEncoder().encode(source).toBase64();
  const module: RegistryCatalogSnapshot = await import(`data:text/typescript;base64,${encoded}`);
  return module;
}

function namesOnly<T extends { readonly name: string }>(values: readonly T[]): readonly string[] {
  return values.map((value) => value.name);
}

function difference(left: readonly string[], right: readonly string[]): readonly string[] {
  const rightNames = new Set(right);
  return left.filter((name) => !rightNames.has(name));
}

function changedNames<T extends { readonly name: string }>(
  expected: readonly T[],
  actual: readonly T[],
): readonly string[] {
  const actualByName = new Map(actual.map((value) => [value.name, value]));
  return expected.flatMap((value) => {
    const counterpart = actualByName.get(value.name);
    return counterpart !== undefined && JSON.stringify(value) !== JSON.stringify(counterpart)
      ? [value.name]
      : [];
  });
}

function appendNamedDrift(
  diagnostics: string[],
  label: string,
  names: readonly string[],
): void {
  if (names.length > 0) diagnostics.push(`${label}: ${names.join(', ')}`);
}

function assertCatalogMatchesManifest(
  manifest: RegistryManifest,
  actual: RegistryCatalogSnapshot,
): void {
  const expected = projectManifest(manifest);
  const expectedItemNames = namesOnly(expected.registryCatalog);
  const actualItemNames = namesOnly(actual.registryCatalog);
  const expectedCollectionNames = namesOnly(expected.registryCollections);
  const actualCollectionNames = namesOnly(actual.registryCollections);
  const diagnostics: string[] = [];

  appendNamedDrift(
    diagnostics,
    'manifest-only items',
    difference(expectedItemNames, actualItemNames),
  );
  appendNamedDrift(
    diagnostics,
    'catalog-only items',
    difference(actualItemNames, expectedItemNames),
  );
  appendNamedDrift(
    diagnostics,
    'changed items',
    changedNames(expected.registryCatalog, actual.registryCatalog),
  );
  appendNamedDrift(
    diagnostics,
    'manifest-only collections',
    difference(expectedCollectionNames, actualCollectionNames),
  );
  appendNamedDrift(
    diagnostics,
    'catalog-only collections',
    difference(actualCollectionNames, expectedCollectionNames),
  );
  appendNamedDrift(
    diagnostics,
    'changed collections',
    changedNames(expected.registryCollections, actual.registryCollections),
  );

  if (JSON.stringify(expectedItemNames) !== JSON.stringify(actualItemNames)) {
    diagnostics.push('item order differs');
  }
  if (JSON.stringify(expectedCollectionNames) !== JSON.stringify(actualCollectionNames)) {
    diagnostics.push('collection order differs');
  }

  const metaFields = ['name', 'version', 'packageName', 'total'] as const;
  const changedMeta = metaFields.filter((field) =>
    expected.registryMeta[field] !== actual.registryMeta[field]
  );
  appendNamedDrift(diagnostics, 'changed registryMeta fields', changedMeta);

  if (diagnostics.length > 0) {
    throw new Error(`Fresh UI registry catalog drift detected:\n- ${diagnostics.join('\n- ')}`);
  }
}

Deno.test('registry.ts JSDoc collection names match manifest collections', () => {
  const registryTsPath = new URL('../registry.ts', import.meta.url);
  const content = Deno.readTextFileSync(registryTsPath);

  const collectionsDocSection = content.match(/Collections:\n([\s\S]*?)\*\//);
  if (!collectionsDocSection) {
    throw new Error('Could not find Collections: section in registry.ts JSDoc');
  }

  const matches = [...collectionsDocSection[1].matchAll(/[\s\t]*- `([a-z0-9-]+)`:/g)];
  const docCollections = matches.map((match) => match[1]);
  const manifestCollections = freshUiRegistryManifest.collections.map((collection) =>
    collection.name
  );

  assertEquals(docCollections, manifestCollections);
});

Deno.test('generated design catalog matches the Fresh UI registry manifest', async () => {
  const catalog = await loadGeneratedCatalog();
  assertCatalogMatchesManifest(freshUiRegistryManifest, catalog);
});

Deno.test('design catalog drift gate names a manifest-only fixture item', async () => {
  const catalog = await loadGeneratedCatalog();
  const fixtureItem = {
    ...freshUiRegistryManifest.items[0],
    name: 'fixture-manifest-only',
  };
  const fixtureManifest: RegistryManifest = {
    ...freshUiRegistryManifest,
    items: [...freshUiRegistryManifest.items, fixtureItem],
  };

  const error = assertThrows(
    () => assertCatalogMatchesManifest(fixtureManifest, catalog),
    Error,
    'manifest-only items: fixture-manifest-only',
  );
  assertStringIncludes(error.message, 'changed registryMeta fields: total');
});

Deno.test('design catalog drift gate names a catalog-only fixture item', async () => {
  const catalog = await loadGeneratedCatalog();
  const removedName = 'render-ui';
  const fixtureManifest: RegistryManifest = {
    ...freshUiRegistryManifest,
    items: freshUiRegistryManifest.items.filter((item) => item.name !== removedName),
    collections: freshUiRegistryManifest.collections.map((collection) => ({
      ...collection,
      items: collection.items.filter((name) => name !== removedName),
    })),
  };

  const error = assertThrows(
    () => assertCatalogMatchesManifest(fixtureManifest, catalog),
    Error,
    `catalog-only items: ${removedName}`,
  );
  assertStringIncludes(error.message, 'changed collections: ai');
  assertStringIncludes(error.message, 'changed registryMeta fields: total');
});

Deno.test('design catalog drift gate checks item, collection, and registry metadata', async () => {
  const catalog = await loadGeneratedCatalog();
  const fixtureManifest: RegistryManifest = {
    ...freshUiRegistryManifest,
    version: '0.1.0-fixture',
    items: freshUiRegistryManifest.items.map((item) =>
      item.name === 'button' ? { ...item, layer: 3 } : item
    ),
    collections: freshUiRegistryManifest.collections.map((collection) =>
      collection.name === 'forms-core'
        ? { ...collection, items: collection.items.filter((name) => name !== 'button') }
        : collection
    ),
  };

  const error = assertThrows(
    () => assertCatalogMatchesManifest(fixtureManifest, catalog),
    Error,
    'changed items: button',
  );
  assertStringIncludes(error.message, 'changed collections: forms-core');
  assertStringIncludes(error.message, 'changed registryMeta fields: version');
});
