import { loadConfig } from '@netscript/config';
import type { SagaStateEnvelope } from '@netscript/plugin-sagas-core/domain';

/** Resolve the configured per-definition terminal and archive policies at startup. */
export async function loadSagaRetention(): Promise<
  Readonly<{
    completedDays(envelope: SagaStateEnvelope): number;
    archiveToDb(sagaId: string): boolean;
  }>
> {
  let config;
  try {
    config = await loadConfig();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('No config file found.')) {
      return { completedDays: () => 7, archiveToDb: () => false };
    }
    throw error;
  }
  const policies = new Map<string, { completedDays: number; archiveToDb: boolean }>();
  for (const group of config.sagas?.groups ?? []) {
    for (const saga of group.sagas) {
      policies.set(saga.id, {
        completedDays: group.retention?.completedDays ?? 7,
        archiveToDb: group.retention?.archiveToDb ?? false,
      });
    }
  }
  return {
    completedDays: (envelope) => policies.get(envelope.metadata.sagaId ?? '')?.completedDays ?? 7,
    archiveToDb: (sagaId) => policies.get(sagaId)?.archiveToDb ?? false,
  };
}
