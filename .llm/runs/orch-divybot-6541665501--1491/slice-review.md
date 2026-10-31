# Independent S1 review

Observed model: claude-opus-5-5; high effort; separate read-only Anthropic evaluator session. No mutations, delegation or external posting.

I found no S1 blockers.

I didn't edit, run, post or delegate anything. I took the gate results from the worklog as recorded and didn't re-run them. I compared the critical claims in the five new guides, the service reference addition and the two tooling changes against the shipped source:

- **Semantic identity:** the request hash covers command name, `definitionVersion`, scope, the selected input, actor kind and subject, and expected version. Correlation, trace and actor scheme are left out. Receipts are keyed on scope, command name and key hash. So the docs are right on four points:
  - Changing the name or scope starts a new namespace.
  - Changing `definitionVersion` produces `idempotency_key_reuse`, not a new namespace.
  - A replay returns the original correlation.
  - The key is stored only as a digest.
- **Atomicity:** inside one transaction callback the executor claims the receipt, runs the handler, encodes and decodes the response, appends audit, appends outbox, then completes the receipt. A failure in any step rolls all of it back. Required/forbidden record policies, the 64/64/64 KiB record limits, and the JSON limits of depth 64, 10,000 items and 1 MiB all match `command-record-buffer.ts`, `create-command-executor.ts` and `canonical-json.ts`. The counter example's assertions for conflict, mismatch and rollback follow these code paths.
- **Relay behavior:**
  - The relay publishes before it settles.
  - Settlement is fenced by both the claim token and the lease expiry (`claim_token`/`claim_until`).
  - If settlement fails, the error surfaces and the row stays leased.
  - A `CommandRelayError` keeps its own class without going through the classifier, and bad classifier or backoff output becomes `misconfigured`.
  - A row retries while its attempt count is below `maxAttempts`, then goes terminal.
  - `drainOnce` counts only rows it actually settled. Overlapping drains run one after another, and `stop` waits for all of them.
  - The policy limits match `POLICY_CEILINGS`.
  - The checked worker sink verifies target, `runId` and `acceptedAt`, and uses `dedupeKey` as the worker's idempotency key.
- **PostgreSQL exports:** every symbol the guides import from `@netscript/database/commands/postgres` is exported, including the retention constants (7 days, page size 100) and `CommandOutboxRetentionStore`. The receipt wait range of 1 to 60,000 ms matches the store's declared capabilities. The prune SQL matches the guide: settled rows strictly older than the cutoff with both lease fields empty, paged by ID.
- **Honest reconciliation:** the inspection port is labelled as owned by the application, not a NetScript export. An empty result is treated as unproven. Worker acceptance is kept separate from the receiver's effect. Rolling back before reporting `in_progress` matches the busy-claim path.
- **Safety and compatibility:**
  - The webhook identities (`Webhook-Id` and `Idempotency-Key` both equal the outbox ID, and `dedupeKey` is a separate identity) are consistent with the existing outbound-webhooks recipe.
  - The memory store's "sqlite" provider name is documented as a simulation, not certification.
  - `assertCommandDeterminism` accepts 2 to 32 samples, and the fault boundary `after_commit_before_return` exists.
- **Tooling:** the example test only allows `@`-scoped or `zod` imports and rejects `/src/` paths. It runs the fence through a temporary config built from published entrypoints only, and checks that `deno.lock` is unchanged afterwards. Switching the census fixture to `TIER_1_PAGES` keeps all three floor and budget negative controls; the fixture has to cover every Tier-1 page anyway. The floors stay at 35/21/14 as the plan requires.
- **Privacy:** the changed run files and guides contain no absolute paths, hostnames, IP addresses or session identifiers.

As agreed, I treated the generated carriers, the full docs-accuracy and freshness checks, and the pre-existing fake-Git interruption failure as outside S1.

SLICE REVIEW: PASS
