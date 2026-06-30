/**
 * Triggers service router context and handler-facing types.
 *
 * The triggers connector is a thin Archetype-5 presentation seam: it composes
 * the already-sound `@netscript/plugin-triggers-core` v1 contract over the
 * runtime ports (event store, ingress) and the project trigger registry. No
 * net-new runtime capability lives here; unbacked routes defer through the
 * shared `INTERNAL` error vocabulary (see `v1.ts`).
 *
 * @module
 */

import type {
  ProcessableTriggerDefinition,
  TriggerEnabledStatePort,
  TriggerEventStorePort,
  TriggerEventSubscriptionPort,
  TriggerIngressPort,
} from '@netscript/plugin-triggers-core/ports';
import type {
  ManualDispatcher,
  WebhookTestDelivery,
} from '@netscript/plugin-triggers-core/runtime';

/**
 * Service context available to every v1 trigger route handler.
 *
 * Supplied once at startup via `createPluginService`'s `context` factory and
 * captured by the closure; the triggers connector has no per-request context
 * merge (unlike auth's request-capture middleware) because every backed route
 * reads only process-static runtime ports and the loaded definition set.
 */
export type TriggerServiceContext = Readonly<{
  /** Trigger definitions loaded from the generated project registry. */
  definitions: readonly ProcessableTriggerDefinition[];
  /** Persistent trigger event store (read paths for list/get events). */
  eventStore: TriggerEventStorePort;
  /** Persistent enabled-state override store for enable/disable routes. */
  enabledState: TriggerEnabledStatePort;
  /** Fast ack-then-process ingress boundary (raw webhook route). */
  ingress: TriggerIngressPort;
  /** Explicit manual-fire dispatcher for `fireTrigger`. */
  manualDispatcher: ManualDispatcher;
  /** Signed synthetic webhook delivery helper for `testWebhook`. */
  webhookTestDelivery: WebhookTestDelivery;
  /** In-process live event subscription stream for `subscribeEvents`. */
  eventSubscription: TriggerEventSubscriptionPort;
}>;
