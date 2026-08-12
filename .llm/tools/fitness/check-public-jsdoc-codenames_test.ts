import { assertEquals } from '@std/assert';

const PUBLISH_ROOTS = ['packages', 'plugins'] as const;
const SOURCE_EXTENSIONS = ['.ts', '.tsx'] as const;
const INTERNAL_CODENAME =
  /\b(?:Group\s+[A-Z][A-Za-z0-9.-]*|Phase\s+(?:[A-Z][A-Za-z0-9.-]*|[0-9]+[A-Za-z]?)|Wave\s+(?:[A-Z][A-Za-z0-9.-]*|[0-9]+[A-Za-z]?)|Epic\s+(?:#[0-9]+|[A-Z][A-Za-z0-9.-]*|[0-9]+[A-Za-z]?))\b|\b[WT][0-9]+\b|\bnetscript#[0-9]+\b|(?<![A-Za-z])#[0-9]+\b/g;
const JSDOC_BLOCK = /\/\*\*[\s\S]*?\*\//g;
const JSDOC_INLINE_CODE = /`[^`]*`|\{@[^}]+\}/g;
const NON_PUBLISHED_PATH = /\/(?:e2e|fixtures|tests)\/|(?:_test|\.test)\.tsx?$/;

type Finding = Readonly<{
  path: string;
  line: number;
  term: string;
}>;

function scanJsdoc(source: string, path: string): readonly Finding[] {
  const findings: Finding[] = [];
  for (const block of source.matchAll(JSDOC_BLOCK)) {
    let inExample = false;
    let inFence = false;
    let blockOffset = 0;
    for (const line of block[0].split('\n')) {
      const prose = line.replace(/^\s*\/\*\*?\s?/, '').replace(/^\s*\*\s?/, '').trimEnd();
      const trimmed = prose.trimStart();
      if (trimmed.startsWith('@example')) inExample = true;
      else if (trimmed.startsWith('@')) inExample = false;
      if (trimmed.startsWith('```')) inFence = !inFence;

      if (!inExample && !inFence && !trimmed.startsWith('@')) {
        const searchable = prose.replaceAll(JSDOC_INLINE_CODE, '');
        for (const match of searchable.matchAll(INTERNAL_CODENAME)) {
          const offset = (block.index ?? 0) + blockOffset + (match.index ?? 0);
          findings.push({
            path,
            line: source.slice(0, offset).split('\n').length,
            term: match[0],
          });
        }
      }
      blockOffset += line.length + 1;
    }
  }
  return findings;
}

async function* sourceFiles(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory) {
      yield* sourceFiles(path);
      continue;
    }
    if (
      path.includes('/src/') &&
      SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension)) &&
      !NON_PUBLISHED_PATH.test(path) &&
      !path.endsWith('.generated.ts')
    ) {
      yield path;
    }
  }
}

async function assertPublishedJsdocHasNoInternalCodenames(): Promise<void> {
  const findings: Finding[] = [];
  for (const root of PUBLISH_ROOTS) {
    for await (const path of sourceFiles(root)) {
      findings.push(...scanJsdoc(await Deno.readTextFile(path), path));
    }
  }
  if (findings.length > 0) {
    throw new Error(
      `Published JSDoc contains internal codenames:\n${
        findings.map((finding) => `${finding.path}:${finding.line} ${finding.term}`).join('\n')
      }`,
    );
  }
}

Deno.test('published JSDoc excludes internal workstream codenames', async () => {
  await assertPublishedJsdocHasNoInternalCodenames();
});

Deno.test('published JSDoc codename scan flags prose and ignores JSDoc code contexts', () => {
  const fixture = [
    '/**',
    ' * Group F, Phase 7d, Wave 6, Epic Aurora, Epic #574, T1, W4, and #1554 are internal.',
    ' * `Pair<T1, T2>` and {@link T1} are code references.',
    ' * @template T1 A generic type parameter.',
    ' * @example',
    ' * ```ts',
    ' * type Pair<T1, T2> = readonly [T1, T2];',
    ' * ```',
    ' */',
  ].join('\n');

  assertEquals(scanJsdoc(fixture, 'fixture.ts'), [
    { path: 'fixture.ts', line: 2, term: 'Group F' },
    { path: 'fixture.ts', line: 2, term: 'Phase 7d' },
    { path: 'fixture.ts', line: 2, term: 'Wave 6' },
    { path: 'fixture.ts', line: 2, term: 'Epic Aurora' },
    { path: 'fixture.ts', line: 2, term: 'Epic #574' },
    { path: 'fixture.ts', line: 2, term: 'T1' },
    { path: 'fixture.ts', line: 2, term: 'W4' },
    { path: 'fixture.ts', line: 2, term: '#1554' },
  ]);
});
