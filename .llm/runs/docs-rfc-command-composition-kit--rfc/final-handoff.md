# Final Handoff: production command composition kit RFC

## Delivery identity

| Field                                | Value                                                                        |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| Draft PR                             | [rickylabs/netscript#1389](https://github.com/rickylabs/netscript/pull/1389) |
| Branch                               | docs/rfc-command-composition-kit                                             |
| Pinned base                          | origin/main@fac9e339042c5394bf882311657d8981d353a1c3                         |
| Cycle-1 evaluator commit             | 122301d25f4055bfebffefeb3aec2b23c707cfca                                     |
| Cycle-2 RFC remediation content HEAD | c98c08adabbd992a557ff7c596deae68b9c9cd62                                     |
| Run directory                        | .llm/runs/docs-rfc-command-composition-kit--rfc/                             |
| RFC                                  | rfcs/0000-command-composition-kit.md (0000, Draft)                           |
| Review state                         | Cycle 2 ready; no generator verdict                                          |

The immutable final branch HEAD is the commit containing this handoff and its validation evidence. A
Git commit cannot embed its own not-yet-computed object ID. The exact post-push branch HEAD is
therefore recorded in the final non-verdict PLAN-EVAL PR comment and the root response;
c98c08adabbd992a557ff7c596deae68b9c9cd62 is the exact RFC remediation content under review.

## Locked decisions

1. One conformant store transaction is the maximum atomicity claim. Business writes, the replay
   receipt, audit rows, and outbox rows use the same generated transaction client and commit or roll
   back together.
2. Receipt identity is (scope, commandName, SHA-256(idempotencyKey)); request identity is SHA-256
   over RFC 8785 JCS bytes for the exact versioned semantic request. Same scope/name/key plus a
   changed request or definition version is mismatch; a changed scope or command name is a new
   namespace and executes as new.
3. PostgreSQL claims with INSERT ... ON CONFLICT DO NOTHING RETURNING plus an indexed select and a
   transaction-local lock_timeout. MySQL claims with a savepoint/plain INSERT, recovers only 1062,
   aborts on 1205/1213, and restores or discards the session after changing
   innodb_lock_wait_timeout. SQL Server claims with the generated named unique index and
   UPDLOCK/HOLDLOCK, bounded by SET LOCK_TIMEOUT. A busy result is callback-terminal and every
   timeout path rolls back.
4. The service package owns command semantics and decoded relay delivery/sinks/supervision. The
   database package owns the true transaction, raw receipt/audit/outbox rows, raw relay
   lease/token/release types, and provider adapters. The only new edge is service → database;
   database imports no service type.
5. V1 does not wrap or depend on @netscript/queue. It reuses the verified lease algorithm and
   conformance pattern, not queue's delete-on-ack/DLQ/public-loop contract or runtime schema
   creation. A separate queue runtime-DDL reconciliation is proposed before future code sharing.
6. The explicit netscript db command-store add generator owns consumer Prisma models, reviewable
   migrations, the bridge, and CommandTransactionClient derived from the generated
   Prisma.TransactionClient with root/lifecycle methods explicitly omitted. Hidden migrations and a
   framework fake transaction client are rejected.
7. Capabilities distinguish selectableIsolationLevels from defaultIsolation. MySQL is blocked until
   SNAPSHOT is removed/rejected and all SQL tokens are allow-listed. A future SQLite shape selects
   no explicit levels and reports a Serializable default; explicit Serializable remains refused.
8. Optimistic concurrency is an application repository conditional mutation. Zero matched rows is a
   typed conflict. The executor performs no read-then-compare shortcut and never retries the
   callback automatically.
9. Remote I/O is outside the transaction. A committed outbox message retains its stable ID across
   at-least-once relay attempts; publish-then-crash may duplicate delivery. Workers, sagas, streams,
   and receivers own downstream deduplication and compensation.
10. Command-visible contract errors use the literal-preserving four-generic ContractBuilder spelling
    owned by #1350. Contract and service surfaces are A4; database/telemetry adapters A2; relay
    runtime discipline A3; thin integrations A5; generators A6.
11. Default command telemetry is bounded and redacted. Existing messaging correlation and saga
    idempotency attributes are acknowledged as an operator-experience asymmetry, not precedent for
    raw command identifiers.
12. The RFC remains documentation-only, Draft, and numbered 0000. Numbering, acceptance, issue
    creation/closure, milestone changes, merge, and later implementation remain maintainer/root
    work.

## Unresolved FCP questions

1. Whether idempotency is required for every v1 command or may be explicitly optional for controlled
   internal callers. Recommendation: required by default; explicit opt-out only.
2. Whether the future SQLite default-only capability is accepted and whether it is required for the
   first release. Recommendation: accept the honest shape, release later, and make no support claim
   until real contention/crash/lease tests pass.
3. Whether validated correlation may be an opt-in command telemetry attribute, and whether the
   existing messaging/saga identifier attributes should be separately deprecated or redacted.
   Recommendation: durable-row/policy-controlled logs only for commands by default, plus a separate
   vocabulary cleanup.
4. Receipt retry-window and published-outbox cleanup defaults. Recommendation: require explicit
   deployment values until operational evidence exists; audit retention remains application policy.

Provider claim algorithms, relay ownership, queue reuse, identity-drift behavior, generated
transaction typing, and MySQL isolation truth are resolved design inputs, not FCP questions.

## Validation evidence

| Evidence                                                                                                | Result                                                                                                             |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Scoped deno fmt --check over authored RFC/remediation/handoff Markdown                                  | PASS; generated launcher metadata kept in its launcher-emitted form and audited separately                         |
| git diff --check and origin/main...HEAD changed-file/lock audit                                         | PASS; only the RFC and mandatory run artifacts; no package, plugin, schema, generated product, or deno.lock change |
| rtk proxy deno task docs:links                                                                          | PASS; 102 docs, 0 broken links, 0 broken anchors, 0 orphans                                                        |
| rtk proxy deno task docs:accuracy                                                                       | PASS; repository accuracy/discoverability assertions                                                               |
| Focused RFC frontmatter/F-B1–F-B7/forbidden-vocabulary assertion                                        | PASS; 17 required claims, 3 forbidden-pattern classes                                                              |
| rtk proxy deno check --no-lock --unstable-kv on database/service/contracts/telemetry public entrypoints | PASS; existing peer/build-script warnings only                                                                     |
| Focused Prisma 7.8 generated-client probe                                                               | PASS; Prisma.TransactionClient exists and current deny-list retains nested $transaction; probe removed             |
| agentic:review-threads on #1389                                                                         | PASS; 0 threads, 0 unanswered                                                                                      |
| agentic:pr-checks on #1389 at c98c08ada                                                                 | PASS; 15 reconciled checks, 0 current failures; docs-only lanes skipped                                            |
| Product/CLI runtime E2E                                                                                 | N/A by scope; no package, generator, schema, scaffold, runtime, export, or lock changed                            |

No evaluator verdict is claimed. Existing contracts/telemetry doc-lint findings remain recorded
future implementation bars, not new findings or waivers in this docs PR.

## Board reconciliation proposal

No issue, milestone, or board item was created, closed, or mutated by this generator.

- Keep #1361 as the 0.0.6 RFC ratification record; this PR references it without a closing keyword.
- Keep #1363 as the 0.0.8 implementation umbrella.
- Keep #1350 as the 0.0.7 literal-error prerequisite.
- Let #1362 own generated service layering; command-handler generation depends on that shape.
- Let #1364 own the outbound HTTP/webhook recipe and consume stable command-outbox IDs.
- Keep #1293 adjacent; it does not repair the distinct MySQL SNAPSHOT/allow-list defect.
- Propose, for maintainer filing after acceptance, a PR-sized queue runtime-DDL reconciliation child
  before command-relay/queue code sharing. This RFC run does not create it.
- Keep optional SQLite conformance as the FCP-timed child and cross-reference #1278 without
  importing its broader type-soundness scope.
- Do not assign the RFC number, close an umbrella, or move any milestone from this PR.

## Exact Fable cycle-2 re-evaluation handoff

The root orchestrator should resume the existing Claude Fable 5 evaluator session and send exactly:

> Run PLAN-EVAL cycle 2 for draft PR rickylabs/netscript#1389. Stay in the existing Fable 5
> evaluator session; do not launch or delegate to another evaluator. Read
> .llm/runs/docs-rfc-command-composition-kit--rfc/plan-eval.md completely and treat every cycle-1
> finding F-B1 through F-B7 and every Required for PASS item as the acceptance checklist. Review the
> current branch HEAD named in the latest non-verdict [PHASE: PLAN-EVAL] PR comment; the exact RFC
> remediation content commit is c98c08adabbd992a557ff7c596deae68b9c9cd62, based on evaluator commit
> 122301d25f4055bfebffefeb3aec2b23c707cfca. Read the RFC and
> supervisor/research/plan/worklog/context-pack/drift/final-handoff artifacts, and compare the
> carried proposal, current origin/main@fac9e339042c, relevant source, and primary provider
> documentation. Verify specifically: (1) PostgreSQL/MySQL/SQL Server receipt claims, bounded lock
> waits, rollback/no-poison and session restoration; (2) raw database relay ownership versus decoded
> service runtime ownership and the new one-way service → database dependency; (3) the explicit
> rejection of direct queue reuse and the hidden-runtime-migration reconciliation; (4) deterministic
> scope/fingerprint behavior plus execute-as-new changed-scope/renamed-command conformance and
> migration law; (5) MySQL's four-level isolation gate distinct from #1293; (6) generator-owned
> CommandTransactionClient typing; and (7) the complete archetype, ContractBuilder, vocabulary,
> milestone, worker, SQLite, telemetry, and CLI correction batch. Preserve the one-store
> transaction, receipt, relay, capability-honesty, and refusal laws. Record the formal cycle-2
> verdict and evidence in plan-eval.md and the structured PLAN-EVAL PR comment according to the
> evaluator protocol. Do not edit the RFC or other author artifacts, number the RFC, approve on
> behalf of the generator, merge, close/create issues, mutate milestones, or trigger IMPL-EVAL/Qwen.

## Generator stop condition

After the handoff evidence commit is pushed, the PR body is reconciled, its sole lifecycle label is
status:plan-eval, and the final non-verdict PR comment carries the exact branch HEAD, generator work
stops. Fable cycle 2 and the later Qwen adversarial evaluation remain external and pending; the PR
stays draft and unmerged.
