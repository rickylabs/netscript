# PLAN-EVAL round 1

Requested and observed route: claude-opus-5-5, high effort, separate Anthropic session, stdin closed, read-only.

**PLAN-EVAL for #1491 (feature tier, SCOPE-docs): FAIL_PLAN, round 1 of 2.**

Context: I worked read-only. No files were edited, no `plan-eval.md` was written, nothing was mutated and nothing was posted. Research is present and re-baselined to `4e018ad`. I spot-checked it against the tree: the `@netscript/service/commands`, `/commands/relay` and `/commands/testing` subpaths are confirmed, as is the compile-only Tier-1 list in `.llm/tools/docs/snippet-policy.ts`. The five documentation categories (guide, reference, operations, security, compatibility) are covered by the five planned pages plus the reference extension. The outbound/inbound separation is adequate: there are links both ways to `outbound-webhooks.md`, and inbound trigger behavior is explicitly deferred.

### Blocker 1: the export list leaves out shipped durable providers and retention (Plan-Gate boxes "Research present", "Decisions locked" and "Open-decision sweep")

`research.md` and `plan.md` never mention `@netscript/database/commands/postgres`. That subpath ships:
- `createPostgresCommandStore`
- `createPostgresCommandOutboxRelayStore`, which also implements `CommandOutboxRetentionStore.pruneSettled`
- `bindPostgresCommandOutbox`
- `COMMAND_RETENTION_DEFAULT_DAYS` and `COMMAND_RETENTION_MAX_PAGE_SIZE`

`@netscript/database/commands` also exports `CommandStoreError` and `createCommandStoreCapabilities`. `/commands/testing` also exports the conformance and fault kit (`runCommandConformance`, `createCommandFaultController`, `assertCommandDeterminism`). `docs/site/reference/database/index.md` already documents the Postgres stores and "Bounded outbox retention".

Even so, the plan says relay composition uses "an explicitly supplied durable store". It also lists "production provider composition" and "retry retention sizing" as safe to defer because they are consumer policy. Those deferrals would force rework of the operations and compatibility pages. Either the pages leave out shipped exports, or they present a store the framework ships as something the application supplies. Both break acceptance box 1 ("match exports"). It is the reverse of the owner rule: application ports must not be shown as framework exports, and framework exports must not be shown as application ports.

**Fix:** add these exports to the research list. For each one, the plan should name the page that covers it: provider choice, lease and retention operations, the error vocabulary, and conformance for custom providers. Link the operations page to the database reference. Keep only the genuinely application-owned ports declared as consumer-supplied: the checked sink, reconciliation inspection, and any non-Postgres store.

### Blocker 2: no proof mapping for the eight example concerns, and no mechanism for the execution gate (boxes "Gate set selected" and "Commit slices")

- **Missing concerns.** The plan's runnable memory example covers transaction, expected version (CAS), idempotency (receipt replay), audit, outbox and failure rollback. Relay gets only a composition example, with no stated proof level. Reconciliation is described in research, but the plan commits no fence for it. Acceptance box 2 requires all eight.
- **No execution tool.** The plan says to "execute the self-contained command fence through a clean public consumer config". But the repository gate, the existing Tier-1 public-export-map consumer compiler, only type-checks: `.llm/tools/docs/snippet-compiler.ts` runs `deno check` "without executing snippets". The plan names no tool or command for execution. It lists no file for it in S1, though `.llm/tools/docs/**` is an allowed write path. It also gives no evidence location. Without that, the run could be done against workspace-relative imports, which would not prove anything about a public consumer.

**Fix:** add a table to the plan mapping each of the eight concerns to a page, a fence, and a proof class: Tier-1 compiled only, or compiled and executed. Commit a reconciliation fence that uses a declared, consumer-owned inspection port and the same-key replay. Then define the execution mechanism in one of two ways:
- a tracked test under `.llm/tools/docs/` that extracts the fence and runs it with the same synthetic public consumer config the Tier-1 compiler uses; or
- supplementary run evidence, with the exact command and its output recorded in the run directory.

Add the chosen file to the S1 file list and name the gate that proves it.

**FAIL_PLAN**


# PLAN-EVAL round 2

**PLAN-EVAL for #1491, round 2 of 2: PASS.** Both round-1 blockers are cleared, and no new ones turned up. As instructed, I read only the four amended run files and did not check the tree again.

- **Blocker 1 (export list): cleared.**
  - `research.md` now lists the shipped PostgreSQL store, relay store, retention, `bindPostgresCommandOutbox`, `CommandStoreError` / `createCommandStoreCapabilities` and the conformance and fault kit. It treats them as framework-owned.
  - What the consumer must supply is now limited to the generated `TransactionClientPort` callback bridge, the migration and the reconciliation inspection port. These are labelled as application ports, not framework exports.
  - The plan's locked table assigns each export to a page.
  - "Production provider composition" is no longer deferred. Only deployment-specific retention sizing and business-mapping policy remain deferred, and both are genuinely consumer policy.
- **Blocker 2 (proof for the example concerns): cleared.**
  - A table now maps all eight concerns to a page, a fence and a proof class.
  - Transaction, expected version, idempotency, audit, outbox and failure are compiled and executed.
  - Relay and reconciliation are compiled only (Tier-1). The plan says so honestly, because running them needs a real database and worker, or uses an inspection port the application owns.
  - Execution is defined by a named file, `.llm/tools/docs/command-guide-example_test.ts`. It builds a published-only consumer config, rejects private and relative imports, and its exact gate command is given. The result is recorded in `worklog.md`.
  - S1 owns that file and the change to the census fixture.
- **Rest of the plan gate:** the commit slices are still well under 30 files. The risks, gate set, deferred scope and the jsr-audit N/A are unchanged and still adequate.

Implementation of S1 may begin.

**PASS**
