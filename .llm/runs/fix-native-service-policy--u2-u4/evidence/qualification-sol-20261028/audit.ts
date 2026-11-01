import { join } from '@std/path';

const evidence = '.llm/tmp/native-service-qualification-sol-20261028';
const baseline = '815122a889c4ef5bc203a6cd615cab7f8b97a673';
const accepted = [
  ['packages/service/src/diagnostics/database-connectivity.ts', 500, '854e3c3356065560ebfb5759e1665ef0fc3ee8cecf8c75773d09f5df24147ee6'],
  ['packages/service/tests/database-connectivity_test.ts', 360, 'f1f8ee2dc7fdd8ce7861edcca412f74b9724cb382bee43529d30d491bfae5f3a'],
  ['packages/service/tests/legacy-abort_test.ts', 230, '8781d5d9144250b5554d6e53b84d7b54f54938c5b0f685ee484082d935a56a0c'],
  ['packages/plugin/tests/service/create-plugin-service-auth_test.ts', 230, '24cd6d86f27e147f09d71c1afaf9b66f9a0a13fb5c694763f9ea62846db42c28'],
] as const;
const frozen: Array<{ path: string }> = JSON.parse((await Deno.readTextFile(join(evidence, 'frozen-owner-hashes.json'))).replace(/^\uFEFF/, ''));
const moreProtected = [
  'packages/service/tests/define-service_test.ts',
  'packages/service/tests/_fixtures/legacy-abort-service.ts',
  'packages/service/tests/body-limit_test.ts',
  'packages/service/src/primitives/body-limit.ts',
  'packages/service/tests/rate-limit-address-key_test.ts',
  '.llm/harness/debt/arch-debt.md',
  '.llm/runs/fix-native-service-policy--u2-u4/plan.md',
  '.llm/runs/fix-native-service-policy--u2-u4/decisions.md',
  '.llm/runs/fix-native-service-policy--u2-u4/plan-eval.md',
  '.llm/runs/fix-native-service-policy--u2-u4/plan-eval-recheck1.md',
];
const hash = async (bytes: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');
const headBytes = async (path: string) => {
  const result = await new Deno.Command('git', { args: ['cat-file', '--filters', `${baseline}:${path}`], stdout: 'piped', stderr: 'piped' }).output();
  if (!result.success) throw new Error(new TextDecoder().decode(result.stderr));
  return result.stdout;
};
const protectedRows = [];
for (const path of new Set([...frozen.map((row) => row.path), ...moreProtected])) {
  const original = await hash(await headBytes(path));
  const current = await hash(await Deno.readFile(path));
  protectedRows.push({ path, original, current, matches: original === current });
}
const sources = [];
for (const [path, cap, expected] of accepted) {
  const bytes = await Deno.readFile(path);
  const sha256 = await hash(bytes);
  const text = new TextDecoder().decode(bytes);
  const lines = text.split('\n').length - Number(text.endsWith('\n'));
  const originalNames = [...new TextDecoder().decode(await headBytes(path)).matchAll(/Deno\.test\('([^']+)'/g)].map((match) => match[1]);
  const names = [...text.matchAll(/Deno\.test\('([^']+)'/g)].map((match) => match[1]);
  sources.push({ path, lines, cap, sha256, matchesRootAcceptance: sha256 === expected, withinCap: lines <= cap, originalShorthandNames: originalNames, allOriginalNamesRetained: originalNames.every((name) => names.includes(name)) });
}
const graph = JSON.parse(new TextDecoder('utf-16le').decode(await Deno.readFile(join(evidence, 'q4-owner-graph-native.stdout.log'))).replace(/^\uFEFF/, ''));
const hono = graph.modules.find((module: { specifier: string }) => module.specifier === 'https://jsr.io/@hono/hono/4.13.13/src/middleware/body-limit/index.ts');
const honoBytes = await Deno.readFile(hono.local);
const sourceOnly = new TextDecoder().decode(honoBytes).split('// denoCacheMetadata=')[0].trimEnd() + '\n';
await Deno.writeTextFile(join(evidence, 'q4-hono-pinned-source.ts.txt'), sourceOnly);
const q4Owner = { specifier: hono.specifier, cacheFileSha256: await hash(honoBytes), sourceOnlySha256: await hash(new TextEncoder().encode(sourceOnly)), graphSha256: await hash(await Deno.readFile(join(evidence, 'q4-owner-graph-native.stdout.log'))), unresolvedModules: graph.modules.filter((module: { error?: unknown }) => module.error).length };
const report = { baseline, sources, protected: protectedRows, q4Owner, packageJsonExists: await Deno.stat('package.json').then(() => true, () => false) };
await Deno.writeTextFile(join(evidence, 'final-audit.json'), JSON.stringify(report, null, 2) + '\n');
if (sources.some((row) => !row.matchesRootAcceptance || !row.withinCap || !row.allOriginalNamesRetained) || protectedRows.some((row) => !row.matches) || report.packageJsonExists) throw new Error('Source/protected baseline audit failed');
console.log(JSON.stringify({ sourceOwners: sources.length, protectedOwners: protectedRows.length, allMatch: true, sources: sources.map(({ path, lines, cap, sha256 }) => ({ path, lines, cap, sha256 })) }));
