import { assertEquals } from 'jsr:@std/assert';

import type { SagaClockPort } from '../../src/ports/mod.ts';
import type { SagaMessageId } from '../../src/domain/mod.ts';
import {
  type SagaScheduledMessageRecord,
  SagaScheduler,
  type SagaSchedulerStorePort,
} from '../../src/runtime/mod.ts';
import type { LoggerPort } from '../../src/runtime/logger.ts';

Deno.test('SagaScheduler drain reports dispatch and markFailed errors', async () => {
  const store = new FailingMarkFailedStore([scheduledRecord('scheduled-1')]);
  const logger = new RecordingLogger();
  const scheduler = new SagaScheduler({
    clock: new FixedClock(),
    store,
    logger,
    dispatch: () => Promise.reject(new Error('dispatch unavailable')),
  });

  await scheduler.start();
  const result = await scheduler.drainDue();

  assertEquals(result, {
    claimed: 1,
    dispatched: 0,
    failed: 1,
    failures: [
      {
        id: 'scheduled-1' as SagaMessageId,
        dispatchError: 'dispatch unavailable',
        markFailedError: 'mark failed unavailable',
      },
    ],
  });
  assertEquals(store.markFailedCalls, [
    {
      id: 'scheduled-1',
      error: 'dispatch unavailable',
    },
  ]);
  assertEquals(logger.errors, [
    {
      message: 'Saga scheduler dispatch failed.',
      attributes: {
        scheduledMessageId: 'scheduled-1',
        error: 'dispatch unavailable',
      },
    },
    {
      message: 'Saga scheduler failed to mark scheduled message failed.',
      attributes: {
        scheduledMessageId: 'scheduled-1',
        dispatchError: 'dispatch unavailable',
        error: 'mark failed unavailable',
      },
    },
  ]);
});

class FixedClock implements SagaClockPort {
  readonly id = 'fixed-clock';

  now(): Date {
    return new Date('2026-05-19T00:00:00.000Z');
  }

  sleep(_ms: number): Promise<void> {
    return Promise.resolve();
  }
}

class FailingMarkFailedStore implements SagaSchedulerStorePort {
  readonly markFailedCalls: Array<{ id: string; error: string }> = [];

  constructor(private readonly records: readonly SagaScheduledMessageRecord[]) {}

  save(_record: SagaScheduledMessageRecord): Promise<void> {
    return Promise.resolve();
  }

  claimDue(_now: Date, _limit: number): Promise<readonly SagaScheduledMessageRecord[]> {
    return Promise.resolve(this.records);
  }

  markDispatched(_id: string, _dispatchedAt: Date): Promise<void> {
    return Promise.resolve();
  }

  markFailed(id: string, _failedAt: Date, error: string): Promise<void> {
    this.markFailedCalls.push({ id, error });
    return Promise.reject(new Error('mark failed unavailable'));
  }
}

class RecordingLogger implements LoggerPort {
  readonly errors: Array<{
    message: string;
    attributes?: Readonly<Record<string, unknown>>;
  }> = [];

  debug(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  info(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  warn(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  error(message: string, attributes?: Readonly<Record<string, unknown>>): void {
    this.errors.push({ message, attributes });
  }
}

function scheduledRecord(id: string): SagaScheduledMessageRecord {
  const date = new Date('2026-05-19T00:00:00.000Z');
  return {
    id: id as SagaMessageId,
    message: {
      type: 'scheduled.ready',
      payload: {},
    },
    scheduledFor: date,
    status: 'claimed',
    attempts: 1,
    createdAt: date,
    claimedAt: date,
  };
}
