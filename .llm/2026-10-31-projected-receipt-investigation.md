# Projected receipt investigation lesson — 2026-10-31

A durable producer's delivered outcome is insufficient evidence that a new receipt exists. Prime the old session's sequence, reconstruct the producer with a persisted monotonic epoch, read actual stream contents/offset and assert one worker invocation. Automatic worker retry can repair the later append and hide the first failure unless invocation counts are checked.

Keep saga business phase separate from canonical lifecycle. Assert both the storage projection and the public HTTP query; raw canonical state alone misses a broken query model. Run native adapters, not permissive memory stores: native KV deliberately lacks atomic worker-command outboxes, while the native Prisma transition adapter supports them.

A historical full fixture can be unavailable because a tag lacks APIs. Preserve that typecheck evidence, execute a smaller unchanged runtime probe and state its narrower conclusion. A worker-listener fix does not establish the cause of an unexplained saga process exit.

Run evidence: `.llm/runs/orch-divybot-6543850655--2390/`. Coordinator retains full scaffold.runtime and merge authority.
