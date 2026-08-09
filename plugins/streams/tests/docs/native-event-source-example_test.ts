import { assert, assertStringIncludes } from '@std/assert';

const DOC_PATH = 'docs/site/durable-workflows/streams.md';

function extractNativeExample(markdown: string): string {
  const match = markdown.match(
    /label: "Consume over HTTP\/SSE \(Fresh client\)"[\s\S]*?code: ("(?:[^"\\]|\\.)*")\n {2}}/,
  );
  if (!match?.[1]) throw new Error('Official native EventSource example was not found');
  return JSON.parse(match[1]);
}

Deno.test('official native EventSource example is copy-exact and type-checks', async () => {
  const source = extractNativeExample(await Deno.readTextFile(DOC_PATH));
  assertStringIncludes(source, 'new EventSource(url)');
  assertStringIncludes(source, "url.searchParams.set('offset', '-1')");
  assertStringIncludes(source, "url.searchParams.set('live', 'sse')");
  assertStringIncludes(source, 'bindStreamEventSourceV1');
  assertStringIncludes(source, "event.event !== 'data'");
  assertStringIncludes(source, "change.headers.operation === 'delete'");
  assert(!source.includes('.onmessage'));
  assert(!source.includes('JSON.parse'));

  await Deno.mkdir('.llm/tmp', { recursive: true });
  const temporaryRoot = await Deno.makeTempDir({
    dir: '.llm/tmp',
    prefix: 'streams-native-example-',
  });
  const examplePath = `${temporaryRoot}/native-event-source-example.ts`;
  try {
    await Deno.writeTextFile(examplePath, source);
    const checked = await new Deno.Command(Deno.execPath(), {
      args: [
        'check',
        '--no-lock',
        '--unstable-kv',
        '--config',
        'packages/fresh/deno.json',
        examplePath,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    if (!checked.success) {
      throw new Error(new TextDecoder().decode(checked.stderr));
    }
  } finally {
    await Deno.remove(temporaryRoot, { recursive: true });
  }
});
