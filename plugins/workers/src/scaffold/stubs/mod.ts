/**
 * Sample workers barrel emitted into a user workspace at `workers/mod.ts`.
 *
 * Re-exports the user-owned sample job and task that `plugin add workers` writes alongside it. The
 * paths are static siblings (`./jobs/health-check.ts`, `./tasks/validate-payload.ts`) so the barrel
 * ships as a real, type-checked stub and is emitted with no scaffold-time interpolation. The user
 * extends this barrel as they add their own jobs and tasks.
 *
 * @module
 */

export { healthCheckJob } from './jobs/health-check.ts';
export { validatePayloadTask } from './tasks/validate-payload.ts';
