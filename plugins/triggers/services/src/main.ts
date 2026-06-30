/**
 * Triggers service entrypoint.
 *
 * Converged thin connector: serves the type-sound triggers v1 oRPC contract via
 * the mandated `createPluginService(router, {...}).serve()` surface (mirroring
 * the reference auth connector), fronts the raw HMAC webhook ingress as a
 * `rawRoutes` entry (it verifies a signature over the raw request bytes, which
 * is incompatible with oRPC Zod parsing), and lets `withHealth`/`withServiceInfo`
 * own `/health`, `/health/live`, `/health/ready`, and the service-info root.
 *
 * Unlike auth/workers (which receive a host-provided `PluginServiceContext`),
 * the triggers API is launched as a direct `deno run services/src/main.ts` by
 * the Aspire contribution and has no host DB; it self-bootstraps its runtime
 * context (project trigger definitions, KV-backed event store, ingress) in the
 * `import.meta.main` block below.
 *
 * @module
 */

import type { Context } from 'hono';
import type { ServiceBuilder } from '@netscript/service';
import { createPluginService } from '@netscript/plugin/service';
import {
  HmacSha256WebhookVerifier,
  MemoryWebhookVerifier,
} from '@netscript/plugin-triggers-core/adapters';
import { KvTriggerEventStore, openTriggerRuntimeKv } from '@netscript/plugin-triggers-core/stores';
import { TriggersError } from '@netscript/plugin-triggers-core/domain';
import type {
  TriggerEvent,
  TriggerEventId,
  TriggerEventStatus,
  WebhookDefinition,
} from '@netscript/plugin-triggers-core/domain';
import type {
  ProcessableTriggerDefinition,
  TriggerEventListOptions,
  TriggerEventStorePort,
  TriggerIngressPort,
  TriggerIngressRequest,
  TriggerIngressResponse,
  TriggerProcessorPort,
} from '@netscript/plugin-triggers-core/ports';
import { createTriggerIngress } from '@netscript/plugin-triggers-core/runtime';
import { TRIGGERS_API_DEFAULT_PORT, TRIGGERS_API_SERVICE_NAME } from '../../src/constants.ts';
import denoJson from '../../deno.json' with { type: 'json' };
import type { KvStore } from '@netscript/kv';
import { loadProjectTriggerDefinitions } from '../../src/runtime/project-trigger-registry.ts';
import { createRuntimeTriggerProcessor } from '../../src/runtime/trigger-runtime-processor.ts';
import { router } from './router.ts';
import type { TriggerServiceContext } from './routers/v1-types.ts';

export {
  TRIGGER_ACTION_KINDS,
  TRIGGER_BACKFILL_POLICIES,
  TRIGGER_DURABILITY_TIERS,
  TRIGGER_EVENT_STATUSES,
  TRIGGER_KINDS,
  TRIGGER_RESERVED_KINDS,
  TRIGGER_RUNTIME_KINDS,
} from '@netscript/plugin-triggers-core/domain';
export type {
  CronExpression,
  DeferAction,
  EnqueueJobAction,
  EnqueueJobOptions,
  FileWatchDefinition,
  FileWatchLifecycle,
  FileWatchStabilityThreshold,
  FileWatchTriggerPayload,
  JobDefinition,
  JobId,
  ManualTriggerDefinition,
  ManualTriggerPayload,
  QueueTriggerDefinition,
  QueueTriggerPayload,
  RuntimeTriggerDefinition,
  ScheduledTriggerDefinition,
  ScheduledTriggerPayload,
  ScheduledTriggerSpec,
  StreamTriggerDefinition,
  StreamTriggerPayload,
  TriggerActionResult,
  TriggerBackfillPolicy,
  TriggerBackfillSpec,
  TriggerCircuitBreakerSpec,
  TriggerConcurrencySpec,
  TriggerContext,
  TriggerDeduplicationSpec,
  TriggerDefinition,
  TriggerDefinitionBase,
  TriggerDurabilityTier,
  TriggerEvent,
  TriggerEventId,
  TriggerEventStatus,
  TriggerHandler,
  TriggerId,
  TriggerKind,
  TriggerKnownKind,
  TriggerPayload,
  TriggerReservedKind,
  TriggerRetryPolicy,
  TriggerRuntimeKind,
  WebhookDefinition,
  WebhookId,
  WebhookTriggerPayload,
  WebhookVerifierKind,
} from '@netscript/plugin-triggers-core/domain';
export type {
  ProcessableTriggerDefinition,
  TriggerEventListOptions,
  TriggerEventStorePort,
  TriggerProcessorPort,
  TriggerProcessorStopOptions,
  TriggerProcessResult,
} from '@netscript/plugin-triggers-core/ports';
export type { TriggerServiceContext } from './routers/v1-types.ts';

