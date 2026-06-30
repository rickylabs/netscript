## S-conform-streams

Scope:
- Streams proxy connector conformance.
- Deleted `StreamsPluginManifest` and local contribution mirror types.
- Collapsed `streamsPlugin` to the `PluginManifest` returned by `definePlugin().build()`.
- Kept standalone `defineStreamTopic`, `defineStreamProducer`, and `defineStreamConsumer` exports.
- Repointed the live workers consumer to standalone `defineStreamTopic`.
- Set `capabilities.hasRoutes` to `false` in `scaffold.plugin.json` and README.

Commit:
- `265e08ec` — `feat(streams): conform proxy manifest surface`

Gate evidence:
- Authority grep: `rg "StreamsPluginManifest" plugins packages -n` returned 0 hits.
- Scoped check: PASS, 116 files, 0 diagnostics.
- Scoped lint: PASS, 116 files, 0 diagnostics.
- Scoped fmt: PASS, 116 files, 0 findings.
- Streams tests: PASS, 12 passed, 0 failed.
- Workers tests: PASS, 16 passed, 0 failed.
- Streams `publish:dry-run`: PASS, no slow-type warnings.
- Workers `publish:dry-run`: PASS; existing dynamic-import warnings remain.
- `deno task arch:check`: PASS exit 0, `FAIL=0`; existing WARN/INFO baseline remains.
