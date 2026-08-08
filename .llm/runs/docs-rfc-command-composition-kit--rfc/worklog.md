# Worklog: production command composition kit RFC

## Run Metadata

| Field          | Value                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| Run ID         | `docs-rfc-command-composition-kit--rfc`                                                                             |
| Branch         | `docs/rfc-command-composition-kit`                                                                                  |
| Archetype      | Docs delivery describing A4 contracts/service, A2 adapters/telemetry, A3 runtime discipline, A5 plugins, and A6 CLI |
| Scope overlays | `SCOPE-docs`, `SCOPE-service`                                                                                       |

## Design

The S1 re-baseline locked the RFC contract before prose authoring. S2 has now rendered those
decisions as exact guide/reference contracts in `rfcs/0000-command-composition-kit.md`. This PR
remains docs-only; the product names below are future surfaces whose implementation is decomposed
after ratification.

### Public Surface

- `rfcs/0000-command-composition-kit.md` — draft RFC only; no product export changes.
- Future `@netscript/service/commands` executor/DSL plus `./commands/relay` decoded runtime/sink and
  testing subpaths.
- Future `@netscript/database/commands` raw command/relay stores, provider adapter subpaths, and
  conformance subpath; service adds a direct database dependency and database never imports service.
- Future opt-in `@netscript/contracts/commands` error map and existing telemetry attributes
  extension.
- Explicit consumer-owned receipt/audit/outbox models and `db command-store add` generated
  relay/command bridge plus `CommandTransactionClient`.
- One attempt-scoped `executionId` joins receipt, audit, and outbox evidence; typed codecs guard
  replay outputs and outbox payloads.

### Domain Vocabulary

- command — one caller intent applied within one supported store transaction.
- receipt — durable idempotency outcome keyed by command identity and canonical request hash.
- audit record — same-commit actor/correlation evidence, not a mutable event log.
- outbox message — same-commit delivery intent relayed at least once after commit.
- capability/refusal — adapter truth describing which guarantees exist and why execution may refuse.

### Ports

- command store — conformant only where one transaction-scoped client can write business state,
  receipt, audit, and outbox rows; no weaker implementation satisfies the port.
- outbox relay store — database-owned raw lease/token/release port; no decoded service type.
- relay sink/supervisor — service-owned decoded post-commit runtime seam; it cannot enlarge the
  transaction boundary and does not make database depend on service.
- telemetry/redaction policy — injected observability seam with bounded attributes.

### Constants

- RFC status: `Draft`; RFC number: `0000` until maintainer acceptance.
- Claim vocabulary: `one-store`, `at-least-once`, `idempotent replay`, `same-commit`, `refused`.
- Lifecycle status progression for this run: `status:research` → `status:plan` → `status:plan-eval`.

### Commit Slices

| #  | Slice                                                                                                                                         | Gate                                                      | Files                                                                     |
| -- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| B0 | Activate the harness and expose the run on a draft PR.                                                                                        | raw git identity/status; artifact presence                | `.llm/runs/docs-rfc-command-composition-kit--rfc/*`                       |
| S1 | Re-baseline proposal, code, exports, tests, docs, live board, and primary adapter guarantees; lock the plan.                                  | evidence inventory; `deno doc`; plan-gate readiness check | run `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md` |
| S2 | Define the exact public contracts, semantic laws, capability matrix, failure/telemetry/security model, and examples.                          | source-alignment audit; focused probes                    | RFC plus run artifacts                                                    |
| S3 | Complete worker/saga boundary, conformance/failure injection, compatibility, staging, docs/scaffold impact, issue decomposition, and handoff. | docs/RFC/link/format/diff gates                           | RFC, run artifacts, `final-handoff.md`                                    |
| S4 | Remediate authoritative PLAN-EVAL cycle-1 findings F-B1–F-B7 without self-evaluation.                                                         | provider/source probes; docs/type/link/diff checks        | RFC, research/plan/worklog/context/drift/final handoff, launcher metadata |

### Deferred Scope

- Product/package/plugin implementation — belongs to #1363 and follow-on implementation slices.
- Cross-store coordination and distributed transactions — explicitly refused.
- Relay deployment/operations — specified only as the narrow boundary necessary to consume outbox
  rows.
- Formal cross-RFC review and final adversarial evaluation — launched by the root orchestrator, not
  this generator.

### Contributor Path

Start at the RFC's semantic laws and capability matrix; implement contract-first in the staged issue
order, then add each adapter only after its injected-failure conformance suite proves the advertised
capabilities.

