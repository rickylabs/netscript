import { fromFileUrl, resolve, toFileUrl } from '@std/path';

const DOC_PATH = fromFileUrl(
  new URL('../../../../../../../docs/site/durable-workflows/streams.md', import.meta.url),
);
const SCRATCH_ROOT = fromFileUrl(new URL('../../../../../../../.llm/tmp/', import.meta.url));

/** Execute the official native EventSource example without rewriting its source. */
export async function runDocumentedStreamExample(streamsBaseUrl: string): Promise<number> {
  const markdown = await Deno.readTextFile(DOC_PATH);
  const source = extractNativeExample(markdown);
  const executable = `${source}\n${PROOF_SUFFIX}`;
  await Deno.mkdir(SCRATCH_ROOT, { recursive: true });
  const temporaryRoot = await Deno.makeTempDir({
    dir: SCRATCH_ROOT,
    prefix: 'streams-native-runtime-',
  });
  const examplePath = resolve(temporaryRoot, 'native-event-source-example.ts');
  const previousUrl = Deno.env.get('DURABLE_STREAMS_URL');

  try {
    Deno.env.set('DURABLE_STREAMS_URL', streamsBaseUrl);
    await Deno.writeTextFile(examplePath, executable);
    const module = await import(`${toFileUrl(examplePath).href}?run=${crypto.randomUUID()}`);
    if (typeof module.documentedExampleReceipt !== 'number') {
      throw new Error('documented stream example did not export its runtime receipt');
    }
    return module.documentedExampleReceipt;
  } finally {
    if (previousUrl === undefined) Deno.env.delete('DURABLE_STREAMS_URL');
    else Deno.env.set('DURABLE_STREAMS_URL', previousUrl);
    await Deno.remove(temporaryRoot, { recursive: true });
  }
}

function extractNativeExample(markdown: string): string {
  const match = markdown.match(
    /label: "Consume over HTTP\/SSE \(Fresh client\)"[\s\S]*?code: ("(?:[^"\\]|\\.)*")\n {2}}/,
  );
  if (!match?.[1]) throw new Error('Official native EventSource example was not found');
  return JSON.parse(match[1]);
}

const PROOF_SUFFIX = `
const documentedExampleDeadline = Date.now() + 15_000;
let documentedExampleReceipt = 0;
try {
  while (latest.size === 0 && Date.now() < documentedExampleDeadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const documentedExampleError = latest.get('$error');
  if (documentedExampleError !== undefined) {
    throw new Error(\`documented stream example failed: \${JSON.stringify(documentedExampleError)}\`);
  }
  if (latest.size === 0) throw new Error('documented stream example received no data');
  documentedExampleReceipt = latest.size;
} finally {
  binding.dispose();
}
export { documentedExampleReceipt };
`;
