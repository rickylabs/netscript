import { assertEquals, assertStringIncludes } from '@std/assert';
import { discoverDoctrineRoots } from './check-doctrine.ts';

const VERDICT_PATH = 'docs/architecture/doctrine/10-codebase-verdict-and-handoff.md';
const ARCHETYPE_PATH = 'docs/architecture/doctrine/06-archetypes.md';
const RFC_PATH = 'rfcs/README.md';

function section(markdown: string, heading: string): string {
  const start = markdown.indexOf(`## ${heading}`);
  if (start < 0) throw new Error(`missing section: ${heading}`);
  const next = markdown.indexOf('\n## ', start + heading.length + 3);
  return markdown.slice(start, next < 0 ? undefined : next);
}

function unitPaths(markdownSection: string): string[] {
  return [...markdownSection.matchAll(/^\| `((?:packages|plugins)\/[^`]+)` \|/gm)]
    .map((match) => match[1]);
}

function verdictArchetypes(markdownSection: string): Map<string, string> {
  return new Map(
    [...markdownSection.matchAll(/^\| `((?:packages|plugins)\/[^`]+)` \| `[^`]+` \| ([1-7]) \|/gm)]
      .map((match) => [match[1], match[2]]),
  );
}

function assignmentArchetypes(markdownSection: string): Map<string, string> {
  return new Map(
    [...markdownSection.matchAll(/^\| `((?:packages|plugins)\/[^`]+)` \| ([1-7]) —/gm)]
      .map((match) => [match[1], match[2]]),
  );
}

Deno.test('verdict table rows name directories that exist', async () => {
  const verdict = await Deno.readTextFile(VERDICT_PATH);
  const paths = unitPaths(section(verdict, 'Verdict per package'));

  assertEquals(paths.length, 36);
  assertEquals(new Set(paths).size, paths.length);
  for (const path of paths) assertEquals((await Deno.stat(path)).isDirectory, true, path);
});

Deno.test('every live top-level doctrine unit has one verdict row', async () => {
  const verdict = await Deno.readTextFile(VERDICT_PATH);
  const documented = unitPaths(section(verdict, 'Verdict per package')).sort();
  assertEquals(documented, await discoverDoctrineRoots());
});

Deno.test('archetype assignments and documented gate set equal the measured verdict set', async () => {
  const [verdict, archetypes] = await Promise.all([
    Deno.readTextFile(VERDICT_PATH),
    Deno.readTextFile(ARCHETYPE_PATH),
  ]);
  const verdictPaths = unitPaths(section(verdict, 'Verdict per package')).sort();
  const archetypePaths = unitPaths(
    section(archetypes, 'Archetype assignments for current packages'),
  )
    .sort();
  const gateCoverage = section(verdict, 'Doctrine gate coverage');
  const verdictAssignments = verdictArchetypes(section(verdict, 'Verdict per package'));
  const documentedAssignments = assignmentArchetypes(
    section(archetypes, 'Archetype assignments for current packages'),
  );

  assertEquals(archetypePaths, verdictPaths);
  assertEquals(documentedAssignments, verdictAssignments);
  assertEquals(verdictPaths, await discoverDoctrineRoots());
  assertStringIncludes(gateCoverage, 'exactly the 36 paths in the verdict table above');
  assertStringIncludes(gateCoverage, 'packages/cli/e2e');
  assertStringIncludes(gateCoverage, 'published doctrine unit');
});

Deno.test('engineering-reference completion plan exists and is dated', async () => {
  const verdict = await Deno.readTextFile(VERDICT_PATH);
  const plan = section(verdict, 'Engineering-reference completion plan — 2026-08-12');

  assertStringIncludes(plan, '2026-09-30');
  assertStringIncludes(plan, '2026-12-31');
  assertStringIncludes(plan, 'sections 1–5');
  assertStringIncludes(plan, 'sections 8–9');
  assertStringIncludes(plan, 'section 10');
});

Deno.test('RFC process is canonical and maps every pending decision ID', async () => {
  const rfc = await Deno.readTextFile(RFC_PATH);
  const canonical = section(rfc, 'Numbering');
  const ids = [
    'CRON-SUBSYSTEM-DUP',
    'RUN-ARTIFACT-ARCHIVAL-POLICY',
    'PAGEBUILDER-LEGACY-COMPAT-TREE',
    'FORMPAGEPROPS-PLAYGROUND-MIGRATION',
    'REDIS-LEGACY-VALUE-FALLBACK',
  ];

  assertStringIncludes(canonical, 'rfcs/NNNN-*.md');
  assertStringIncludes(canonical, '.llm/runs/*/design/canonical/');
  assertStringIncludes(canonical, 'provenance, and draft-design artifacts');
  for (const id of ids) assertStringIncludes(canonical, `\`${id}\``);
});

Deno.test('removed verdict rows carry the reconciled per-row provenance', async () => {
  const verdict = await Deno.readTextFile(VERDICT_PATH);
  const provenance = section(verdict, 'Provenance for removed rows');
  const expected = [
    '317e4b509704877f30ef901a4e5db3bedc8db43e',
    '@netscript/triggers',
    '@netscript/workers',
    '@netscript/sagas',
    '@netscript/streams',
    '@netscript/shared',
    'plugins/hello-world',
    '0ef13de359b1eb1cdd653ab4400ae57fd19644f6',
    'fd8259b76d8e71ee76eadd56ce94160de004fc32',
    'Neither commit is an ancestor',
    'no top-level streams supersession record',
  ];

  for (const value of expected) assertStringIncludes(provenance, value);
});
