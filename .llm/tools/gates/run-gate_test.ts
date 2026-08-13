import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';

import { attestGitHead, main } from './run-gate.ts';

Deno.test('git head attestation defaults to actual HEAD and rejects silent mismatch', async () => {
  assertEquals(attestGitHead('actual'), {
    gitHead: 'actual',
    actualGitHead: 'actual',
    gitHeadOverrideReason: undefined,
  });
  await assertRejects(
    async () => attestGitHead('actual', 'declared'),
    Error,
    'does not match actual HEAD',
  );
});

Deno.test('explicit head mismatch is labelled diagnostic and remains auditable', () => {
  assertEquals(attestGitHead('actual', 'declared', 'queued-event fixture'), {
    gitHead: 'declared',
    actualGitHead: 'actual',
    gitHeadOverrideReason: 'queued-event fixture',
  });
});

Deno.test('empty skip reason produces a deterministic terminal receipt', async () => {
  const root = await Deno.makeTempDir();
  try {
    const output = join(root, 'skip.json');
    const code = await main([
      '--gate',
      'check',
      '--id',
      'empty-skip',
      '--output',
      output,
      '--cwd',
      Deno.cwd(),
      '--skip-reason',
      '',
    ]);
    assertEquals(code, 0);
    const receipt = JSON.parse(await Deno.readTextFile(output));
    assertEquals(receipt.outcome, 'SKIPPED');
    assertEquals(receipt.gitHead, receipt.actualGitHead);
    assertStringIncludes(receipt.reason, 'no reason supplied');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
