/**
 * Sample triggers barrel emitted into a user workspace at `triggers/mod.ts`.
 *
 * Re-exports the user-owned sample triggers that `plugin add triggers` writes alongside it. The
 * paths are static siblings (`./generic-inbound-webhook.ts`, `./daily-maintenance.ts`,
 * `./incoming-file-watch.ts`) so the barrel ships as a real, type-checked stub and is emitted with
 * no scaffold-time interpolation. The user extends this barrel as they add their own triggers.
 *
 * @module
 */

export { genericInboundWebhookTrigger } from './generic-inbound-webhook.ts';
export { dailyMaintenanceTrigger } from './daily-maintenance.ts';
export { incomingFileWatchTrigger } from './incoming-file-watch.ts';
