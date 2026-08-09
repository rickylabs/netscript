import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import {
  assertFlowBChangeContext,
  type FlowBProducerIdentity,
  type FlowBStreamBatch,
  selectFlowBStreamChange,
  streamChangeCorrelationId,
} from './select-flow-b-stream-change.ts';
import { createStreamSseReplayStateV1 } from '@netscript/plugin-streams-core/sse';

const PRODUCER: FlowBProducerIdentity = {
  correlationId: 'flow-b-correlation',
  traceId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
};

Deno.test('selectFlowBStreamChange skips startup snapshots and selects one execution record', async () => {
  const batches = [
    batch([
      change('flow-b-callback', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'job'),
      change('health-check', 'cccccccccccccccccccccccccccccccc', 'job'),
    ], 'offset-1'),
    batch([
      change('flow-b-correlation', PRODUCER.traceId, 'execution'),
      change('workers-plugin-health-check', 'dddddddddddddddddddddddddddddddd', 'job'),
    ], 'offset-2'),
  ];
  let readIndex = 0;

  const receipt = await selectFlowBStreamChange(
    PRODUCER,
    createStreamSseReplayStateV1(),
    {
      maxBatches: 4,
      timeoutMs: 1_000,
      readBatch: () => Promise.resolve(batches[readIndex++]!),
    },
  );

  assertEquals(streamChangeCorrelationId(receipt.change), PRODUCER.correlationId);
  assertEquals(receipt.change.type, 'execution');
  assertEquals(receipt.batchesRead, 2);
  assertEquals(receipt.seenCorrelationIds, [
    'flow-b-callback',
    'health-check',
    'flow-b-correlation',
  ]);
  assertEquals(receipt.state.lastCommittedOffset, 'offset-2');
});

Deno.test('selectFlowBStreamChange exhaustion names expected and observed correlations', async () => {
  const error = await assertRejects(
    () =>
      selectFlowBStreamChange(PRODUCER, createStreamSseReplayStateV1(), {
        maxBatches: 2,
        timeoutMs: 1_000,
        readBatch: (_state, _remainingMs) =>
          Promise.resolve(batch([
            change('health-check', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'job'),
            change(
              'workers-plugin-health-check',
              'cccccccccccccccccccccccccccccccc',
              'job',
            ),
          ], 'offset-no-match')),
      }),
    Error,
    'Flow-B stream selection exhausted after 2/2 batch(es)',
  );
  assertIncludesAll(error.message, [
    'expectedCorrelationId=flow-b-correlation',
    'observedCorrelationIds=[health-check, workers-plugin-health-check]',
  ]);
});

Deno.test('selectFlowBStreamChange enforces the total wait bound between batches', async () => {
  let clock = 0;
  let reads = 0;
  const error = await assertRejects(
    () =>
      selectFlowBStreamChange(PRODUCER, createStreamSseReplayStateV1(), {
        maxBatches: 10,
        timeoutMs: 100,
        now: () => clock,
        readBatch: () => {
          reads++;
          clock = 101;
          return Promise.resolve(
            batch([change('health-check', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'job')], 'o1'),
          );
        },
      }),
    Error,
    'Flow-B stream selection exhausted after 1/10 batch(es) within 100ms',
  );
  assertEquals(reads, 1);
  assertIncludesAll(error.message, [
    'expectedCorrelationId=flow-b-correlation',
    'observedCorrelationIds=[health-check]',
  ]);
});

Deno.test('TC-14 rejects a matched record without traceparent', () => {
  const error = assertThrows(
    () =>
      assertFlowBChangeContext(PRODUCER, {
        value: { correlationId: PRODUCER.correlationId },
        headers: {},
      }),
    Error,
    'matched Flow-B record has no traceparent',
  );
  assertIncludesAll(error.message, [
    `producerTraceId=${PRODUCER.traceId}`,
    `correlationId=${PRODUCER.correlationId}`,
  ]);
});

Deno.test('TC-14 rejects a matched record whose trace differs from the producer', () => {
  const error = assertThrows(
    () =>
      assertFlowBChangeContext(
        PRODUCER,
        change('flow-b-correlation', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'execution'),
      ),
    Error,
    'matched Flow-B record trace differs from producer',
  );
  assertIncludesAll(error.message, [
    `producerTraceId=${PRODUCER.traceId}`,
    'recordTraceId=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    `correlationId=${PRODUCER.correlationId}`,
  ]);
});

function batch(
  changes: readonly ReturnType<typeof change>[],
  offset: string,
): FlowBStreamBatch {
  return {
    changes,
    state: {
      ...createStreamSseReplayStateV1(),
      lastCommittedOffset: offset,
    },
  };
}

function change(
  correlationId: string,
  traceId: string,
  type: 'job' | 'execution',
): {
  readonly type: string;
  readonly key: string;
  readonly value: { readonly correlationId: string };
  readonly headers: {
    readonly operation: 'upsert';
    readonly correlationId: string;
    readonly traceparent: string;
  };
} {
  return {
    type,
    key: correlationId,
    value: { correlationId },
    headers: {
      operation: 'upsert',
      correlationId,
      traceparent: `00-${traceId}-1111111111111111-01`,
    },
  };
}

function assertIncludesAll(actual: string, expected: readonly string[]): void {
  for (const value of expected) {
    if (!actual.includes(value)) throw new Error(`Expected diagnostic to include ${value}`);
  }
}
