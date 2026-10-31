const directory = '.llm/tmp/browser-stream-headers-u3-native-sol-20261028/c3';
const paths = [
  'docs/site/durable-workflows/streams.md',
  'packages/fresh/src/runtime/streams/create-stream-db.ts',
  'packages/fresh/src/runtime/streams/mod.ts',
  '.llm/runs/fix-browser-stream-headers--u3/worklog.md',
  '.llm/runs/fix-browser-stream-headers--u3/drift.md',
  '.llm/runs/fix-browser-stream-headers--u3/research.md',
];
const hash = async (bytes: Uint8Array) =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    .map((value) => value.toString(16).padStart(2, '0')).join('');
const sources = [];
await Deno.mkdir(`${directory}/source-final`, { recursive: true });
for (const path of paths) {
  const bytes = await Deno.readFile(path);
  const snapshot = `${directory}/source-final/${path.split('/').at(-1)}`;
  await Deno.writeFile(snapshot, bytes, { createNew: true });
  sources.push({ path, sha256: await hash(bytes), lines: new TextDecoder().decode(bytes).trimEnd().split('\n').length, snapshot });
}
const bodyAudits = [];
for (const path of paths.slice(1, 3)) {
  const original = await new Deno.Command('git', { args: ['show', `HEAD:${path}`], stdout: 'piped', stderr: 'piped' }).output();
  if (original.code !== 0) throw new Error('Cannot read accepted source from HEAD.');
  const stripIntroduction = (text: string) => {
    if (!text.startsWith('/**')) throw new Error('Expected leading module introduction.');
    const end = text.indexOf('*/');
    if (end < 0) throw new Error('Missing module introduction end.');
    return text.slice(end + 2);
  };
  const previous = stripIntroduction(new TextDecoder().decode(original.stdout));
  const current = stripIntroduction(await Deno.readTextFile(path));
  if (previous !== current) throw new Error(`Non-introduction source delta: ${path}`);
  bodyAudits.push({ path, byteIdenticalAfterModuleIntroduction: true, remainingSourceSha256: await hash(new TextEncoder().encode(current)) });
}
const protectedPaths = [
  'deno.json', 'deno.lock', '.llm/harness/debt/arch-debt.md',
  'plugins/workers/streams/factory.ts',
  'plugins/workers/tests/streams/factory-headers_test.ts',
  'plugins/workers/tests/streams/live-query-consumer_type.ts',
  'plugins/workers/tests/streams/live-query-consumer_test.ts',
];
const protectedInputs = [];
for (const path of protectedPaths) {
  const bytes = await Deno.readFile(path);
  const original = await new Deno.Command('git', { args: ['show', `HEAD:${path}`], stdout: 'piped', stderr: 'piped' }).output();
  if (original.code !== 0 || await hash(bytes) !== await hash(original.stdout)) throw new Error(`Protected input changed: ${path}`);
  protectedInputs.push({ path, sha256: await hash(bytes), equalsAcceptedHead: true });
}
const gates = [];
for await (const item of Deno.readDir(directory)) {
  if (!/^(links|exports-drift|accuracy|jsdoc-examples|snippets|fmt-source|fmt-md|recipe|fmt-baseline|fmt-changed-section)-\d+\.json$/.test(item.name)) continue;
  const path = `${directory}/${item.name}`;
  const bytes = await Deno.readFile(path);
  gates.push({ ...JSON.parse(new TextDecoder().decode(bytes)), receipt: path, sha256: await hash(bytes) });
}
gates.sort((left, right) => left.started.localeCompare(right.started));
const diff = await new Deno.Command('git', { args: ['diff', '--', ...paths], stdout: 'piped', stderr: 'piped' }).output();
if (diff.code !== 0) throw new Error('Cannot capture scoped diff.');
await Deno.writeFile(`${directory}/final.diff`, diff.stdout, { createNew: true });
const leftovers = [];
for await (const item of Deno.readDir('plugins/workers/tests/streams')) {
  if (item.name.startsWith('u3-docs-recipe-')) leftovers.push(item.name);
}
if (leftovers.length) throw new Error('Owned recipe fixture was not removed.');
const report = {
  capturedAt: new Date().toISOString(), sourceAcceptance: 'Pending root C3 source review; no C3 checkpoint',
  sources, bodyAudits, protectedInputs, gates,
  exactRecipeProof: `${directory}/reader-recipe-proof.json`,
  qualifications: [
    'docs:snippets passes 27 checked/14 exempt; this streams page is outside Tier-1 coverage. Exact recipe has separate positive/TS2322 compiler controls.',
    'docs:links fails five installed Aspire-skill missing targets; exports-drift/accuracy fail 36 Windows reference-path coverage prerequisites.',
    'docs:jsdoc-examples fails Windows spawn error206 without reaching the gate deadline.',
    'Full Markdown fmt has two findings also reproduced from unchanged HEAD; exact added section and selected source formatting pass.',
    'Fresh12/workers1 owning doc findings and failed F15 remain unwaived. No type export/debt/runtime/config/lock change.',
  ],
  cleanup: { ownedRecipeDirectoriesRemaining: leftovers, recipeOutputAwaited: true, sourceExecuted: false },
  diff: { path: `${directory}/final.diff`, sha256: await hash(diff.stdout) },
};
await Deno.writeTextFile(`${directory}/final-evidence.json`, JSON.stringify(report, null, 2), { createNew: true });
console.log(JSON.stringify({sources, bodyAudits, protectedInputs, cleanup: report.cleanup, manifest: `${directory}/final-evidence.json`}));
