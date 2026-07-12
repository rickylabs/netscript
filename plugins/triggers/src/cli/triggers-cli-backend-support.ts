import type { PluginCliArgs, PluginCliResult } from '@netscript/plugin/cli';
import type {
  FileWatchTriggerPayload,
  ManualTriggerPayload,
  ScheduledTriggerPayload,
  TriggerDefinition,
  TriggerEvent,
  TriggerEventId,
  TriggerId,
  TriggerKind,
  WebhookTriggerPayload,
} from '@netscript/plugin-triggers-core/domain';
/** Inspection summary parsed from a trigger source file. */
export type TriggerInspectionEntry = Readonly<{
  id: string;
  kind: TriggerKind | 'unknown';
  file: string;
  cron?: string;
  timezone?: string;
  path?: string;
  verifier?: string;
  secretEnv?: string;
  description?: string;
  tags?: readonly string[];
}>;

export function ok(message: string, data: unknown): PluginCliResult {
  return { code: 0, message, data };
}

export function fail(message: string): PluginCliResult {
  return { code: 1, message };
}

export function requiredValue(args: PluginCliArgs, label: string): string {
  const value = args.values?.[0];
  if (!value) {
    throw new Error(`Missing ${label}.`);
  }
  return value;
}

export function flag(args: PluginCliArgs, name: string): string | undefined {
  const value = args.flags?.[name];
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

export function booleanFlag(args: PluginCliArgs, name: string): boolean {
  const value = args.flags?.[name];
  return value === true || value === 'true' || value === 1 || value === '1';
}

export function numericFlag(args: PluginCliArgs, name: string): number | undefined {
  const value = flag(args, name);
  if (value === undefined) {
    return undefined;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Flag --${name} must be a number.`);
  }
  return number;
}

export function parseJsonFlag(args: PluginCliArgs, name: string): unknown {
  const value = flag(args, name);
  return value === undefined ? undefined : JSON.parse(value);
}

export function inspectTriggerSource(
  file: string,
  source: string,
): TriggerInspectionEntry | undefined {
  const id = [...source.matchAll(/\bid:\s*(['"`])([^'"`]+)\1/g)].at(-1)?.[2];
  if (id === undefined) {
    return undefined;
  }
  return {
    id,
    kind: detectKind(source),
    file,
    cron: stringProperty(source, 'cron'),
    timezone: stringProperty(source, 'timezone'),
    path: stringProperty(source, 'path'),
    verifier: stringProperty(source, 'verifier'),
    secretEnv: stringProperty(source, 'secretEnv'),
    description: stringProperty(source, 'description'),
    tags: stringArrayProperty(source, 'tags'),
  };
}

export function resolveTriggerDefinition(
  module: Record<string, unknown>,
): TriggerDefinition | undefined {
  const candidates = [module.default, ...Object.values(module)];
  return candidates.find(isTriggerDefinition) as TriggerDefinition | undefined;
}

export function createSyntheticEvent(
  definition: TriggerDefinition,
  payload: unknown,
  idempotencyKey?: string,
): TriggerEvent {
  const now = new Date().toISOString();
  const eventBase = {
    id: `cli_${crypto.randomUUID()}` as TriggerEventId,
    triggerId: definition.id as TriggerId,
    kind: definition.kind,
    status: 'pending' as const,
    payload: payloadForKind(definition, payload),
    attempt: 0,
    detectedAt: now,
    updatedAt: now,
    idempotencyKey,
  };
  return eventBase as TriggerEvent;
}

function detectKind(source: string): TriggerInspectionEntry['kind'] {
  if (source.includes('defineWebhook')) {
    return 'webhook';
  }
  if (source.includes('defineFileWatch')) {
    return 'file-watch';
  }
  if (source.includes('defineScheduledTrigger')) {
    return 'scheduled';
  }
  return 'unknown';
}

function isTriggerDefinition(value: unknown): value is TriggerDefinition {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<TriggerDefinition>;
  return typeof candidate.id === 'string' &&
    typeof candidate.kind === 'string' &&
    typeof candidate.handler === 'function';
}

function payloadForKind(definition: TriggerDefinition, payload: unknown): unknown {
  switch (definition.kind) {
    case 'webhook':
      return {
        body: payload ?? {},
        headers: {},
        method: 'POST',
        path: definition.path,
      } satisfies WebhookTriggerPayload;
    case 'file-watch':
      return {
        path: typeof payload === 'string' ? payload : definition.paths[0],
        kind: 'create',
      } satisfies FileWatchTriggerPayload;
    case 'scheduled': {
      const now = new Date().toISOString();
      return {
        scheduledAt: now,
        firedAt: now,
        cron: definition.cron,
        timezone: definition.timezone,
      } satisfies ScheduledTriggerPayload;
    }
    case 'manual': {
      const now = new Date().toISOString();
      return {
        payload,
        firedAt: now,
      } satisfies ManualTriggerPayload;
    }
    default:
      return payload ?? {};
  }
}

function stringProperty(source: string, property: string): string | undefined {
  return source.match(new RegExp(`\\b${property}:\\s*(['\"])(.*?)\\1`))?.[2];
}

function stringArrayProperty(source: string, property: string): readonly string[] | undefined {
  const literal = source.match(new RegExp(`\\b${property}:\\s*(\\[[^\\]]*\\])`))?.[1];
  if (literal === undefined) return undefined;
  try {
    const value = JSON.parse(literal);
    return Array.isArray(value) && value.every((item) => typeof item === 'string')
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}
