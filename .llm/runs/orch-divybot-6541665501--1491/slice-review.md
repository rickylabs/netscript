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


# Independent S2 carrier review

I found no S2 blockers. I decoded the carrier at HEAD and in the working tree with read-only Python (gzip and base64) and compared the two. I edited and posted nothing and re-ran no gates. Decode scratch went to a temporary directory, which I deleted.

**CLI prose carrier** (`agent-docs-prose.generated.ts`)
- **Entries:** 203 before, 208 after. Exactly five pages were added: `commands`, `command-relay`, `command-operations`, `command-security` and `command-compatibility`. None were removed.
- **Changed entries:** exactly four.
  - `llms.txt` gains five router links.
  - `services-sdk/index.md` gains three navigation bullets.
  - `reference/service/index.md` gains its two link paragraphs plus the envelope/record and relay-bounds tables. These match the S1 source.
  - `outbound-webhooks/index.md` gains one link paragraph.
- **Context preserved:** both context MDX entries are byte-identical to HEAD.
- **Integrity:** all 208 entries carry a hash and size, and every one matches the decoded content.
- **Rendering:**
  - No raw template syntax is left in the new pages.
  - The inbound-webhook cross-reference resolves to the storefront shipping-webhook tutorial in both relay and security.
  - Each page has the same number of code fences as its source: 2, 1, 3, 1 and 1.

**MCP carrier** (`publish-assets.generated.ts`)
- The curated set is still the same 14 documents; only `llms.txt` changed, gaining the same five links.
- The documents total 248,604 bytes, under the 294,912 budget. That is consistent with the note in `memory-carrier-delta.md` not to widen the selection to mirror the CLI corpus.

**Evidence**
- `gate-evidence.json` records PASS for accuracy, export drift, MCP export corpus, publish assets and prose.
- `assets-barrel` shows FAIL at the S1 head with S2 files uncommitted. The note in the file states this honestly as a precommit artifact, so it isn't recorded as a pass. The authoritative assets-barrel run after the commit is still owed before READY.
- The worklog, context-pack, memory note and evidence file contain no private paths, hosts or session identifiers.

This approves the carrier delta and evidence for the S2 commit only. It is not final merge readiness for the exact pushed head.

SLICE REVIEW: PASS
