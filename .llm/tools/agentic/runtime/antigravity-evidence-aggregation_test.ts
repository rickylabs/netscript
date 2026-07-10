import { aggregateAntigravityEvidence } from './antigravity-evidence-aggregation.ts';
import { classifyAntigravityEvidence } from './antigravity-evidence.ts';
import { LocalRunResourceAggregationAdapter } from './adapters/run-resource-aggregation-adapter.ts';

function assert(condition: unknown, message = 'assertion failed'): asserts condition {
  if (!condition) throw new Error(message);
}
function assertEquals(actual: unknown, expected: unknown, message = 'values differ'): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}\nactual: ${JSON.stringify(actual)}\nexpected: ${JSON.stringify(expected)}`,
    );
  }
}

Deno.test('aggregation writes only empirically supported normalized citations', async () => {
  const result = classifyAntigravityEvidence({
    exitCode: 0,
    timedOut: false,
    stdout: 'Citation https://docs.deno.com/runtime/?private=value#section',
    stderr: '',
  });
  const writes: unknown[] = [];
  const aggregated = await aggregateAntigravityEvidence(result, {
    writeAntigravityCitations: (citations) => {
      writes.push(citations);
      return Promise.resolve();
    },
  });
  assertEquals(aggregated, true);
  assertEquals(writes, [[{ url: 'https://docs.deno.com/runtime/', persisted: true }]]);
});

Deno.test('owner acceptance alone never writes run resources', async () => {
  const result = classifyAntigravityEvidence({
    exitCode: 1,
    timedOut: true,
    stdout: '',
    stderr: 'authentication timeout',
    ownerAcceptedCapabilities: ['web_search_fetch', 'citation_persistence'],
  });
  let writes = 0;
  const aggregated = await aggregateAntigravityEvidence(result, {
    writeAntigravityCitations: () => {
      writes++;
      return Promise.resolve();
    },
  });
  assertEquals(aggregated, false);
  assertEquals(writes, 0);
});

Deno.test('local aggregation adapter writes value-only metadata with private mode', async () => {
  const directory = await Deno.makeTempDir();
  try {
    const path = `${directory}/docs/antigravity-citations.json`;
    const adapter = new LocalRunResourceAggregationAdapter(path);
    await adapter.writeAntigravityCitations([{
      url: 'https://docs.deno.com/runtime/',
      persisted: true,
    }]);
    const text = await Deno.readTextFile(path);
    const value = JSON.parse(text);
    assertEquals(value, {
      schemaVersion: '1.0',
      source: 'antigravity',
      citations: [{ url: 'https://docs.deno.com/runtime/', persisted: true }],
    });
    assertEquals((await Deno.stat(path)).mode! & 0o777, 0o600);
    assert(!text.includes('responseBody'));
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});
