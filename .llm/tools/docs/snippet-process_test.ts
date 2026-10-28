import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { extractFencedBlocks } from './snippet-extractor.ts';
import { runSnippetProcess } from './snippet-process.ts';

const cwd = Deno.cwd();

Deno.test('nonterminating fixture fails within its deadline and names its source fence', async () => {
  const fixturePath = '.llm/tools/docs/fixtures/never-exits/docs/site/page.md';
  const [block] = extractFencedBlocks(await Deno.readTextFile(fixturePath), fixturePath);
  const started = performance.now();
  const result = await runSnippetProcess(Deno.execPath(), ['eval', block.body], {
    cwd,
    source: `${block.sourcePath}:${block.openingLine}`,
    timeoutMs: 200,
  });
  assertEquals(result.timedOut, true);
  assertEquals(result.code, 1);
  assertStringIncludes(result.stderr, `${fixturePath}:3`);
  assertStringIncludes(result.stderr, 'timed out after 200ms');
  assert(performance.now() - started < 3_000, 'fixture must not hang beyond its cleanup margin');
});

Deno.test('snippet children see EOF on stdin and preserve successful output', async () => {
  const result = await runSnippetProcess(Deno.execPath(), [
    'eval',
    'const input = await Deno.stdin.readable.getReader().read(); console.log(input.done);',
  ], { cwd, source: 'stdin.md:7', timeoutMs: 2_000 });
  assertEquals(result.code, 0, result.stderr);
  assertEquals(result.timedOut, false);
  assertEquals(result.stdout.trim(), 'true');
});

Deno.test('snippet spawn failure includes source provenance', async () => {
  await assertRejects(
    () =>
      runSnippetProcess('missing-snippet-compiler-executable', [], { cwd, source: 'broken.md:9' }),
    Error,
    'broken.md:9: failed to start snippet process',
  );
});

Deno.test({
  name: 'launcher deadline also cleans up a worker owning a separate compiler group',
  ignore: Deno.build.os === 'windows',
  fn: async () => {
    const temp = await Deno.makeTempDir({ prefix: 'snippet-nested-' });
    const marker = `${temp}/survived`;
    try {
      const runnerUrl = new URL('./snippet-process.ts', import.meta.url).href;
      const compiler = `Deno.addSignalListener('SIGTERM', () => {}); setTimeout(() => {
        Deno.writeTextFileSync(${JSON.stringify(marker)}, 'leaked'); Deno.exit(0);
      }, 1_500);`;
      const worker = `import { runSnippetProcess } from ${JSON.stringify(runnerUrl)};
        console.log('nested-ready');
        await runSnippetProcess(Deno.execPath(), ['eval', ${JSON.stringify(compiler)}],
          { cwd: Deno.cwd(), source: 'nested.md:5', timeoutMs: 5_000 });`;
      const result = await runSnippetProcess(Deno.execPath(), ['eval', worker], {
        cwd,
        source: 'bootstrap.md:1',
        timeoutMs: 500,
      });
      assertEquals(result.timedOut, true);
      assertStringIncludes(result.stdout, 'nested-ready');
      await new Promise((done) => setTimeout(done, 1_600));
      await assertRejects(() => Deno.stat(marker), Deno.errors.NotFound);
    } finally {
      await Deno.remove(temp, { recursive: true });
    }
  },
});

Deno.test({
  name: 'deadline kills descendants holding inherited pipes after the direct child exits',
  ignore: Deno.build.os === 'windows',
  fn: async () => {
    const temp = await Deno.makeTempDir({ prefix: 'snippet-descendant-' });
    const marker = `${temp}/survived`;
    try {
      // The leader exits immediately. Its descendant ignores SIGTERM and holds both pipes open.
      const descendant = `Deno.addSignalListener('SIGTERM', () => {}); setTimeout(() => {
        Deno.writeTextFileSync(${JSON.stringify(marker)}, 'leaked'); Deno.exit(0);
      }, 1_000);`;
      const result = await runSnippetProcess(Deno.execPath(), [
        'eval',
        `new Deno.Command(Deno.execPath(), { args: ['eval', ${JSON.stringify(descendant)}],
          stdin: 'null', stdout: 'inherit', stderr: 'inherit' }).spawn(); Deno.exit(0);`,
      ], { cwd, source: 'descendant.md:4', timeoutMs: 200 });
      assertEquals(result.timedOut, true);
      assertEquals(result.code, 1);
      await new Promise((done) => setTimeout(done, 1_100));
      await assertRejects(() => Deno.stat(marker), Deno.errors.NotFound);
    } finally {
      await Deno.remove(temp, { recursive: true });
    }
  },
});
