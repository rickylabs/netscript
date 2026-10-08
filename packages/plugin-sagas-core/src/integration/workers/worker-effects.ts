import type { JobId, JobPayloadSchema, TaskId } from '@netscript/plugin-workers-core';
import { validateJobPayload } from '@netscript/plugin-workers-core/runtime';
import { canonicalCommandJson, jsonCodec } from '@netscript/service/commands';

/** Selected worker job schema and branded identity, directly carried by its definition. */
export type WorkerJobEffectDefinition<TId extends string, TPayload> = Readonly<
  { id: JobId<TId>; payloadSchema?: JobPayloadSchema<TPayload> }
>;
/** Selected worker task schema and branded identity, directly carried by its definition. */
export type WorkerTaskEffectDefinition<TId extends string, TPayload> = Readonly<
  { id: TaskId<TId>; payloadSchema?: JobPayloadSchema<TPayload> }
>;

/** Routing selected by the application's C5 checked-worker sink registry. */
export type WorkerCommandEffectOptions = Readonly<{
  destination: string;
  topic: string;
}>;

import type { WorkerCommandEffect } from '../../domain/saga-transition-effect.ts';
export type { WorkerCommandEffect } from '../../domain/saga-transition-effect.ts';

type Binding = Readonly<
  {
    payload: unknown;
    schema: JobPayloadSchema<unknown>;
    originalJson?: string;
    invalidJson: boolean;
  }
>;
const bindings = new WeakMap<WorkerCommandEffect, Binding>();
const codec = jsonCodec<unknown>({
  '~standard': { version: 1, vendor: 'netscript', validate: (value) => ({ value }) },
});

function effect(
  kind: WorkerCommandEffect['kind'],
  definition: Readonly<{ id: string; payloadSchema?: JobPayloadSchema<unknown> }>,
  payload: unknown,
  options: WorkerCommandEffectOptions,
): WorkerCommandEffect {
  const standard = definition.payloadSchema?.['~standard'];
  if (!standard || standard.version !== 1 || typeof standard.validate !== 'function') {
    throw new TypeError(
      'Durable worker effect requires the selected definition runtime payload schema.',
    );
  }
  for (const value of [definition.id, options.destination, options.topic]) {
    if (
      typeof value !== 'string' || !value.trim() || new TextEncoder().encode(value).length > 200
    ) {
      throw new TypeError('Durable worker effect requires bounded target and routing identifiers.');
    }
  }
  let originalJson: string | undefined;
  let invalidJson = false;
  try {
    originalJson = canonicalCommandJson(codec.encode(payload));
  } catch {
    invalidJson = true;
  }
  const result: WorkerCommandEffect = Object.freeze({
    kind,
    targetId: definition.id,
    destination: options.destination,
    topic: options.topic,
  });
  bindings.set(result, {
    payload: invalidJson ? undefined : structuredClone(payload),
    originalJson,
    invalidJson,
    schema: {
      '~standard': {
        version: 1,
        vendor: standard.vendor,
        validate: standard.validate.bind(standard),
      },
    },
  });
  return result;
}

/** Declare a job effect without triggering a worker or starting a resource. */
export function workerJobEffect<TId extends string, TPayload>(
  definition: WorkerJobEffectDefinition<TId, TPayload>,
  payload: NoInfer<TPayload>,
  options: WorkerCommandEffectOptions,
): WorkerCommandEffect {
  return effect('worker-job', definition, payload, options);
}

/** Declare a schema-backed task effect; type-only task definitions are refused. */
export function workerTaskEffect<TId extends string, TPayload>(
  definition: WorkerTaskEffectDefinition<TId, TPayload>,
  payload: NoInfer<TPayload>,
  options: WorkerCommandEffectOptions,
): WorkerCommandEffect {
  return effect('worker-task', definition, payload, options);
}

/** Internal producer boundary: validate selected schema then encode bounded canonical JSON. */
export async function encodeWorkerEffect(value: WorkerCommandEffect): Promise<string> {
  const binding = bindings.get(value);
  if (!binding) throw new TypeError('Foreign or forged durable worker effect.');
  if (binding.invalidJson) throw new TypeError('Durable worker payload must be bounded I-JSON.');
  const payload = await validateJobPayload(
    binding.schema,
    structuredClone(binding.payload),
    value.targetId,
  );
  const encoded = canonicalCommandJson(codec.encode(payload));
  if (encoded !== binding.originalJson) {
    throw new TypeError('Durable worker schema must preserve canonical JSON identity.');
  }
  return encoded;
}
