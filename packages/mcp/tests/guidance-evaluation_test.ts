import { assertEquals } from '@std/assert';
import { dirname } from '@std/path';
import type { GuidanceResult } from '../mod.ts';
import { MCP_EMBEDDED_DOCS } from '../src/publish-assets.generated.ts';
import { EmbeddedDocsCorpus } from '../src/infrastructure/embedded-docs-corpus.ts';
import { FilesystemDocsCorpus } from '../src/infrastructure/filesystem-docs-corpus.ts';

interface EvaluationCase {
  readonly intent: string;
  readonly mode: 'exact' | 'required-set';
  readonly expected: readonly string[];
}

interface EvaluationCorpus {
  readonly schemaVersion: 1;
  readonly cases: readonly EvaluationCase[];
}

const FIXTURE = JSON.parse(
  await Deno.readTextFile(new URL('./fixtures/guidance-evaluation.json', import.meta.url)),
) as EvaluationCorpus;

Deno.test('locked release-corpus guidance is deterministic and equal across both adapters', async () => {
  assertEquals(FIXTURE.schemaVersion, 1);
  assertEquals(FIXTURE.cases.length, 5);
  const root = await Deno.makeTempDir();
  try {
    await materializeReleaseCorpus(root);
    const embedded = new EmbeddedDocsCorpus({ documents: MCP_EMBEDDED_DOCS });
    const filesystem = new FilesystemDocsCorpus({ root });
    for (const evaluation of FIXTURE.cases) {
      const embeddedFirst = await embedded.findGuidance(evaluation.intent);
      const embeddedSecond = await embedded.findGuidance(evaluation.intent);
      const filesystemFirst = await filesystem.findGuidance(evaluation.intent);
      const filesystemSecond = await filesystem.findGuidance(evaluation.intent);
      assertEquals(embeddedSecond, embeddedFirst, `${evaluation.intent}: embedded rerun drifted`);
      assertEquals(
        filesystemSecond,
        filesystemFirst,
        `${evaluation.intent}: filesystem rerun drifted`,
      );
      assertEquals(filesystemFirst, embeddedFirst, `${evaluation.intent}: adapters diverged`);
      assertExpectedTopThree(evaluation, embeddedFirst);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

function assertExpectedTopThree(evaluation: EvaluationCase, result: GuidanceResult): void {
  const actual = result.recommendations.slice(0, 3).map(({ slug, section }) =>
    `${slug}#${section}`
  );
  if (evaluation.mode === 'required-set') {
    assertEquals([...actual].sort(), [...evaluation.expected].sort(), evaluation.intent);
    return;
  }
  assertEquals(actual, evaluation.expected, evaluation.intent);
}

async function materializeReleaseCorpus(root: string): Promise<void> {
  for (const document of MCP_EMBEDDED_DOCS) {
    const path = `${root}/${document.path}`;
    await Deno.mkdir(dirname(path), { recursive: true });
    await Deno.writeTextFile(path, document.source);
  }
}
