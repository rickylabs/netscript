import { assertEquals } from '@std/assert';
import { relative } from '@std/path';

const forbidden = [
  ['docker ps ', '-aq'].join(''),
  ['docker rm -f ', '$('].join(''),
  ['docker container ', 'prune'].join(''),
  ['docker system ', 'prune'].join(''),
];
const aspireStopAll = ['aspire stop ', '--all'].join('');
// Tracked pre-existing violations in the shipped consumer surface: issue #1048.
// Exact equality keeps this debt bounded: a fourth path anywhere fails the guard.
const expectedAspireStopAllPaths = [
  'packages/cli/src/kernel/assets/skills.generated.ts',
  'skills/aspire/SKILL.md',
  'skills/help.md',
];
const expectedDogfoodMirrorPaths = [
  '.agents/generated/consumer-skills/.claude/skills/aspire/SKILL.md',
  '.agents/generated/consumer-skills/.claude/skills/help.md',
];
const xargsDockerRemove = new RegExp(['xargs', '.*docker', 'rm'].join('\\s+'), 'i');

Deno.test('repository contains no shared-host bulk teardown command', async () => {
  const root = new URL('../../../../', import.meta.url).pathname;
  const findings: string[] = [];
  const aspireStopAllPaths: string[] = [];
  for await (const entry of walk(root)) {
    const path = relative(root, entry);
    if (path.startsWith('.llm/runs/') || path.startsWith('.git/')) continue;
    const text = await Deno.readTextFile(entry).catch(() => '');
    for (const phrase of forbidden) if (text.includes(phrase)) findings.push(`${path}: ${phrase}`);
    if (xargsDockerRemove.test(text)) findings.push(`${path}: xargs docker removal`);
    if (text.includes(aspireStopAll)) aspireStopAllPaths.push(path);
  }
  assertEquals(findings, []);
  const dogfoodMirrorPaths = aspireStopAllPaths.filter((path) =>
    path.startsWith('.agents/generated/consumer-skills/')
  );
  const canonicalPaths = aspireStopAllPaths.filter((path) =>
    !path.startsWith('.agents/generated/consumer-skills/')
  );
  assertEquals(canonicalPaths.sort(), expectedAspireStopAllPaths);
  assertEquals(dogfoodMirrorPaths.sort(), expectedDogfoodMirrorPaths);
});

async function* walk(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory) yield* walk(path);
    else if (entry.isFile) yield path;
  }
}
