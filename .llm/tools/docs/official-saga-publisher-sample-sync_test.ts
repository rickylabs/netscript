import { assertEquals, assertMatch } from '@std/assert';

const WORKERS_SAMPLE_SOURCE = 'plugins/workers/src/cli/official-sample-configuration.ts';
const CANONICAL_SAGAS_DOC = 'docs/site/durable-workflows/sagas.md';
const DOC_SAMPLE_LABEL = 'label: "The job that publishes (workers)"';

function extractOfficialJobTemplate(source: string): string {
  const match = source.match(
    /function generateCreateUserSettingsJob\(\): string \{\n  return `\$\{OFFICIAL_SAMPLE_CONFIG_MARKER\}\n([\s\S]*?)\n`;\n\}/,
  );
  if (!match) throw new Error('official create-user-settings template was not found');

  return match[1]
    .replaceAll('\\`', '`')
    .replaceAll('\\${', '${');
}

function extractCanonicalDocsSample(source: string): string {
  const labelIndex = source.indexOf(DOC_SAMPLE_LABEL);
  if (labelIndex < 0) throw new Error('canonical worker sample tab was not found');
  const codeIndex = source.indexOf('code: ', labelIndex);
  if (codeIndex < 0) throw new Error('canonical worker sample code was not found');
  const encoded = source.slice(codeIndex + 'code: '.length).split('\n', 1)[0].trim();
  const decoded: unknown = JSON.parse(encoded);
  if (typeof decoded !== 'string') throw new Error('canonical worker sample code was not a string');
  return decoded;
}

Deno.test('canonical saga publisher job stays source-derived from the safe workers sample', async () => {
  const official = extractOfficialJobTemplate(await Deno.readTextFile(WORKERS_SAMPLE_SOURCE));
  const canonical = extractCanonicalDocsSample(await Deno.readTextFile(CANONICAL_SAGAS_DOC));

  assertMatch(official, /const publishResult = await sagaPublisher\.publish\(/);
  assertMatch(official, /if \(!publishResult\.published\)/);
  assertEquals(canonical, official);
});
