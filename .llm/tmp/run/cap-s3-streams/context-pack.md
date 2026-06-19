# Context Pack — cap-s3-streams

Run id: `cap-s3-streams`
Branch: `fix/cap-caveat-s3-streams`
Surface: `plugins/streams` Archetype 5 plugin package.

S3 replaces silent manifest-layer stream publish/subscribe no-ops with explicit
`StreamUnsupportedOperationError` failures. Real durable topic transport is deferred and recorded as
architecture debt because `@netscript/plugin-streams-core` currently exposes only State Protocol
upsert/delete producer primitives, not a generic topic subscriber channel.