/** Connector version, single-sourced from the triggers package `deno.json`. */
const VERSION: string = denoJson.version;

/** External path prefix preserved for the raw HMAC webhook ingress. */
const WEBHOOK_PATH_PREFIX = '/api/v1/webhooks/' as const;

/** Options for assembling the triggers service runtime context. */
export type TriggersServiceOptions = Readonly<{
  /** HTTP port for the front listener. Defaults to `PORT` env or the plugin default. */
  port?: number;
  /** Trigger definitions; defaults to the generated project registry. */
  definitions?: readonly ProcessableTriggerDefinition[];
  /** Event store; defaults to a KV-backed store. */
  eventStore?: TriggerEventStorePort;
  /** Trigger processor backing the ingress; defaults to the runtime processor. */
  processor?: TriggerProcessorPort;
  /** Pre-opened KV adapter; defaults to the runtime KV. */
  kv?: KvStore;
}>;
type TriggerServiceContextSource = TriggerServiceContext | (() => TriggerServiceContext);

/** Assemble the triggers service runtime context from the supplied or default ports. */
export async function createTriggersServiceContext(
  options: TriggersServiceOptions = {},
): Promise<TriggerServiceContext> {
  // Open KV only when a default event store or processor must be constructed;
  // when both are supplied no KV is needed. Resolving to a concrete `KvStore`
  // when needed keeps the store constructor cast-free.
  const definitions = options.definitions ?? await loadProjectTriggerDefinitions();
  const needsKv = options.eventStore === undefined || options.processor === undefined;
  const kv: KvStore | undefined = needsKv ? options.kv ?? await openTriggerRuntimeKv() : options.kv;
  const eventStore = options.eventStore ??
    new KvTriggerEventStore({ kv: requireKv(kv) });
  const processor = options.processor ?? await createRuntimeTriggerProcessor({ kv });
  const hmacVerifier = new HmacSha256WebhookVerifier({
    signatureHeader: 'x-hub-signature-256',
  });
  const memoryVerifier = new MemoryWebhookVerifier();
  const ingress = createTriggerIngress({
    definitions: definitions.filter(isWebhookDefinition),
    eventStore,
    processor,
    verifier: hmacVerifier,
    selectVerifier: (definition) => definition.verifier === 'memory' ? memoryVerifier : undefined,
    resolveSecret: (definition) =>
      definition.secretEnv === undefined ? undefined : Deno.env.get(definition.secretEnv),
  });
  return { definitions, eventStore, ingress };
}

/**
 * Build the converged triggers service builder.
 *
 * Returns a ready {@link ServiceBuilder}; the caller serves with `.serve()`.
 * `serveRpc: true` wires the v1 contract router; the raw HMAC webhook routes are
 * mounted via `rawRoutes`, preserving the external `POST /api/v1/webhooks/:triggerId`
 * (and `/:triggerId/*`) paths existing senders use.
 */
export function createTriggersService(
  context: TriggerServiceContextSource,
  options: Readonly<{ port?: number }> = {},
): ServiceBuilder<typeof router> {
  const port = options.port ?? Number(Deno.env.get('PORT') ?? TRIGGERS_API_DEFAULT_PORT);
  const resolveContext = () => typeof context === 'function' ? context() : context;
  const webhookHandler = (c: Context): Promise<Response> => {
    const resolvedContext = resolveContext();
    return acceptWebhook(c, resolvedContext.ingress, resolvedContext.definitions);
  };
  return createPluginService(router, {
    name: TRIGGERS_API_SERVICE_NAME,
    version: VERSION,
    port,
    serveRpc: true,
    openApi: {
      title: 'Triggers API',
      description: 'Trigger introspection, event introspection, and webhook ingress.',
    },
    docs: {},
    context: resolveContext,
    rawRoutes: [
      { method: 'post', path: `${WEBHOOK_PATH_PREFIX}:triggerId`, handler: webhookHandler },
      { method: 'post', path: `${WEBHOOK_PATH_PREFIX}:triggerId/*`, handler: webhookHandler },
    ],
  });
}

/**
 * Start the triggers service: assemble the runtime context, then serve.
 *
 * Self-bootstrapping (no host `PluginServiceContext`), matching how the Aspire
 * contribution launches this entrypoint as a direct `deno run`.
 */
export async function startTriggersService(
  options: TriggersServiceOptions = {},
): Promise<void> {
  let context = createUnavailableTriggersServiceContext();
  const port = options.port ?? Number(Deno.env.get('PORT') ?? TRIGGERS_API_DEFAULT_PORT);
  await createTriggersService(() => context, { port }).serve();

  queueMicrotask(async () => {
    try {
      context = await createTriggersServiceContext(options);
      console.log(`[Triggers API] Running on http://localhost:${port}`);
    } catch (error) {
      console.error('[Triggers API] Failed to finish post-listen startup:', error);
    }
  });
}

