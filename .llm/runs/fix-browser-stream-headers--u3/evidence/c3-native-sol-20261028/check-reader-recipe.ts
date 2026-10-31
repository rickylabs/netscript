const evidence = '.llm/tmp/browser-stream-headers-u3-native-sol-20261028/c3';
const document = await Deno.readTextFile('docs/site/durable-workflows/streams.md');
const section = document.slice(document.indexOf('### Caller-provided reader headers'), document.indexOf('### Resolved stream URLs'));
const body = /```ts\n([\s\S]+?)\n```/.exec(section)?.[1];
if (!body || !body.includes('createWorkersStreamDB')) throw new Error('Exact reader recipe missing.');
const invalid = body.replace('async () => `Bearer ${await readReaderToken()}`', '1');
if (invalid === body) throw new Error('Expected exactly the async authorization expression.');
const temp = await Deno.makeTempDir({ dir: 'plugins/workers/tests/streams', prefix: 'u3-docs-recipe-' });
const results = [];
try {
  for (const [name, source] of [['positive', body], ['negative', invalid]]) {
    const file = `${Deno.cwd()}/${temp}/${name}.ts`;
    await Deno.writeTextFile(file, `${source}\n`);
    const deadline = new AbortController();
    const timer = setTimeout(() => deadline.abort(new Error(`Recipe compiler deadline: ${name}`)), 30_000);
    try {
      const args = ['check', '--frozen', '--unstable-kv', '--config', `${Deno.cwd()}/deno.json`, file];
      const output = await new Deno.Command(Deno.execPath(), { args, signal: deadline.signal, stdout: 'piped', stderr: 'piped' }).output();
      deadline.signal.throwIfAborted();
      const text = new TextDecoder().decode(output.stderr);
      const prefix = `${evidence}/recipe-${name}-${Date.now()}`;
      await Deno.writeFile(`${prefix}.stdout`, output.stdout, { createNew: true });
      await Deno.writeFile(`${prefix}.stderr`, output.stderr, { createNew: true });
      results.push({ name, args, code: output.code, prefix, source });
      if (/No matching|No target|not mapped|module not found|unresolved/i.test(text)) throw new Error(`Recipe setup failure: ${text}`);
      if (name === 'positive' && (output.code !== 0 || /TS\d+/.test(text))) throw new Error(`Recipe did not compile: ${text}`);
      if (name === 'negative' && (output.code === 0 || !text.includes('TS2322') || !text.includes('negative.ts'))) throw new Error(`Invalid header was not checked: ${text}`);
    } finally {
      clearTimeout(timer);
    }
  }
  await Deno.writeTextFile(`${evidence}/reader-recipe-proof.json`, JSON.stringify({
    exactSource: 'docs/site/durable-workflows/streams.md:309', body, results,
    interpretation: 'Supporting explicit public compiler control; global docs:snippets checks Tier-1 web pages and does not cover this streams page.',
    allOutputAwaited: true, sourceExecuted: false,
  }, null, 2), { createNew: true });
  console.log(JSON.stringify({ positive: 0, negative: 'TS2322', selectedRecipeCount: 1, sourceExecuted: false }));
} finally {
  await Deno.remove(temp, { recursive: true });
}
