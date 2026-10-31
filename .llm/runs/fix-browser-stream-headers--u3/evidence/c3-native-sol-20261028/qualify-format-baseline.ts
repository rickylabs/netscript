const directory = '.llm/tmp/browser-stream-headers-u3-native-sol-20261028/c3';
const baselineFiles = [];
for (const [source, name] of [
  ['docs/site/durable-workflows/streams.md', 'streams.md'],
  ['.llm/runs/fix-browser-stream-headers--u3/worklog.md', 'worklog.md'],
]) {
  const output = await new Deno.Command('git', { args: ['show', `HEAD:${source}`], stdout: 'piped', stderr: 'piped' }).output();
  if (!output.success) throw new Error(`Baseline unavailable: ${source}`);
  const file = `${directory}/baseline-${name}`;
  await Deno.writeFile(file, output.stdout, { createNew: true });
  baselineFiles.push(file);
}
const document = await Deno.readTextFile('docs/site/durable-workflows/streams.md');
const section = document.slice(document.indexOf('### Caller-provided reader headers'), document.indexOf('### Resolved stream URLs'));
await Deno.writeTextFile(`${directory}/changed-reader-section.md`, section.trimEnd() + '\n', { createNew: true });
const original = await Deno.readTextFile(`${directory}/run-supporting-gate.ts`);
const end = original.indexOf(';\nconst selected =');
const commands = JSON.parse(original.slice(original.indexOf('=') + 1, end));
commands['fmt-baseline'] = ['run', '--frozen', '-A', '.llm/tools/run-deno-fmt.ts', ...baselineFiles.flatMap((file) => ['--file', file]), '--ext', 'md', '--config', `${directory}/fmt-md.json`];
commands['fmt-changed-section'] = ['run', '--frozen', '-A', '.llm/tools/run-deno-fmt.ts', '--file', `${directory}/changed-reader-section.md`, '--ext', 'md', '--config', `${directory}/fmt-md.json`];
await Deno.writeTextFile(`${directory}/run-final-supporting-gate.ts`, `const commands: Record<string, string[]> = ${JSON.stringify(commands, null, 2)}` + original.slice(end), { createNew: true });
console.log('Unchanged HEAD Markdown baseline and exact changed section bound separately.');