function createUnavailableTriggersServiceContext(): TriggerServiceContext {
  return {
    definitions: [],
    eventStore: new UnavailableTriggerEventStore(),
    ingress: unavailableTriggerIngress,
  };
}

class UnavailableTriggerEventStore implements TriggerEventStorePort {
  save(_event: TriggerEvent): Promise<void> {
    return Promise.reject(triggerRuntimeUnavailable());
  }

  load(_eventId: TriggerEventId): Promise<TriggerEvent | undefined> {
    return Promise.resolve(undefined);
  }

  updateStatus(_eventId: TriggerEventId, _status: TriggerEventStatus): Promise<void> {
    return Promise.reject(triggerRuntimeUnavailable());
  }

  list(_options?: TriggerEventListOptions): Promise<readonly TriggerEvent[]> {
    return Promise.resolve([]);
  }
}

const unavailableTriggerIngress: TriggerIngressPort = {
  accept(_request: TriggerIngressRequest): Promise<TriggerIngressResponse> {
    return Promise.reject(triggerRuntimeUnavailable());
  },
};

function triggerRuntimeUnavailable(): Error {
  return new Error('Triggers runtime context is not ready yet.');
}

/** Assert a KV handle is present (always true on the default-event-store path). */
function requireKv(kv: KvStore | undefined): KvStore {
  if (kv === undefined) {
    throw new Error('Trigger runtime KV is required to construct the default event store.');
  }
  return kv;
}

async function acceptWebhook(
  c: Context,
  ingress: TriggerIngressPort,
  definitions: readonly ProcessableTriggerDefinition[],
): Promise<Response> {
  const target = resolveWebhookTarget(c.req.path);
  // Resolve the external path parameter against the loaded definitions and pass
  // the definition's already-branded `.id` to ingress — same brand-free pattern
  // as listEvents/getEvent (string equality against the branded id, which is a
  // string subtype). This avoids a brand cast at the boundary. Resolve against
  // ALL definitions (not just webhook ones) so ingress retains its own kind
  // validation exactly as before.
  const definition = definitions.find((d) => d.id === target);
  if (definition === undefined) {
    // Behavior-equivalent to ingress's unknown-id 404: ingress's known set is a
    // subset of context.definitions, so any id ingress would accept is present
    // here, and any unknown id 404s either way.
    return c.json({
      accepted: false,
      status: 404,
      error: 'TRIGGER_NOT_FOUND',
      message: `Trigger ${target} not found.`,
    }, 404);
  }
  try {
    const response = await ingress.accept({
      triggerId: definition.id,
      request: c.req.raw,
    });
    return c.json({
      accepted: true,
      status: response.status,
      acceptedAt: response.acceptedAt,
      eventId: response.event?.id,
      triggerId: response.event?.triggerId,
    }, response.status);
  } catch (error) {
    const failure = webhookFailure(error);
    return c.json({
      accepted: false,
      status: failure.status,
      error: failure.code,
      message: failure.message,
    }, failure.status);
  }
}

function resolveWebhookTarget(path: string): string {
  const markerIndex = path.indexOf(WEBHOOK_PATH_PREFIX);
  if (markerIndex >= 0) {
    return decodeURIComponent(path.slice(markerIndex + WEBHOOK_PATH_PREFIX.length));
  }
  return path;
}

function webhookFailure(error: unknown): Readonly<{
  status: 400 | 401 | 404 | 500;
  code: string;
  message: string;
}> {
  if (error instanceof TriggersError) {
    if (error.code === 'TRIGGER_NOT_FOUND') {
      return { status: 404, code: error.code, message: error.message };
    }
    if (error.code === 'TRIGGER_VALIDATION_FAILED') {
      const verificationFailed = error.message.includes('Webhook verification failed');
      return {
        status: verificationFailed ? 401 : 400,
        code: error.code,
        message: error.message,
      };
    }
    return { status: 400, code: error.code, message: error.message };
  }
  return {
    status: 500,
    code: 'TRIGGER_WEBHOOK_FAILED',
    message: error instanceof Error ? error.message : 'Webhook request failed.',
  };
}

function isWebhookDefinition(
  definition: ProcessableTriggerDefinition,
): definition is WebhookDefinition<string, never, never> {
  return definition.kind === 'webhook';
}

export { TRIGGERS_API_DEFAULT_PORT, TRIGGERS_API_SERVICE_NAME };

if (import.meta.main) {
  await startTriggersService({
    port: Number(Deno.env.get('PORT') ?? TRIGGERS_API_DEFAULT_PORT),
  });
}
