/**
 * Triggers v1 contract handler map.
 *
 * Assembles all 11 routes of the triggers v1 contract, contract-bound and
 * precisely typed per route. Six routes are backed by real runtime state
 * (`describe`, `listTriggers`, `getTrigger`, `listEvents`, `getEvent`); the
 * remaining six mutating/streaming routes (`fireTrigger`, `testWebhook`,
 * `previewSchedule`, `enableTrigger`, `disableTrigger`, `subscribeEvents`) have
 * no sound backing yet and defer by throwing with a clear "pending triggers-core
 * runtime backing" message. oRPC maps an uncaught throw to a generic `500`
 * server error, so callers receive a server-error response without the connector
 * inventing a NOT_IMPLEMENTED code or fabricating backing. (The triggers contract
 * erases its typed `errors` map through a sanctioned `as unknown` cast in
 * `@netscript/plugin-triggers-core`, so the typed `errors.INTERNAL(...)`
 * constructor is not available in handlers — only the centralized `notFound`
 * helper, which casts internally, is.) No fabricated backing, no net-new
 * triggers-core capability — see `.llm/harness/debt/arch-debt.md`.
 *
 * @module
 */

import {
  TRIGGER_CONTRACT_KINDS,
  type TriggerContractEventStatus,
  type TriggerContractKind,
  type TriggerDefinitionResponse,
  type TriggerEventResponse,
} from '@netscript/plugin-triggers-core/contracts/v1';
import type { PluginCapabilities } from '@netscript/plugin/contract-base';
import type { ProcessableTriggerDefinition } from '@netscript/plugin-triggers-core/ports';
import type {
  TriggerEvent,
  TriggerEventStatus,
  TriggerKind,
} from '@netscript/plugin-triggers-core/domain';
import { notFound } from '@netscript/contracts';
import { router, type TriggersHandlers } from './router-context.ts';

/** Message used by every route that defers to its pending triggers-core backing. */
const PENDING_BACKING_MESSAGE =
  'Not implemented — pending triggers-core runtime backing (see arch-debt).';

/**
 * Trigger definition response as the contract's Zod schema actually infers it.
 *
 * The exported `TriggerDefinitionResponse` type annotates `tags` as
 * `readonly string[]`, but the contract's output schema (`z.array(z.string())`)
 * infers a mutable `string[]`; oRPC checks the handler return against the
 * inferred schema type, so the handler-facing response uses mutable `tags`.
 * Overriding the field here (rather than casting) keeps the mapper sound while
 * matching what the contract validates at runtime.
 */
type TriggerDefinitionResponseValue =
  & Omit<TriggerDefinitionResponse, 'tags'>
  & Readonly<{ tags?: string[] }>;

/** Event response as the contract's Zod schema infers it (see above). */
type TriggerEventResponseValue = TriggerEventResponse;

/**
 * Capabilities document advertised by the running triggers service.
 *
 * Grounded in triggers ground truth: the published plugin package name, the
 * served contract versions, the v1 contract route groups, and the connector's
 * currently-backed capability tags.
 */
const triggersCapabilities: PluginCapabilities = {
  pluginName: '@netscript/plugin-triggers',
  contractVersions: ['v1'],
  routeGroups: ['triggers', 'events', 'webhooks'],
  capabilities: [
    'trigger-introspection',
    'event-introspection',
    'webhook-ingress',
  ],
};

/** Every v1 route key the triggers contract exposes (incl. the base `describe`). */
type TriggersV1RouteKey =
  | 'describe'
  | 'listTriggers'
  | 'getTrigger'
  | 'listEvents'
  | 'getEvent'
  | 'fireTrigger'
  | 'testWebhook'
  | 'previewSchedule'
  | 'enableTrigger'
  | 'disableTrigger'
  | 'subscribeEvents';

