# Memory

- KV getMany is optional on KvStore; WatchStream.ready is optional too. Never require either for a third-party bridge regression.
- First-party initial batches already carry the acknowledged snapshot; read them directly without a second bridge getMany. Fallback applies only to a first batch with no initial event.
- The prior excluded publication handoff is bound to original #2382; continuing leaves use issue-specific GitHub READY comments and must not overwrite it.

- MemoryKvAdapter has no getMany. To prove bridge batch use, explicitly attach a counted batch method backed by Memory.get; test optional getMany absence separately.
- KvKey includes symbol but kvdex strict keys do not. Regression fixture string keys should use inferred string[][] (or DenoKvStrictKey[]) instead of widened KvKey[].
- Exact-equal change stamps after fallback avoid a redundant affected-key read; stale/null stamps retain existing storage reconciliation.
- Structured KV regression recipe: deno task test --unstable-kv --frozen packages/kv/tests/bridge-watch-initial_test.ts packages/kv/tests/bridge_test.ts packages/kv/tests/watch-initial_test.ts packages/kv/tests/watch-review_test.ts.
