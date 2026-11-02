import { ExecutionRecordResponseSchema } from '@netscript/plugin-workers-core/contracts/v1';
import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import {
  assertDocumentedActivity,
  assertDocumentedSeedExecution,
  assertLinkedActivityHtml,
  DOCUMENTED_SCAFFOLD_DOC,
  documentedScaffoldCommands,
  seedExecutionUrl,
  SeedHandoffAcceptanceError,
  StreamLinkAcceptanceError,
  waitForDocumentedActivity,
} from '../../../../src/application/gates/scaffold/documented-scaffold-contract.ts';
import { RUNTIME_GATES } from '../../../../suites/scaffold/capability-suites.ts';
import { GATE } from '../../../../src/domain/cli-surface.ts';

const seedId = '9023b4e5-7889-4bb8-a8b9-06c1e237eb9a';
const executionId = 'df39dd9c-72ce-4b0a-a8f3-e772947a96aa';
// Parse the real public DTO: correlationId is intentionally removed by this contract.
const execution = ExecutionRecordResponseSchema.parse({
  id: executionId,
  executionId,
  concept: 'job',
  jobId: 'health-check',
  topic: 'default',
  status: 'completed',
  triggeredBy: 'manual',
  triggeredAt: '2026-11-02T08:00:00.000Z',
  startedAt: '2026-11-02T08:00:00.000Z',
  completedAt: '2026-11-02T08:00:00.000Z',
  exitCode: 0,
  duration: 1,
  error: null,
  workerId: 'test-worker',
  progressPercent: 100,
  progressMessage: 'Workspace checked',
  attempt: 1,
  maxAttempts: 3,
  correlationId: 'scaffold-seed:' + seedId,
  result: { workspaceEntries: 3, payload: { source: 'database-seed' } },
});

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
  assert(
    RUNTIME_GATES.indexOf(GATE.BEHAVIOR_DOCUMENTED_SCAFFOLD) >
      RUNTIME_GATES.indexOf(GATE.SCAFFOLD_INIT),
  );
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

Deno.test('seed acceptance uses the public correlation filter and requires completion with genuine work', () => {
  assertEquals(
    seedExecutionUrl('http://workers.invalid', seedId).pathname,
    '/api/v1/workers/executions/by-correlation/scaffold-seed%3A' + seedId,
  );
  assert(!('correlationId' in execution));
  assertEquals(assertDocumentedSeedExecution({ executions: [execution] }), executionId);
  for (
    const executions of [[], [{ ...execution, status: 'running' }], [{
      ...execution,
      jobId: 'unrelated',
    }], [execution, execution]]
  ) {
    assertThrows(
      () => assertDocumentedSeedExecution({ executions }),
      SeedHandoffAcceptanceError,
    );
  }
  for (
    const change of [{ progressPercent: 0 }, { completedAt: null }, {
      result: { workspaceEntries: 0 },
    }]
  ) {
    assertThrows(() =>
      assertDocumentedSeedExecution({ executions: [{ ...execution, ...change }] })
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

Deno.test('Activity waits through an empty projection without repeating the committed mutation', async () => {
  let reads = 0;
  let eventReads = 0;
  const delays: number[] = [];
  const id = await waitForDocumentedActivity(
    {
      readHtml: () =>
        Promise.resolve(++reads === 1 ? html.replace('state="ready"', 'state="empty"') : html),
      readEvents: () => {
        eventReads++;
        return Promise.resolve([event]);
      },
    },
    42,
    {
      attempts: 3,
      delay: (ms) => {
        delays.push(ms);
        return Promise.resolve();
      },
    },
  );
  assertEquals(id, 'event-1');
  assertEquals(reads, 2);
  assertEquals(eventReads, 1);
  assertEquals(delays, [1000]);
});

Deno.test('Activity unlinked state is terminal and never reads a stream or sleeps', async () => {
  let reads = 0;
  await assertRejects(() =>
    waitForDocumentedActivity(
      {
        readHtml: () => {
          reads++;
          return Promise.resolve(html.replace('state="ready"', 'state="installed-unwired"'));
        },
        readEvents: () => Promise.reject(new Error('Unexpected stream read')),
      },
      42,
      { delay: () => Promise.reject(new Error('Unexpected retry')) },
    ), StreamLinkAcceptanceError);
  assertEquals(reads, 1);
});

Deno.test('Activity projection retry budget is finite', async () => {
  let reads = 0;
  await assertRejects(
    () =>
      waitForDocumentedActivity(
        {
          readHtml: () => {
            reads++;
            return Promise.resolve(html.replace('state="ready"', 'state="empty"'));
          },
          readEvents: () => Promise.resolve([]),
        },
        42,
        { attempts: 2, delay: () => Promise.resolve() },
      ),
    Error,
    'bounded budget',
  );
  assertEquals(reads, 2);
});

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
