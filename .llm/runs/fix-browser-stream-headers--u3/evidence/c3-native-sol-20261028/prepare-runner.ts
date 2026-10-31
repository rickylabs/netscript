const directory = '.llm/tmp/browser-stream-headers-u3-native-sol-20261028/c3';
const source = await Deno.readTextFile('.llm/tmp/browser-stream-headers-u3-native-sol-20261028/c2/run-gate-four-owner.ts');
const run = (script: string, args: string[]) => ['run', '--frozen', '-A', script, ...args];
const md = ['docs/site/durable-workflows/streams.md', '.llm/runs/fix-browser-stream-headers--u3/worklog.md', '.llm/runs/fix-browser-stream-headers--u3/drift.md', '.llm/runs/fix-browser-stream-headers--u3/research.md'];
const commands = {
  links: ['task', 'docs:links'],
  'exports-drift': ['task', 'docs:exports-drift'],
  accuracy: ['task', 'docs:accuracy'],
  'jsdoc-examples': ['task', 'docs:jsdoc-examples'],
  snippets: ['task', 'docs:snippets'],
  'fmt-source': run('.llm/tools/run-deno-fmt.ts', ['--file', 'packages/fresh/src/runtime/streams/create-stream-db.ts', '--file', 'packages/fresh/src/runtime/streams/mod.ts', '--ext', 'ts']),
  'fmt-md': run('.llm/tools/run-deno-fmt.ts', [...md.flatMap((path) => ['--file', path]), '--ext', 'md', '--config', `${directory}/fmt-md.json`]),
};
await Deno.writeTextFile(`${directory}/fmt-md.json`, JSON.stringify({ fmt: { lineWidth: 100, proseWrap: 'preserve', singleQuote: false } }, null, 2), { createNew: true });
const successor = `const commands: Record<string, string[]> = ${JSON.stringify(commands, null, 2)};\n` + source.slice(source.indexOf('const selected ='))
  .replaceAll('native-sol-20261028/c2', 'native-sol-20261028/c3').replaceAll('C2 gate', 'C3 gate')
  .replace('  controller.signal.throwIfAborted();\n', '')
  .replace('originalOutputAwaited: true, prefix', 'originalOutputAwaited: true, deadlineAborted: controller.signal.aborted, prefix');
await Deno.writeTextFile(`${directory}/run-gate.ts`, successor, { createNew: true });
console.log('C3 actual documentation tasks and scoped source/Markdown formatting prepared.');
