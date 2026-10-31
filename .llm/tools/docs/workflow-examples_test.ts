import { assert, assertEquals } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import { compileSnippetAnalysis } from './snippet-compiler.ts';
import { extractFencedBlocks, type FencedBlock } from './snippet-extractor.ts';
import { analyzeSnippetSite } from './snippet-policy.ts';

const repositoryRoot = fromFileUrl(new URL('../../../', import.meta.url));
const EXAMPLES = [
  ['tutorials/eis-chat/03-deliver-worker.md', '// workers/jobs/deliver-result.ts'],
  ['durable-workflows/triggers.md', '// triggers/retrying-webhook.ts'],
] as const;

/** A revision override lets the same gate demonstrate the missing-example baseline. */
async function readDocument(path: string): Promise<string> {
  const revision = Deno.env.get('DOCS_REVISION');
  if (!revision) return await Deno.readTextFile(join(repositoryRoot, path));
  const result = await new Deno.Command('git', {
    args: ['show', `${revision}:${path}`],
    cwd: repositoryRoot,
  }).output();
  assert(result.success, new TextDecoder().decode(result.stderr));
  return new TextDecoder().decode(result.stdout);
}

Deno.test('worker stream and trigger retry examples compile against the workspace public exports', async () => {
  const blocks: FencedBlock[] = [];
  for (const [sourcePath, marker] of EXAMPLES) {
    const source = await readDocument(`docs/site/${sourcePath}`);
    const block = extractFencedBlocks(source, sourcePath).find((entry) =>
      entry.body.startsWith(marker)
    );
    assert(block, `${sourcePath}: missing complete example ${marker}`);
    assert(block.compilationExtension && !block.exemptionReason);
    blocks.push(block);
  }
  const site = await analyzeSnippetSite(join(repositoryRoot, 'docs/site'));
  const result = await compileSnippetAnalysis({ ...site, tier1Blocks: blocks }, repositoryRoot);
  assert(!result.incomplete, result.diagnostics);
  assertEquals(result.code, 0, result.diagnostics);
  assert(result.rootLockUnchanged);
});
