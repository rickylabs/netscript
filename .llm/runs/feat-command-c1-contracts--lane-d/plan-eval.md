# PLAN-EVAL — feat-command-c1-contracts--lane-d

- Plan evaluator session: independent PLAN-EVAL session, 2026-10-07 (headless evaluator; separate session and vendor family from the generator)
- Run: feat-command-c1-contracts--lane-d
- Surface / archetype: whole-chain plan for #1482 -> #1483 -> #1484 -> #1485 -> #1486 -> #1932 (C1 contracts A1/A4; C2 service A4 + database A2 + A3 discipline; C3 database A2; C4 telemetry A2; C5 database A2 + service A4/A3 + runtime cores A3 + thin plugins A5; #1932 sagas/workers A3 + Prisma A2)
- Scope overlays: SCOPE-service applied to runtime integrations (plan §Archetypes and layering)
- Workload tier: complex, owner-authorized (Eric, 2026-10-07, BRIEF-D.md; recorded in supervisor.md)
- Exact git HEAD reviewed: `359d17f426592d58a6f6388a9522bc3afbc45dde` (branch `feat/command-c1-contracts`; parent `6f6cbdf030d7595d1730272d0a74aedd66225069` = recorded main baseline)
- Route: requested OpenCode Go / glm-5.3-flash / max; observed model id `opencode-go/glm-5.3-flash` (Z.ai GLM family — different vendor family from the OpenAI/Codex generator). Variant flag is not independently attested from inside the session; the observed model id is what is known. No fallback used.

## Evaluation scope

