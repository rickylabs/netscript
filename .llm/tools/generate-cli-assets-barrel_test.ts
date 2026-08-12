import { assert, assertEquals, assertFalse, assertThrows } from '@std/assert';
import { readAgentToolEmbeddedBundle } from './generate-cli-assets-barrel.ts';

interface MissingRelativeImport {
  readonly importer: string;
  readonly specifier: string;
  readonly resolvedPath: string;
}

const STATIC_IMPORT_PATTERN =
  /\b(?:import|export)\s+(?:type\s+)?(?:(?:[^"'`;]|\n)*?\s+from\s+)?["']([^"']+)["']/g;
const DYNAMIC_IMPORT_PATTERN = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

function relativeImportSpecifiers(source: string): readonly string[] {
  return [
    ...source.matchAll(STATIC_IMPORT_PATTERN),
    ...source.matchAll(DYNAMIC_IMPORT_PATTERN),
  ].map((match) => match[1]).filter((specifier) => specifier.startsWith('.'));
}

function unresolvedRelativeImports(
  files: Readonly<Record<string, string>>,
): readonly MissingRelativeImport[] {
  const bundledPaths = new Set(Object.keys(files));
  const missing: MissingRelativeImport[] = [];
  for (const [importer, source] of Object.entries(files)) {
    for (const specifier of relativeImportSpecifiers(source)) {
      const resolvedPath = new URL(specifier, `file:///${importer}`).pathname.slice(1);
      if (!bundledPaths.has(resolvedPath)) {
        missing.push({ importer, specifier, resolvedPath });
      }
    }
  }
  return missing;
}

function assertRelativeImportClosure(files: Readonly<Record<string, string>>): void {
  const missing = unresolvedRelativeImports(files);
  assertEquals(
    missing,
    [],
    `bundle has unresolved relative imports: ${
      missing.map((item) => `${item.importer} -> ${item.resolvedPath}`).join(', ')
    }`,
  );
}

Deno.test('manifest modules are embedded and excluded from the runnable tool surface', async () => {
  const bundle = await readAgentToolEmbeddedBundle();
  const manifest = JSON.parse(bundle.files['consumer-tools.json']) as {
    readonly schemaVersion: number;
    readonly supportFiles: readonly string[];
    readonly modules: readonly { readonly path: string }[];
    readonly tools: readonly { readonly path: string }[];
  };
  assertEquals(manifest.schemaVersion, 2);
  assertEquals(bundle.orderedPaths, [
    ...manifest.supportFiles,
    ...manifest.modules.map((module) => module.path),
    ...manifest.tools.map((tool) => tool.path),
  ]);
  const runnablePaths = new Set(manifest.tools.map((tool) => tool.path));
  for (const module of manifest.modules) {
    assert(module.path in bundle.files, `missing embedded module ${module.path}`);
    assertFalse(runnablePaths.has(module.path), `${module.path} must not be a runnable tool`);
  }
});

Deno.test('embedded consumer tool bundle is closed over relative imports', async () => {
  const bundle = await readAgentToolEmbeddedBundle();
  assertRelativeImportClosure(bundle.files);
});

Deno.test('relative-import closure guard rejects an omitted dependency', () => {
  const completeBundle = {
    'commands/scan.ts': "import { extract } from '../modules/extract.ts';\nextract();\n",
    'modules/extract.ts': 'export function extract(): void {}\n',
  };
  assertRelativeImportClosure(completeBundle);

  const incompleteBundle = { 'commands/scan.ts': completeBundle['commands/scan.ts'] };
  assertThrows(
    () => assertRelativeImportClosure(incompleteBundle),
    Error,
    'commands/scan.ts -> modules/extract.ts',
  );
});
