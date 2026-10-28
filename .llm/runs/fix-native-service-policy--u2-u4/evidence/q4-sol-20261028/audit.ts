import { join } from '@std/path';
const evidence = '.llm/tmp/native-service-q4-sol-20261028';
const baseline = '7cfa593e198ade668d531d2bdafa336ff6ca5709';
const owners = ['packages/service/src/primitives/body-limit.ts', 'packages/service/tests/body-limit_test.ts'];
const previous = JSON.parse(await Deno.readTextFile('.llm/tmp/native-service-qualification-sol-20261028/final-audit.json'));
const protectedPaths = [...new Set([...previous.protected.map((r: { path: string }) => r.path), ...previous.sources.map((r: { path: string }) => r.path)])].filter((path) => !owners.includes(path));
const hash = async (bytes: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');
const checkout = async (path: string) => {
  const result = await new Deno.Command('git', { args: ['cat-file', '--filters', `${baseline}:${path}`], stdout: 'piped', stderr: 'piped' }).output();
  if (!result.success) throw new Error(new TextDecoder().decode(result.stderr));
  return result.stdout;
};
const protectedRows = [];
for (const path of protectedPaths) {
  const original = await hash(await checkout(path));
  const current = await hash(await Deno.readFile(path));
  protectedRows.push({ path, original, current, matches: original === current });
}
const sources = [];
for (const [i, path] of owners.entries()) {
  const bytes = await Deno.readFile(path);
  const text = new TextDecoder().decode(bytes);
  const original = new TextDecoder().decode(await checkout(path));
  const originalNames = [...original.matchAll(/Deno\.test\((?:'([^']+)'|`([^`]+)`)/g)].map((m) => m[1] ?? m[2]);
  const names = [...text.matchAll(/Deno\.test\((?:'([^']+)'|`([^`]+)`)/g)].map((m) => m[1] ?? m[2]);
  const lines = text.split('\n').length - Number(text.endsWith('\n'));
  const cap = i === 0 ? 160 : 322;
  sources.push({ path, lines, cap, withinCap: lines <= cap, sha256: await hash(bytes), originalSha256: await hash(await checkout(path)), originalShorthandNames: originalNames, allOriginalShorthandNamesRetained: originalNames.every((name) => names.includes(name)) });
}
const diff = await new Deno.Command('git', { args: ['diff', '--name-only'], stdout: 'piped', stderr: 'piped' }).output();
const changedOwners = new TextDecoder().decode(diff.stdout).trim().split(/\r?\n/);
const report = { baseline, sources, protected: protectedRows, changedOwners, exactOwnerSet: changedOwners.length === 2 && changedOwners.every((path) => owners.includes(path)), scopeAuthoritySha256: await hash(await Deno.readFile('.llm/runs/fix-native-service-policy--u2-u4/root-q4-bounded-resource-scope.md')), packageJsonExists: await Deno.stat('package.json').then(() => true, () => false) };
await Deno.writeTextFile(join(evidence, 'final-audit.json'), JSON.stringify(report, null, 2) + '\n');
if (!report.exactOwnerSet || sources.some((row) => !row.withinCap || !row.allOriginalShorthandNamesRetained) || protectedRows.some((row) => !row.matches) || report.packageJsonExists) throw new Error('Scope/protected baseline audit failed');
console.log(JSON.stringify({ sourceOwners: sources.length, protectedOwners: protectedRows.length, allMatch: true, sources }));

