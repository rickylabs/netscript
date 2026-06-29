/** Type-checked source stub for the generated streams barrel.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Type-checked streams barrel stub with named substitution tokens. */
export const barrelStub: StubSource<'PRODUCER_EXPORT' | 'SCHEMA_EXPORT' | 'STREAM_FILE'> =
  defineStub({
    source: `/**
 * Sample streams barrel emitted into a user workspace at \`streams/mod.ts\`.
 *
 * Re-exports the user-owned sample durable stream that \`plugin add streams\` writes alongside it. The
 * path is a static sibling (\`./notifications-stream.ts\`) so the barrel ships as a real, type-checked
 * stub and is emitted with no scaffold-time interpolation. The user extends this barrel as they add
 * their own streams.
 *
 * @module
 */

export { %%PRODUCER_EXPORT%%, %%SCHEMA_EXPORT%% } from './%%STREAM_FILE%%.ts';
`,
    tokens: ['PRODUCER_EXPORT', 'SCHEMA_EXPORT', 'STREAM_FILE'] as const,
  });