This is a whole-chain PLAN-EVAL of all six leaves in sequence (#1482 C1 contracts -> #1483 C2 executor -> #1484 C3 true-TTx store + PostgreSQL -> #1485 C4 telemetry -> #1486 C5 relay/sinks -> #1932 atomic saga producer), not C1 alone. Verdict controls all six leaves per phase-registry.md. LIVE issue states were re-verified during this evaluation: #1482–#1486 and #1932 are all OPEN at milestone 0.0.8; prerequisites #1350 and #1455 are CLOSED. No product code has been committed (worklog.md phase table and git history confirm; hard stop honored).

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | research.md re-baselines against fresh main `6f6cbdf030d…` and reads all six open issues + closed prerequisites #1350/#1455 (states re-verified live during this evaluation: all OPEN at 0.0.8; both prerequisites CLOSED). Load-bearing findings spot-checked against source — see table below; all verified. |
| Decisions locked                        | PASS   | plan.md §"Architecture decisions LOCKED" 1–15 with rationale; each brief-named decision addressed (see Decision inspections below). Design checkpoint present in worklog.md `## Design` (public surface, vocabulary, ports, lifecycle, slices, deferred scope, contributor path). |
| Open-decision sweep                     | PASS   | plan.md §"Open-decision sweep": ten must-resolve-now items each mapped to a locked decision (1–15); safe-to-defer list explicit. Evaluator re-ran the sweep (below) — no additional rework-forcing open decision found. |
| Commit slices (< 30, gate + files each) | PASS   | plan.md §"Ordered commit slices" S1–S20, ordered, grouped six leaves (S1–S3/#1482, S4–S6/#1483, S7–S9/#1484, S10/#1485, S11–S14/#1486, S15–S20/#1932); every slice names what it proves, its proving gate, and its files/roots; all well under 30 files each; planned-file disclaimer explicit. Matches phase-registry.md. |
| Risk register                           | PASS   | plan.md §"Risk register": 11 risks each with mitigation/owning slices (error/meta widening, JCS corruption/overflow, fake atomicity, provider poisoning, privacy leak, lost receipt, duplicate relay, task schema gap, duplicate remote work, provider unavailability, stack drift). |
| Gate set selected                       | PASS   | plan.md §"Required gates and exact evidence policy": structured check/test/lint/fmt wrappers, full-map doc:lint, quality:scan + arch:check, JSR package audit script, publish:dry-run + deps:prod-install, mutation-verification policy for every new test, real-provider PostgreSQL conformance (no fakes certified; versions/digest/argv/exact head/exit recorded, infra redacted), run-gate receipts for durable evidence, CLI scaffold.runtime E2E before final ready-marks. Matches gates/archetype-gate-matrix.md for archetypes 1/2/3/4/5 (F-5/F-6/F-7/F-10/F-13 subtype/F-19 + consumer-import and runtime gates via named evidence rows). |
| Deferred scope explicit                 | PASS   | plan.md §"Debt and deferred scope" (no new doctrine debt authorized; explicit exclusions: other SQL adapters, SQLite mode, remote/distributed TX, SQL+KV, queue reconciliation, second saga relay, product operation vocabulary, merge/publication) plus safe-to-defer list (later SQL adapters, stage-8 CLI generators, global telemetry deprecation, retention defaults, EIS projection, exact dependency versions). worklog.md `## Design` deferred-scope paragraph agrees. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | research.md §"Planned JSR surface scan" applies the jsr-audit publishability rubric to the PLANNED surface: entrypoint inclusion in publish lists, explicit annotations for opaque generics/literal maps, direct dependency declarations (e.g. service declares StandardSchemaV1 / release-matched database edge), testing-subpath include policy, @module/example docs + full-map doc lint + isolated declarations + materialized publish dry-run, no new erasure/casts; risks assigned to owning slices (S1/S2 declarations; S5/S8 publish-list/transaction-client; S10 vocabulary; S11–S14 receipt/lifecycle; S15–S20 schema continuity + consumer proof). |

## Load-bearing spot-checks (verified against source at HEAD above)

| Research/plan claim | Verified at |
| --- | --- |
| RFC 0003 placement table: commands→service, transport errors→contracts, raw transaction/relay rows→database, bounded attributes→telemetry; new direct `service → database` edge currently absent | rfcs/0003-command-composition-kit.md (§Package and export placement, §); packages/service/deno.json imports/exports (no `@netscript/database`, no commands subpaths) |
| Current `BaseContractMeta`/`BaseContractErrors`/`CommonErrorMap` exact form; base builder initializes metadata and preserves the metadata generic (unlike the RFC's older empty-fourth-generic example) | packages/contracts/src/application/contract-primitives.ts:35-66,113-123,155-160 |
| Saga engine persists save → saveCorrelation → appendTransition separately; `SagaStorePort` has no atomic transition capability; KV `save()` CAS-guards its state write alone; Prisma `save()` opens a private `$transaction` while correlation/transition writes stand outside it | packages/plugin-sagas-core/src/runtime/saga-engine.ts:422-439; ports/saga-store-port.ts:23-48; stores/kv-saga-store.ts:65-111; stores/prisma-saga-store.ts:152-238 |
| `JobDefinition` carries optional `payloadSchema`; `TaskDefinition` has payload generic + handler but no payloadSchema (task schema gap) | packages/plugin-workers-core/src/domain/job-definition.ts:154-165; src/domain/task.ts:225-237 |
| `SagaHandler` returns `readonly CascadedMessage[]`; `send` is a saga-message cascade; saga↔workers helpers are imperative with an independently inferred payload generic | packages/plugin-sagas-core/src/domain/saga-context.ts:19-23; src/domain/cascaded-message.ts; src/integration/workers/types.ts:55-65 |
| RFC relay sink returns `Promise<void>` and `markPublished` takes no acceptance receipt (motivating the additive C5 checked-receipt extension) | rfcs/0003-command-composition-kit.md §Relay/decoded types |
| Queue runtime DDL is real baseline drift and is not treated as precedent | packages/queue/adapters/postgres.adapter.ts:348, postgres-dead-letter-store.ts:172; RFC §Decision: do not wrap queue |
| `WorkerIdempotencyPort` "exactly-once-effective" doc wording must be corrected | packages/plugin-workers-core/src/ports/worker-idempotency-port.ts:30 |
| `@standard-schema/spec` used across other workspace packages but not declared by service (planned direct declaration is a real gap to close) | packages/service/deno.json vs packages/{plugin,mcp,sdk,telemetry,ai}/deno.json |
| Toolchain: Deno 2.9.7 live | `deno --version` during this evaluation |
| Doctrine verdicts quoted in research.md match the live verdict table (contracts Keep, service Refactor, database Refactor, telemetry Keep, sagas Keep, workers Refactor) | docs/architecture/doctrine/10-codebase-verdict-and-handoff.md |

## Decision inspections (brief-mandated)

- **Current BaseContractMeta** — Decision 2 preserves the live four-generic base-builder form (metadata generic `BaseContractMeta`, exact `BaseContractErrors`, six base codes) instead of the RFC's older empty-record example; no widening of metadata or errors; three command codes are opt-in. Correct against the tree.
- **Task schema gap** — Decision 13 extends workers-core task definition/builder with a schema-bound payload overload matching the job approach, requires the selected definition's existing schema, rejects missing-schema definitions, uses definition-first inference with `NoInfer`, and adds no saga-owned payload brand/map (honoring #1455/#1932 boundaries). Closes the verified gap.
- **Checked receipt persistence in C5** — Decision 11 is additive at C5 (motivated by research finding 6 and the #1932 "post-#1486-only settlement would add a publish→settle crash window" argument): worker sinks must return a checked receipt (validated target kind/id, nonempty acceptance/run identity, acceptedAt); the generic settlement request persists normalized identity/time with `publishedAt` in the same token-checked write; invalid/mismatched/absent/unchecked receipts throw and leave the row unpublished/retryable; no post-settlement repair. Satisfies #1932 contract item 7 and acceptance boxes 8–9.
- **True TTx** — Decision 6 (C2 owns `CommandStorePort<TTx>`/`CommandTransaction<TTx>` bound to the callback-derived handle; one callback; no-root control) and Decision 7 (C3 consumes the provider's true transaction callback, excludes root lifecycle/nested transaction methods, reviewed schema/bridge fixtures, explicit manual consumer binding, no runtime DDL) satisfy #1484 box 1–2 and the RFC's refusal of the current `withTransaction()` root-client assertion.
- **KV refusal** — Decision 14: KV explicitly refuses durable worker-command composition with a missing atomic transition/outbox diagnostic, no weak SQL+KV mode, no second KV relay. Matches #1932 box 5's implement-or-refuse-with-diagnostic allowance; existing non-command saga paths remain valid.
- **Exact provider conformance plan** — Decisions 8 + S8/S9 mirror the RFC's normative PostgreSQL mechanics: `ON CONFLICT DO NOTHING RETURNING` + indexed winner select, save/restore transaction-local `lock_timeout`, 55P03→busy with whole-callback rollback, 40001/deadlock retryable, one callback invocation, no query after busy, clean-next-transaction proof, all against a real provider with versions/digest/argv/head/exit recorded and infrastructure redacted; root-write negative control to defeat fake certification.

## Acceptance matrix completeness

acceptance.md maps every acceptance box: #1482 5/5, #1483 5/5, #1484 5/5, #1485 5/5, #1486 5/5, #1932 13 acceptance + 6 required-fault boxes = 19/19, each row tied to named planned evidence and each issue's IMPL-EVAL box to a per-leaf separate-family evaluation at the exact product head. Counted box text matches the live issue bodies read during this evaluation. All boxes remain Pending, which is correct pre-implementation.

## Open-decision sweep (evaluator-run)

No additional decision that would force downstream rework if deferred was found. Verified as deliberately safe-to-defer (already classified): stage-8 CLI generators (C3 ships reviewed fixtures + manual binding over the same port; no port change required when generators land), global telemetry deprecation (command-side privacy vocabulary is locked now; the asymmetry is documented, per RFC FCP-Q3 recommendation), later SQL adapters/SQLite/retention defaults (additive, no current-surface impact), exact dependency versions (resolved by native wrappers without unrequested upgrades). One-relay ownership, cancellation, canonical defaults, identity hashing, replay-boundary versioning, and namespace-migration obligations are all locked in decisions 3/5/9/10/14/15 with owning slices.

## Verdict

`PASS`

### If FAIL_PLAN — required fixes

None.

## Notes

- Every Plan-Gate box is checked; per plan-gate.md a PASS releases the hard stop for implementation. Per BRIEF-D.md/HARNESS.md, this single chain PASS controls all six leaves; each leaf still requires its own independent IMPL-EVAL (separate session, different vendor family) at its exact product head with all acceptance evidence before ready-for-review handoff, and merges remain forbidden.
- Process compliance observed: no implementation slice has been committed; run artifacts carry lane/tier authority (owner authorization recorded in supervisor.md); public artifacts contain only repository-relative paths, no operational infrastructure, credentials, or allowance state.
- Evaluation was plan-artifact inspection only; no tests or product gates were run (none were requested at PLAN-EVAL; planned evidence was inspected instead). Raw git/gh reads over RTK were used only where semantic precision mattered (live issue bodies, HEAD), consistent with the netscript-tools verdict rules.
