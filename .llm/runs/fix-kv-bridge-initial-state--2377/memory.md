# Memory

- KV getMany is optional on KvStore; WatchStream.ready is optional too. Never require either for a third-party bridge regression.
- First-party initial batches already carry the acknowledged snapshot; read them directly without a second bridge getMany. Fallback applies only to a first batch with no initial event.
- The prior excluded publication handoff is bound to original #2382; continuing leaves use issue-specific GitHub READY comments and must not overwrite it.
