import { renderRolloutReport } from './rollout-report.ts';
import type { RolloutOutcome } from './rollout-canary.ts';
import { assert } from '@std/assert';

Deno.test('rendered report is traceable to every machine-readable canary', async () => {
  const outcome = JSON.parse(
    await Deno.readTextFile(new URL('./fixtures/rollout-canary-matrix.json', import.meta.url)),
  ) as RolloutOutcome;
  const rendered = renderRolloutReport(outcome);
  for (const canary of outcome.canaries) {
    assert(rendered.includes(`\`${canary.id}\``), `missing canary ${canary.id}`);
    assert(
      rendered.includes(`\`${canary.classification}\``),
      `missing classification ${canary.id}`,
    );
  }
  for (const pr of ['#584', '#585', '#586', '#587', '#588', '#589', '#590']) {
    assert(rendered.includes(pr), `missing provenance ${pr}`);
  }
  assert(
    rendered.includes('Owner approval and coordinator action are required.'),
    'missing promotion boundary',
  );
  assert(
    rendered.includes('This report performs no promotion action.'),
    'missing no-promotion statement',
  );
});
