import { renderRolloutReport } from './rollout-report.ts';
import type { RolloutOutcome } from './rollout-canary.ts';
import { assert } from '@std/assert';

Deno.test('checked-in report is traceable to every machine-readable canary', async () => {
  const root = new URL('../../../../', import.meta.url);
  const run = new URL('.llm/runs/feat-epic-574-rollout-canaries--pr-6/', root);
  const outcome = JSON.parse(
    await Deno.readTextFile(new URL('rollout-canary-matrix.json', run)),
  ) as RolloutOutcome;
  const rendered = renderRolloutReport(outcome);
  const checkedIn = await Deno.readTextFile(new URL('ROLLOUT.md', root));
  assert(checkedIn === rendered, 'ROLLOUT.md must be rendered from the checked-in matrix');
  for (const canary of outcome.canaries) {
    assert(checkedIn.includes(`\`${canary.id}\``), `missing canary ${canary.id}`);
    assert(
      checkedIn.includes(`\`${canary.classification}\``),
      `missing classification ${canary.id}`,
    );
  }
  for (const pr of ['#584', '#585', '#586', '#587', '#588', '#589', '#590']) {
    assert(checkedIn.includes(pr), `missing provenance ${pr}`);
  }
  assert(
    checkedIn.includes('Owner approval and coordinator action are required.'),
    'missing promotion boundary',
  );
  assert(
    checkedIn.includes('This report performs no promotion action.'),
    'missing no-promotion statement',
  );
});
