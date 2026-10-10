/** Compile-only consumer proof: hooks are type-checked, never invoked outside React. */
import { assertType, type IsExact } from '@std/testing/types';
import { useLiveQuery } from '@tanstack/react-db';
import type { CollectionStatus } from '@tanstack/db';
import {
  createWorkersStreamDB,
  type WorkerExecution,
  type WorkerJob,
} from '@netscript/plugin-workers/streams';
import { createSagasStreamDB, type SagaInstance } from '@netscript/plugin-sagas/streams';
import {
  createTriggersStreamDB,
  type TriggerStreamEntity,
} from '@netscript/plugin-triggers/streams';
import { type AuthSession, createAuthStreamDB } from '@netscript/plugin-auth/streams';

function useWorkerExecutions() {
  const db = createWorkersStreamDB();
  const result = useLiveQuery((q) => q.from({ item: db.collections.execution }));
  assertType<IsExact<Pick<typeof result.data[number], keyof WorkerExecution>, WorkerExecution>>(
    true,
  );
  assertType<IsExact<typeof result.state, Map<string | number, typeof result.data[number]>>>(true);
  assertType<IsExact<typeof result.status, CollectionStatus>>(true);
  const statuses = result.data.map((item) => item.status);
  assertType<IsExact<typeof statuses, WorkerExecution['status'][]>>(true);
  const jobs = useLiveQuery((q) => q.from({ item: db.collections.job }));
  assertType<IsExact<Pick<typeof jobs.data[number], keyof WorkerJob>, WorkerJob>>(true);
}

function useSagaInstances() {
  const db = createSagasStreamDB();
  const result = useLiveQuery((q) => q.from({ item: db.collections.sagaInstance }));
  assertType<IsExact<Pick<typeof result.data[number], keyof SagaInstance>, SagaInstance>>(true);
  assertType<IsExact<typeof result.state, Map<string | number, typeof result.data[number]>>>(true);
  assertType<IsExact<typeof result.status, CollectionStatus>>(true);
  const statuses = result.data.map((item) => item.status);
  assertType<IsExact<typeof statuses, SagaInstance['status'][]>>(true);
}

function useTriggerEvents() {
  const db = createTriggersStreamDB();
  const result = useLiveQuery((q) => q.from({ item: db.collections.triggerEvent }));
  assertType<
    IsExact<Pick<typeof result.data[number], keyof TriggerStreamEntity>, TriggerStreamEntity>
  >(true);
  assertType<IsExact<typeof result.state, Map<string | number, typeof result.data[number]>>>(true);
  assertType<IsExact<typeof result.status, CollectionStatus>>(true);
  const statuses = result.data.map((item) => item.status);
  assertType<IsExact<typeof statuses, TriggerStreamEntity['status'][]>>(true);
}

function useAuthSessions() {
  const db = createAuthStreamDB();
  const result = useLiveQuery((q) => q.from({ item: db.collections.authSession }));
  assertType<IsExact<Pick<typeof result.data[number], keyof AuthSession>, AuthSession>>(true);
  assertType<IsExact<typeof result.state, Map<string | number, typeof result.data[number]>>>(true);
  assertType<IsExact<typeof result.status, CollectionStatus>>(true);
  const states = result.data.map((item) => item.state);
  assertType<IsExact<typeof states, AuthSession['state'][]>>(true);
}

void [useWorkerExecutions, useSagaInstances, useTriggerEvents, useAuthSessions];
