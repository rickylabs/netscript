# Drift

- RTK unavailable: direct bounded commands and structured wrappers.
- Owner evaluator override: requested native Claude Opus 5.5 high in separate read-only sessions.
- KV explicitly lacks atomic worker outboxes. Preserve refusal and separately prove supported receipt/restart behavior; full KV atomic-worker delivery remains unsupported. No new outbox implementation authorized.
- Provider CI integration extends `.llm/tools/command-postgres-conformance.sh` by one structured-test invocation. This was in the reviewed plan but omitted from the initial supervisor path list; the scope list is reconciled here. No gate is replaced or weakened.
- Restart evidence reconstructs native producer/runner lifecycles over persisted state in one test process and resets the module singleton to model a fresh process. It is explicitly not an OS-kill proof.
- Full canary.8 fixture cannot typecheck against APIs introduced after the tag. Record its exact failures and execute the unchanged focused producer probe with no-check instead; this proves the stream symptom, not a full historical saga-runtime result.