## Progress Log

| Time       | Slice | Step                   | Notes                                                                                                                                                                                                        |
| ---------- | ----- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-08 | B0    | bootstrap              | Read all named skills and required RFC/harness/doctrine/evaluator authority; verified pinned branch/base.                                                                                                    |
| 2026-08-08 | B0    | session health         | Agentic runtime status made no changes and returned `MISSING_IDENTITY`; preserved the staged attached-thread receipt.                                                                                        |
| 2026-08-08 | B0    | live issue check       | Confirmed #1361–#1364 and source PR #1347 exist; detailed re-baseline continues in S1.                                                                                                                       |
| 2026-08-08 | B0    | publish                | Committed `ad643e15d657eb2b8e7a2d741e690c028ce67dc9`, pushed only as `HEAD:refs/heads/docs/rfc-command-composition-kit`, and opened draft PR #1389.                                                          |
| 2026-08-08 | B0    | PR metadata            | Applied the required docs/RFC/area/priority/CI labels with exactly `status:research`; posted the opening `[PHASE: RESEARCH]` comment.                                                                        |
| 2026-08-08 | S1    | public API re-baseline | Used native `deno doc` on database/service/contracts/telemetry/workers/sagas/SDK and oRPC; inspected export maps and source where the public surface was insufficient.                                       |
| 2026-08-08 | S1    | focused probes         | Proved `withTransaction` exposes root-only methods inside its callback (unexpected PASS) and reproduced #1350's `error.code` → `never` failure; removed both probes after execution.                         |
| 2026-08-08 | S1    | runtime/store research | Compared Prisma provider isolation, PostgreSQL, SQL Server, SQLite, Deno KV, RFC 8785, W3C Trace Context, and OTel primary documents.                                                                        |
| 2026-08-08 | S1    | proposal challenge     | Found the reserved saga outbox port, dynamic service context, missing SQLite adapter, route-local oRPC error composition, and #1293 package conflation; recorded corrections in `research.md`.               |
| 2026-08-08 | S1    | plan lock              | Locked package ownership, hash/codec rules, no-weak-port/no-hidden-retry laws, telemetry redaction, adapter truth, and board decomposition; plan gate is ready.                                              |
| 2026-08-08 | S2    | RFC contract draft     | Authored the complete template-based RFC with exact service/store/contract/relay types, consumer-owned logical rows, JCS hashing, transaction algorithm, and semantic laws.                                  |
| 2026-08-08 | S2    | production review      | Added an attempt `executionId`, schema-backed outbox payloads, deterministic scope constraints, and an explicit retry/terminal relay release union after reviewing the exact contracts.                      |
| 2026-08-08 | S2    | boundary proof         | Kept remote delivery post-commit and at least once; separated the existing saga outbox and worker delivery claims from the command receipt/store guarantee.                                                  |
| 2026-08-08 | S2    | surface design         | Specified focused service/database/contracts subpaths and telemetry additions, JSR/slow-type/publish consequences, migration ownership, and staged implementation without changing exports.                  |
| 2026-08-08 | S2    | type-shape probe       | Checked a synthetic command definition against current DB types, Zod, and Standard Schema. Initial resolution exposed the missing service dependency; direct JSR import passed; probe removed.               |
| 2026-08-08 | S3    | docs/RFC gates         | Scoped format/diff, repository docs links/accuracy, RFC frontmatter/section/terminology assertions, and docs-only changed-file audit passed.                                                                 |
| 2026-08-08 | S3    | JSR baseline           | Full-entrypoint doc-lint reported service 0, database combined 0, contracts 9 existing private-type findings, and telemetry 7 existing findings; no package file changed.                                    |
| 2026-08-08 | S3    | PR reconciliation      | Review-thread gate passed with 0 threads/unanswered; PR-check gate passed with 15 checks and 0 current failures (docs-only lanes intentionally skipped).                                                     |
| 2026-08-08 | S4    | evaluator intake       | Preserved evaluator commit `122301d25`; read `plan-eval.md` completely and accepted `FAIL_PLAN`/F-B1–F-B7/Required-for-PASS as authoritative.                                                                |
| 2026-08-08 | S4    | provider verification  | Re-read doctrine/harness authority; checked queue runtime DDL/lease semantics, service/database dependencies, MySQL isolation, telemetry/worker vocabulary, current CLI `db` help, and primary lock docs.    |
| 2026-08-08 | S4    | Prisma type probe      | Generated a temporary Prisma 7.8 client, confirmed `Prisma.TransactionClient`, found current deny-list retains `$transaction`, locked the generator-owned explicit `Omit`, and removed the probe.            |
| 2026-08-08 | S4    | RFC remediation        | Added normative PostgreSQL/MySQL/SQL Server receipt claims/timeouts, relay ownership, queue rejection/reconciliation, identity drift laws, MySQL/SQLite truth, generated typing, and F-B7 batch corrections. |

