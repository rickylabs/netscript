import { assertEquals, assertMatch } from '@std/assert';
import {
  extractCanonicalDocsSample,
  extractOfficialJobTemplate,
} from './sync-official-saga-publisher-sample.ts';

const WORKERS_SAMPLE_SOURCE = 'plugins/workers/src/cli/official-sample-configuration.ts';
const CANONICAL_SAGAS_DOC = 'docs/site/durable-workflows/sagas.md';

Deno.test('canonical saga publisher job stays source-derived from the safe workers sample', async () => {
  const official = extractOfficialJobTemplate(await Deno.readTextFile(WORKERS_SAMPLE_SOURCE));
  const canonical = extractCanonicalDocsSample(await Deno.readTextFile(CANONICAL_SAGAS_DOC));

  assertMatch(official, /const publishResult = await sagaPublisher\.publish\(/);
  assertMatch(official, /if \(!publishResult\.published\)/);
  assertEquals(canonical, official);
});
