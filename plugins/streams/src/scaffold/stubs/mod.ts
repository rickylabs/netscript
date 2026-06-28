/**
 * Sample streams barrel emitted into a user workspace at `streams/mod.ts`.
 *
 * Re-exports the user-owned sample durable stream that `plugin add streams` writes alongside it. The
 * path is a static sibling (`./notifications-stream.ts`) so the barrel ships as a real, type-checked
 * stub and is emitted with no scaffold-time interpolation. The user extends this barrel as they add
 * their own streams.
 *
 * @module
 */

export { notificationsStream, notificationsStreamSchema } from './notifications-stream.ts';