## Decisions

| Decision                                                                                                                                                                                            | Reason                                                                                                                | Source                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Keep this PR docs-only and RFC number `0000`.                                                                                                                                                       | RFC lifecycle and issue #1361 scope.                                                                                  | `rfcs/README.md`, #1361                              |
| Select A4 for contracts/service DSLs, A2 for database/telemetry adapters, A3 for relay runtime discipline, A5 for thin plugin integrations, and A6 for generators; A1 was read but is not selected. | The design crosses those implementation surfaces, while this PR changes documentation only.                           | Doctrine chapter 06; harness archetypes              |
| Do not launch evaluators or a second Codex session.                                                                                                                                                 | Owner reserves review/evaluation for the root orchestrator; mobile-visible thread must remain singular.               | implementation brief; `codex-wsl-remote`             |
| Put command semantics in service, transaction persistence in database, opt-in errors in contracts, and attributes in telemetry.                                                                     | Preserves focused subpaths and one-way service → database dependency without a new package.                           | code/export re-baseline; doctrine A9–A11             |
| Reject a weak KV command mode and automatic callback retry.                                                                                                                                         | Either all local rows share one commit or the adapter does not conform; caller retry is receipt-safe and observable.  | Deno KV docs; doctrine A12–A13                       |
| Reject read-then-compare concurrency and unknown receipt values.                                                                                                                                    | CAS is repository-specific; explicit JCS fingerprints/codecs prevent races and serialization ambiguity.               | Prisma OCC docs; RFC 8785; focused API analysis      |
| Keep remote effects outside the callback and relay stable outbox IDs at least once.                                                                                                                 | SQL cannot roll back network effects; publish-then-crash can duplicate delivery.                                      | worker/saga code; OTel/W3C docs; doctrine chapter 08 |
| Join receipt, audit, and outbox evidence with one attempt `executionId`.                                                                                                                            | Correlation alone is neither unique nor a reliable ownership/join key; optional unkeyed attempts still need identity. | S2 exact-row review                                  |
| Require a schema-backed codec for each outbox payload and model terminal relay release explicitly.                                                                                                  | Producer type safety and exhaustion handling cannot exist only in prose.                                              | S2 exact-port review                                 |
| Lock provider-specific receipt algorithms and treat claim timeout as callback-terminal.                                                                                                             | Prevents PostgreSQL poisoning, MySQL error over-swallowing, SQL Server race, and session timeout leakage.             | PLAN-EVAL F-B1; primary provider docs                |
| Split relay persistence into database and decoded runtime/sinks into service.                                                                                                                       | Preserves dependency direction while giving every public relay type an owner.                                         | PLAN-EVAL F-B2; doctrine ports/layering              |
| Reject direct queue-package reuse in v1 and propose runtime-DDL reconciliation first.                                                                                                               | Queue deletes/acks/DLQs and hidden schema creation do not implement retained token-settled outbox semantics.          | PLAN-EVAL F-B3; queue source                         |
| Treat changed scope/name as execute-as-new and require determinism/compatibility fixtures.                                                                                                          | The unique key cannot detect identity in another namespace; migration law must match actual behavior.                 | PLAN-EVAL F-B4                                       |
| Separate selectable/default isolation and require MySQL four-level allow-list.                                                                                                                      | Makes SQLite default-only behavior and MySQL's false `SNAPSHOT` token honest.                                         | PLAN-EVAL F-B5/F-B7f                                 |
| Generate `CommandTransactionClient` from the consumer's Prisma namespace and explicitly omit root methods.                                                                                          | Model delegates are consumer-specific, and current Prisma deny-list retains nested `$transaction`.                    | PLAN-EVAL F-B6; focused probe                        |

## Drift

