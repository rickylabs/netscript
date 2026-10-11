import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { GENERATED_AUTH_CREDENTIAL_CASES } from '../../../src/application/gates/scaffold/generated-auth-checks.ts';
import { probeGeneratedAuthBatch } from '../../../src/application/gates/scaffold/probe-generated-auth-batch.ts';

Deno.test('credentialed gates scaffold once per run and never reuse stale or failed verdicts', async () => {
  const root = await Deno.makeTempDir();
  const receipt = join(root, 'verdicts.json');
  let calls = 0;
  const probe = (_project: string, _repo: string, cases?: readonly string[]) => {
    calls++;
    assertEquals(cases, GENERATED_AUTH_CREDENTIAL_CASES);
    return Promise.resolve();
  };
  try {
    for (const id of GENERATED_AUTH_CREDENTIAL_CASES) {
      await probeGeneratedAuthBatch(root, root, receipt, 'first-run', id, probe);
    }
    assertEquals(calls, 1);
    await probeGeneratedAuthBatch(
      root,
      root,
      receipt,
      'second-run',
      GENERATED_AUTH_CREDENTIAL_CASES[0],
      probe,
    );
    assertEquals(calls, 2, 'A new run cannot trust the previous run verdict');
    const failingProbe = () => Promise.reject(new Error('refusal failed'));
    for (const id of GENERATED_AUTH_CREDENTIAL_CASES) {
      await assertRejects(
        () => probeGeneratedAuthBatch(root, root, receipt, 'failed-run', id, failingProbe),
        Error,
        'refusal failed',
      );
    }
    await Deno.writeTextFile(
      receipt,
      JSON.stringify({ token: 'partial-run', cases: [GENERATED_AUTH_CREDENTIAL_CASES[0]] }),
    );
    await probeGeneratedAuthBatch(
      root,
      root,
      receipt,
      'partial-run',
      GENERATED_AUTH_CREDENTIAL_CASES[1],
      probe,
    );
    assertEquals(calls, 3, 'A partial batch cannot certify another case');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
