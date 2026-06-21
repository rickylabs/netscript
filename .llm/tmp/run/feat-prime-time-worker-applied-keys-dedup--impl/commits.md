# Commits: worker-applied-keys-dedup

Append every commit created during the run immediately after creating it.

Format:

```md
- <commit-sha>: <commit message>
```

## Log

- 7f1d011: feat(workers): add worker idempotency contract
- 1a959dd: test(workers): cover worker idempotency key resolution
- d68ae7c: feat(workers): add kv worker idempotency store
- dc37d5b: feat(workers): gate worker effects by idempotency claims
- 951c27b: feat(triggers): propagate worker idempotency keys
- 206e31a: docs(workers): document worker idempotency guarantees
