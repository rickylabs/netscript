import { assertEquals } from '@std/assert';
import { dirname } from '@std/path';
import type { GuidanceResult } from '../mod.ts';
import { activatedGuidanceConcepts } from '../src/domain/docs/guidance-result.ts';
import { MCP_EMBEDDED_DOCS } from '../src/publish-assets.generated.ts';
import { EmbeddedDocsCorpus } from '../src/infrastructure/embedded-docs-corpus.ts';
import { FilesystemDocsCorpus } from '../src/infrastructure/filesystem-docs-corpus.ts';

interface EvaluationCase {
  readonly intent: string;
  readonly mode: 'exact' | 'rank-one' | 'required-set';
  readonly rankingAxis?: 'score';
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
  assertEquals(FIXTURE.cases.length, 8);
  const root = await Deno.makeTempDir();
  try {
    await materializeReleaseCorpus(root);
    const embedded = new EmbeddedDocsCorpus({ documents: MCP_EMBEDDED_DOCS });
    const filesystem = new FilesystemDocsCorpus({ root });
    for (const evaluation of FIXTURE.cases) {
      if (evaluation.rankingAxis === 'score') {
        assertEquals(
          activatedGuidanceConcepts(evaluation.intent),
          [],
          `${evaluation.intent}: score-only row activated a curated route`,
        );
      }
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
  if (evaluation.mode === 'rank-one') {
    assertEquals(actual.slice(0, 1), evaluation.expected, evaluation.intent);
    return;
  }
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
