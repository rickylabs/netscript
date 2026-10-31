# Plan & Design — READY FOR REVIEW

SCOPE-docs, describing existing archetype 4 command definitions and archetype 3 relay lifecycle. No framework contract or implementation changes; JSR package audit is N/A. Doctrine public-surface and explicit-crash-boundary rules guide claims.

Locked: publish services-sdk/commands.md, command-relay.md, command-operations.md, command-security.md and command-compatibility.md. Extend reference/service/index.md with links and precise envelope/policy tables. Add guide links to services-sdk/index.md and outbound-webhooks.md. Use only public service/database/worker exports. Consumer-provided provider bridges and inspectors are explicitly interfaces, not imaginary framework helpers. A complete runnable memory command example proves CAS, receipt replay, audit/outbox atomicity and failure rollback; relay composition uses an explicitly supplied durable store and checked sink.

Slices: (1) command/relay documentation, navigation, Tier-1 enrollment and semantic snippet validation; (2) canonical carrier regeneration, full docs gates and final evidence. Every slice updates worklog/context-pack, receives independent substantive review, commits, pushes and gets a PR comment.

Gates: site verify (build, rendered output, internal links, caveats); root docs:links, docs:snippets, docs:accuracy, docs:exports-drift; snippet policy tests if tooling changes; execute the self-contained command fence through a clean public consumer config; check:agent-docs-prose, check:publish-assets, check:assets-barrel and check:mcp-export-corpus. Scoped structured check/lint/fmt wrappers for touched tooling TypeScript. Independent PLAN-EVAL before implementation and IMPL-EVAL after; final evaluation at exact pushed head. No local scaffold.runtime per owner. Embedded prose only does not change runtime scaffold output.

Risks: unsupported export → report to coordinator, do not patch framework. Changed persisted command identity → compatibility guidance preserves old definitions/receipts. Duplicate downstream effect → document at-least-once and durable sink dedupe. False snippet coverage → add source pages to Tier-1; retain existing floor/exemption budget. Generated carrier drift → canonical tasks only. Public metadata privacy → keep raw evaluator streams and absolute operational paths outside Git.

Open decisions: none requiring owner input. Safe to defer: service-specific HTTP status mapping, application-specific generated business mapping, reconciliation query implementation and deployment-specific retention sizing, which depend on consumer policy. No new architecture debt accepted. Runtime, release, label and milestone changes are deferred to coordinator.


## Locked export-to-page mapping

| Exports | Page and treatment |
| --- | --- |
| defineCommand, createCommandExecutor, codecs, envelope/context/execution types | commands guide and service reference; executable atomic/replay/CAS example |
| createPostgresCommandStore, TransactionClientPort, PostgresCommandClient | commands guide production composition; consumer generated callback bridge and migrations are required |
| createPostgresCommandOutboxRelayStore, relay factory/options/sink/lifecycle/failure classes | relay guide composition with shipped PostgreSQL factory and checked worker sink, finite policy and drain/stop |
| pruneSettled, COMMAND_RETENTION_DEFAULT_DAYS, COMMAND_RETENTION_MAX_PAGE_SIZE | operations retention cursor fence and database reference link; sizing remains consumer policy |
| bindPostgresCommandOutbox | compatibility/reference link: existing transaction producers, no nested executor |
| CommandStoreError, createCommandStoreCapabilities | operations safe provider failure handling and compatibility/custom provider requirements |
| runCommandConformance, createCommandFaultController, assertCommandDeterminism | compatibility testing fence and reference links, explicitly simulation versus real driver qualification |

## Example acceptance and proof mapping

| Concern | Page/fence | Proof |
| --- | --- | --- |
| Transaction | commands.md atomic counter example | Tier-1 compile and execute extracted fence |
| Expected version | same fence, compareAndSet plus conflict assertions | Compile and execute |
| Idempotency | same fence, replay and changed-input rejection | Compile and execute |
| Audit | same fence, snapshot counts | Compile and execute |
| Outbox | same fence, committed intent and rollback counts | Compile and execute |
| Relay | command-relay.md shipped Postgres store + checked worker sink + drain/stop | Tier-1 compile only; requires actual consumer DB/worker to execute |
| Reconciliation | command-operations.md application inspection port + same-key replay fence | Tier-1 compile only; inspection is application-owned, not a nonexistent framework export |
| Failure behavior | commands.md rollback/mismatch/conflict assertions; operations failure table and typed mapping | Counter fence compiled and executed; operation adapter compiled |

S1 adds `.llm/tools/docs/command-guide-example_test.ts` to extract the first commands.md TS fence, reject private/relative imports, create a temporary independent deno.json using resolveWorkspaceSurface(..., {}, { publishedOnly: true }), copy the lock, and run Deno with that config and no runtime permissions. This consumer imports only published entrypoints and external dependencies; it has no scaffold support aliases. Exact gate: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-read --allow-write --allow-run --allow-env .llm/tools/docs/command-guide-example_test.ts`. Its result is recorded in worklog.md, alongside Tier-1 compilation. S1 also adjusts the existing census fixture to use the canonical Tier-1 page list so enrollment cannot break its negative controls. No framework test suite is changed.