/** V1 trigger contract handlers, contract-bound and precisely typed per route. */
export const triggersV1: TriggersHandlers<TriggersV1RouteKey> = {
  /** Mandatory base seam `describe` route. */
  describe: router.describe.handler(() => triggersCapabilities),

  listTriggers: router.listTriggers.handler(({ input, context }) => {
    const matched = filterDefinitions(context.definitions, input);
    const responses = matched
      .map(toTriggerDefinitionResponse)
      .filter((response): response is TriggerDefinitionResponseValue => response !== undefined);
    const page = responses.slice(input.offset, input.offset + input.limit);
    return {
      triggers: page,
      total: responses.length,
      limit: input.limit,
      offset: input.offset,
    };
  }),

  getTrigger: router.getTrigger.handler(({ input, errors, path, context }) => {
    const definition = context.definitions.find((candidate) => candidate.id === input.id);
    if (definition === undefined) {
      notFound({ errors, path, resourceId: input.id });
    }
    const response = toTriggerDefinitionResponse(definition);
    if (response === undefined) {
      throw new Error(`Trigger ${input.id} has an unrepresentable kind.`);
    }
    return response;
  }),

  listEvents: router.listEvents.handler(async ({ input, context }) => {
    // The event store's `triggerId` filter is a branded `TriggerId`; the
    // connector has no sound brand constructor (the brand is private to
    // triggers-core), so it filters by string-equal comparison against the
    // already-branded `event.triggerId` instead of casting the plain query
    // string into a brand. `status` is the closed contract union, assignable
    // to the port option directly.
    const all = await context.eventStore.list({ status: toEventStatus(input.status) });
    const matched = input.triggerId === undefined
      ? all
      : all.filter((event) => event.triggerId === input.triggerId);
    const responses = matched
      .map(toTriggerEventResponse)
      .filter((response): response is TriggerEventResponseValue => response !== undefined);
    const page = responses.slice(input.offset, input.offset + input.limit);
    return {
      events: page,
      total: responses.length,
      limit: input.limit,
      offset: input.offset,
    };
  }),

  getEvent: router.getEvent.handler(async ({ input, errors, path, context }) => {
    // `eventStore.load` requires a branded `TriggerEventId`; with no sound brand
    // constructor available, the connector resolves the event by string-equal
    // `id` over the stored set rather than casting the plain path parameter.
    const all = await context.eventStore.list();
    const event = all.find((candidate) => candidate.id === input.id);
    if (event === undefined) {
      notFound({ errors, path, resourceId: input.id });
    }
    const response = toTriggerEventResponse(event);
    if (response === undefined) {
      throw new Error(`Trigger event ${input.id} has an unrepresentable kind.`);
    }
    return response;
  }),

  // --- Deferred routes: no sound backing yet (see arch-debt) ----------------

  fireTrigger: router.fireTrigger.handler(() => {
    throw new Error(PENDING_BACKING_MESSAGE);
  }),

  testWebhook: router.testWebhook.handler(() => {
    throw new Error(PENDING_BACKING_MESSAGE);
  }),

  previewSchedule: router.previewSchedule.handler(() => {
    throw new Error(PENDING_BACKING_MESSAGE);
  }),

  enableTrigger: router.enableTrigger.handler(() => {
    throw new Error(PENDING_BACKING_MESSAGE);
  }),

  disableTrigger: router.disableTrigger.handler(() => {
    throw new Error(PENDING_BACKING_MESSAGE);
  }),

  // The streaming route still satisfies the `eventIterator` return type by being
  // an async generator; it throws immediately because no event-subscription seam
  // exists yet. The generator never yields, so the SSE output schema is never
  // violated.
  subscribeEvents: router.subscribeEvents.handler(
    // deno-lint-ignore require-yield
    async function* (): AsyncGenerator<never, void, unknown> {
      throw new Error(PENDING_BACKING_MESSAGE);
    },
  ),
};

/** Filter loaded definitions by the contract's trigger list query. */
function filterDefinitions(
  definitions: readonly ProcessableTriggerDefinition[],
  input: Readonly<{ kind?: TriggerContractKind | null; tags?: string }>,
): readonly ProcessableTriggerDefinition[] {
  const requestedTags = input.tags
    ? input.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
    : [];
  return definitions.filter((definition) => {
    if (input.kind != null && definition.kind !== input.kind) {
      return false;
    }
    if (
      requestedTags.length > 0 &&
      !requestedTags.every((tag) => (definition.tags ?? []).includes(tag))
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Map a loaded trigger definition to the v1 contract response.
 *
 * `enabled` is synthesized as `true`: no persistent enabled-state store exists
 * yet, and every registered trigger is currently active. `name` and `entrypoint`
 * are omitted — the domain `TriggerDefinitionBase` carries neither field, and
 * both are optional in the contract response. Returns `undefined` when the
 * definition's open `TriggerKind` is not one of the closed contract kinds (so it
 * cannot be represented in the response); callers drop or 500 accordingly. See
 * arch-debt for the enabled-state follow-up.
 */
function toTriggerDefinitionResponse(
  definition: ProcessableTriggerDefinition,
): TriggerDefinitionResponseValue | undefined {
  const kind = toContractKind(definition.kind);
  if (kind === undefined) {
    return undefined;
  }
  return {
    id: definition.id,
    kind,
    name: definition.name,
    description: definition.description,
    enabled: true,
    durabilityTier: definition.durability,
    // The contract response declares `tags?: string[]` (mutable); the domain
    // definition carries `readonly string[]`. Spread into a fresh mutable array
    // to satisfy the contract output type without weakening the domain type.
    tags: definition.tags === undefined ? undefined : [...definition.tags],
  };
}

/**
 * Map a stored trigger event to the v1 contract response (drops internal payload).
 *
 * Returns `undefined` when the event's open `TriggerKind` is not a closed
 * contract kind, for the same reason as {@link toTriggerDefinitionResponse}.
 */
function toTriggerEventResponse(event: TriggerEvent): TriggerEventResponseValue | undefined {
  const kind = toContractKind(event.kind);
  if (kind === undefined) {
    return undefined;
  }
  return {
    id: event.id,
    triggerId: event.triggerId,
    kind,
    status: event.status,
    attempt: event.attempt,
    detectedAt: event.detectedAt,
    updatedAt: event.updatedAt,
    idempotencyKey: event.idempotencyKey,
    metadata: event.metadata,
  };
}

/**
 * Soundly narrow the domain's open `TriggerKind` to the closed contract kind.
 *
 * `TriggerKind = TriggerKnownKind | (string & ...)` is open, while the contract
 * response requires one of the six closed kinds. Membership-test narrowing (no
 * cast) returns the contract kind or `undefined` for an unrepresentable kind.
 */
function toContractKind(kind: TriggerKind): TriggerContractKind | undefined {
  return TRIGGER_CONTRACT_KINDS.find((candidate) => candidate === kind);
}

/** Narrow the contract's nullable status filter to the event store port option. */
function toEventStatus(
  status: TriggerContractEventStatus | null | undefined,
): TriggerEventStatus | undefined {
  return status == null ? undefined : status;
}
