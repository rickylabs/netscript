import { assert } from '@std/assert';

/**
 * Structural guard for the telemetry layering law.
 *
 * The ports-and-adapters doctrine forbids the inner layers (`application/`,
 * `domain/`) from importing anything under `adapters/`, and constrains the
 * `adapters/otel/` boundary to a strict allow-list. These are conventions no
 * type check enforces, so this test walks the real source tree and fails when
 * a forbidden import edge is introduced.
 *
 * Paths resolve relative to this test file so the suite runs from any cwd.
 */

/** Yield every `.ts` file URL under `dir`, recursing into subdirectories. */
async function* walkTsFiles(dir: URL): AsyncGenerator<URL> {
  for await (const entry of Deno.readDir(dir)) {
    const child = new URL(
      entry.isDirectory ? `${entry.name}/` : entry.name,
      dir,
    );
    if (entry.isDirectory) {
      yield* walkTsFiles(child);
    } else if (entry.isFile && entry.name.endsWith('.ts')) {
      yield child;
    }
  }
}

/**
 * Extract every static module specifier from TypeScript source.
 *
 * Covers `import ... from '...'`, `export ... from '...'`, and bare
 * side-effect `import '...'` statements.
 */
function importSpecifiers(source: string): string[] {
  // Strip block and line comments so specifiers inside JSDoc `@example`
  // snippets are not mistaken for real import edges.
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  const specifiers: string[] = [];
  const fromRe = /\bfrom\s*['"]([^'"]+)['"]/g;
  const sideEffectRe = /\bimport\s*['"]([^'"]+)['"]/g;
  for (const match of code.matchAll(fromRe)) {
    if (match[1] !== undefined) {
      specifiers.push(match[1]);
    }
  }
  for (const match of code.matchAll(sideEffectRe)) {
    if (match[1] !== undefined) {
      specifiers.push(match[1]);
    }
  }
  return specifiers;
}

function shortPath(fileUrl: URL): string {
  const marker = '/telemetry/';
  const index = fileUrl.pathname.indexOf(marker);
  return index === -1
    ? fileUrl.pathname
    : `telemetry/${fileUrl.pathname.slice(index + marker.length)}`;
}

Deno.test('inner telemetry layers never import from adapters/', async () => {
  const innerDirs = [
    new URL('../src/application/', import.meta.url),
    new URL('../src/domain/', import.meta.url),
  ];

  let filesScanned = 0;
  for (const dir of innerDirs) {
    for await (const fileUrl of walkTsFiles(dir)) {
      filesScanned++;
      const source = await Deno.readTextFile(fileUrl);
      for (const specifier of importSpecifiers(source)) {
        assert(
          !specifier.includes('adapters/'),
          `${shortPath(fileUrl)} imports "${specifier}" — inner layers ` +
            'must not depend on adapters/ (telemetry layering law).',
        );
      }
    }
  }

  assert(
    filesScanned > 0,
    'expected to scan telemetry application/ and domain/ source files',
  );
});

Deno.test('adapters/otel imports only from the ports boundary + @opentelemetry/api', async () => {
  const otelDir = new URL('../src/adapters/otel/', import.meta.url);

  const isAllowed = (specifier: string): boolean =>
    specifier === '@opentelemetry/api' ||
    specifier.startsWith('../../ports/') ||
    // Sibling re-exports within the otel adapter facade (mod.ts).
    specifier.startsWith('./');

  let filesScanned = 0;
  for await (const fileUrl of walkTsFiles(otelDir)) {
    filesScanned++;
    const source = await Deno.readTextFile(fileUrl);
    for (const specifier of importSpecifiers(source)) {
      assert(
        isAllowed(specifier),
        `${shortPath(fileUrl)} imports "${specifier}" — adapters/otel may ` +
          'import only from ../../ports/, @opentelemetry/api, or sibling ' +
          'otel modules.',
      );
    }
  }

  assert(filesScanned > 0, 'expected to scan telemetry adapters/otel source files');
});