| Drift                                                                                                 | Severity    | Logged in drift.md |
| ----------------------------------------------------------------------------------------------------- | ----------- | ------------------ |
| Runtime controller could not correlate the active staged thread to persisted runtime identity.        | minor       | yes                |
| Proposal says no outbox exists, but a reserved saga outbox port is public.                            | significant | yes                |
| Proposal treats current SQLite/MySQL/package and transaction-helper surfaces too broadly.             | significant | yes                |
| Cycle-1 evaluator found receipt algorithms, relay ownership, and queue reuse were silently deferred.  | critical    | yes                |
| Queue's existing runtime schema creation conflicts with the new command-kit no-hidden-migration rule. | significant | yes                |

## Gate Results

### Static Gates

| Gate                           | Command or check                                                           | Result               | Notes                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| Branch/base identity           | raw git `rev-parse`, `merge-base`, `status`                                | PASS                 | Branch and base exactly match the brief.                                                             |
| Mandatory authority read       | complete file reads                                                        | PASS                 | RFC process, doctrine, gate/evaluator files and selected profiles read before RFC authoring.         |
| Native public API inspection   | `deno doc --filter` on database, service, SDK, telemetry, workers and oRPC | PASS                 | Exact current signatures and missing subpaths recorded in research.                                  |
| Focused transaction type probe | `deno check --unstable-kv packages/database/rfc-command-probe.ts`          | EXPECTED_FAIL_MISSED | Exit 0 proves the callback surface is too broad; temporary probe removed.                            |
| Focused typed-error probe      | `deno check --unstable-kv packages/sdk/rfc-command-probe.ts`               | EXPECTED_FAIL        | Exit 1 with TS2339 on `error.code`; temporary probe removed.                                         |
| Focused RFC type-shape probe   | `deno check --unstable-kv packages/service/rfc-command-contract-probe.ts`  | PASS_AFTER_FINDING   | First run found missing service Standard Schema mapping; direct locked import passed; probe removed. |
| Markdown format                | `deno fmt --check rfcs/... .llm/runs/...`                                  | PASS                 | 10 owned Markdown files checked.                                                                     |
| Diff hygiene                   | `git diff --check` and changed-file audit                                  | PASS                 | Only the RFC and required run directory differ from the pinned base; no lock/product change.         |
| Docs links                     | `rtk proxy deno task docs:links`                                           | PASS                 | 102 docs; 0 broken links, 0 broken anchors, 0 orphans.                                               |
| Docs accuracy                  | `rtk proxy deno task docs:accuracy`                                        | PASS                 | Saga/storefront/path/CLI/Fresh accuracy checks passed.                                               |
| RFC structure/terminology      | focused `deno eval` frontmatter/section/forbidden-term assertion           | PASS                 | Draft/0000/#1361 and all required sections present; forbidden domain vocabulary absent.              |
| PR review threads              | `rtk proxy deno task agentic:review-threads -- ... --pr 1389 --pretty`     | PASS                 | 0 threads; 0 unanswered.                                                                             |
| PR checks                      | `rtk proxy deno task agentic:pr-checks -- ... --pr 1389 --pretty`          | PASS                 | 15 reconciled checks; 0 current failures; docs-only CI lanes skipped under explicit labels.          |

### Fitness Gates

| Gate                              | Result                      | Evidence                                   | Notes                                                                                                         |
| --------------------------------- | --------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| F-5/F-6/F-7 planned surface audit | PASS_DESIGN                 | `research.md` JSR/public-surface table     | Design-time only; implementation gates specified per subpath.                                                 |
| F-13 runtime invariants           | PASS_DESIGN                 | `plan.md` semantic laws and relay boundary | RFC must carry the exact injected-failure matrix in S2/S3.                                                    |
| Current package doc-lint baseline | PASS_WITH_BASELINE_FINDINGS | structured full-entrypoint reports         | service/database combined 0; contracts 9 and telemetry 7 pre-existing findings; changed surface is docs-only. |

### Runtime Gates

| Gate            | Result | Evidence            | Notes                        |
| --------------- | ------ | ------------------- | ---------------------------- |
| Product runtime | N/A    | RFC/docs-only scope | No product behavior changes. |

### Consumer Gates

| Consumer                           | Result        | Evidence                                                                     | Notes                                                                      |
| ---------------------------------- | ------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Existing service/scaffold surfaces | PASS_ANALYSIS | Executed CLI help; CRUD template and add-route/add-handler source inspection | Current explicit commands and missing command/schema/relay paths recorded. |

## Handoff Notes

- Final handoff is `final-handoff.md`. The root orchestrator should inspect the RFC's public
  contracts, semantic laws, adapter matrix, and refusal boundary first, then use the exact Fable
  prompt there. No evaluator was launched by this generator.
