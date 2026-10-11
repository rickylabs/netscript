import { loadConfig } from '@netscript/config';

/** Resolve configured group windows once; unknown triggers retain the seven-day default. */
export async function loadTriggerRetention(): Promise<(triggerId: string) => number> {
  let config;
  try {
    config = await loadConfig();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('No config file found.')) return () => 7;
    throw error;
  }
  const days = new Map<string, number>();
  for (const group of config.triggers?.groups ?? []) {
    for (const trigger of group.triggers) days.set(trigger.id, group.retention.kvDays);
  }
  return (triggerId) => days.get(triggerId) ?? 7;
}
