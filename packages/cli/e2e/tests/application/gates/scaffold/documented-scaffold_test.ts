import { assert, assertEquals, assertThrows } from '@std/assert';
import {
  assertDocumentedActivity,
  assertDocumentedSeedExecution,
  assertLinkedActivityHtml,
  DOCUMENTED_SCAFFOLD_DOC,
  documentedScaffoldCommands,
  SeedHandoffAcceptanceError,
  StreamLinkAcceptanceError,
} from '../../../../src/application/gates/scaffold/documented-scaffold-contract.ts';
import { RUNTIME_GATES } from '../../../../suites/scaffold/capability-suites.ts';
import { GATE } from '../../../../src/domain/cli-surface.ts';

const seedId = '9023b4e5-7889-4bb8-a8b9-06c1e237eb9a';
const execution = {
  id: 'execution-1',
  jobId: 'health-check',
  status: 'completed',
  correlationId: `scaffold-seed:${seedId}`,
  progressPercent: 100,
  completedAt: '2026-11-02T08:00:00.000Z',
  result: { workspaceEntries: 3 },
};

Deno.test('the runtime gate executes the real documented steps before any repair fixture', async () => {
  const markdown = await Deno.readTextFile(
    new URL(`../../../../../../../${DOCUMENTED_SCAFFOLD_DOC}`, import.meta.url),
  );
  const commands = documentedScaffoldCommands(markdown);
  assertEquals(commands.map((words) => words.slice(0, 3).join(' ')), [
    'netscript init activity-demo',
    'cd activity-demo',
    'netscript plugin install',
    'netscript plugin install',
    'aspire restore --apphost',
    'aspire start --apphost',
    'netscript db init',
    'netscript db generate',
    'netscript db seed',
    'netscript plugin doctor',
  ]);
  assert(commands[0].includes('--service'));
  assertEquals(commands[3].slice(-2), ['--service', 'users']);
  assert(commands[5].includes('--non-interactive'));
  assert(RUNTIME_GATES.indexOf(GATE.BEHAVIOR_DOCUMENTED_SCAFFOLD) >= 0);
  assert(
    RUNTIME_GATES.indexOf(GATE.BEHAVIOR_DOCUMENTED_SCAFFOLD) <
      RUNTIME_GATES.indexOf(GATE.RUNTIME_STREAMS_STORAGE_FIXTURE),
  );
  assert(
    RUNTIME_GATES.indexOf(GATE.BEHAVIOR_DOCUMENTED_SCAFFOLD) <
      RUNTIME_GATES.indexOf(GATE.RUNTIME_ASPIRE_RESTART_AFTER_DB),
  );
});

Deno.test('document command extraction rejects missing blocks and executable shell syntax', () => {
  assertThrows(() => documentedScaffoldCommands('nothing here'));
  assertThrows(() =>
    documentedScaffoldCommands(
      '<!-- documented-scaffold:start -->\n```sh\nnetscript db seed; true\n```\n<!-- documented-scaffold:end -->',
    )
  );
});

Deno.test('seed acceptance requires actual seed-correlated completion and genuine work', () => {
  assertEquals(assertDocumentedSeedExecution({ executions: [execution] }, seedId), 'execution-1');
  for (
    const executions of [[], [{ ...execution, status: 'running' }], [{
      ...execution,
      correlationId: 'manual-trigger',
    }], [execution, execution]]
  ) {
    assertThrows(
      () => assertDocumentedSeedExecution({ executions }, seedId),
      SeedHandoffAcceptanceError,
    );
  }
  for (
    const change of [{ progressPercent: 0 }, { completedAt: null }, {
      result: { workspaceEntries: 0 },
    }]
  ) {
    assertThrows(() =>
      assertDocumentedSeedExecution({ executions: [{ ...execution, ...change }] }, seedId)
    );
  }
});

const event = {
  type: 'record-activity',
  headers: { operation: 'upsert' },
  value: {
    id: 'event-1',
    recordId: '42',
    reference: 'REC-10482',
    verb: 'updated',
    actor: { name: 'Anonymous', kind: 'anonymous' },
    timestamp: '2026-11-02T08:00:00.000Z',
  },
};
const html = '<section data-capability="streams" data-capability-state="ready">' +
  '<p>Latest events from the record activity stream.</p>Anonymous updated REC-10482' +
  '<time datetime="2026-11-02T08:00:00.000Z"></time></section>';

Deno.test('Activity acceptance rejects the unlinked fallback and requires the real mutation in the stream', () => {
  assertEquals(assertDocumentedActivity([event], 42, html), 'event-1');
  assertThrows(
    () =>
      assertLinkedActivityHtml(
        '<section data-capability="streams" data-capability-state="installed-unwired">Record activity is not linked from the record service to this stream resource.</section>',
      ),
    StreamLinkAcceptanceError,
  );
  assertThrows(() => assertDocumentedActivity([], 42, html));
  assertThrows(() => assertDocumentedActivity([event], 999, html));
  assertThrows(
    () =>
      assertLinkedActivityHtml(
        '<section data-capability="streams" data-capability-state="installed-unwired">Latest record changes</section>',
      ),
    StreamLinkAcceptanceError,
  );
  assertThrows(() =>
    assertDocumentedActivity(
      [event],
      42,
      '<section data-capability="streams" data-capability-state="ready">Latest events from the record activity stream.</section>Anonymous REC-10482 2026-11-02T08:00:00.000Z',
    )
  );
  assertThrows(() => assertLinkedActivityHtml(html.replace('state="ready"', 'state="empty"')));
  assertThrows(() =>
    assertLinkedActivityHtml(
      '<section data-capability="workers" data-capability-state="ready">Latest record changes</section>',
    )
  );
});
