# Final Handoff: production command composition kit RFC

## Delivery identity

| Field                     | Value                                                                        |
| ------------------------- | ---------------------------------------------------------------------------- |
| Draft PR                  | [rickylabs/netscript#1389](https://github.com/rickylabs/netscript/pull/1389) |
| Branch                    | `docs/rfc-command-composition-kit`                                           |
| Pinned base               | `origin/main@fac9e339042c5394bf882311657d8981d353a1c3`                       |
| Reviewed RFC content HEAD | `ad16c42f8e717c727ae00bb66c694f4073234a39`                                   |
| Run directory             | `.llm/runs/docs-rfc-command-composition-kit--rfc/`                           |
| RFC                       | `rfcs/0000-command-composition-kit.md` (`0000`, `Draft`)                     |

The immutable final branch HEAD is the commit that contains this handoff. A Git commit cannot embed
its own not-yet-computed object ID; the exact post-push HEAD is therefore recorded in the final
non-verdict PLAN-EVAL handoff PR comment and the root handoff response. `ad16c42f8...` is the
reviewed RFC content commit; the containing final commits change harness evidence only.

## Locked decisions

1. The only atomicity claim is one transaction on one conformant store. Business writes, a keyed
   replay receipt, audit rows, and outbox rows share that commit.
2. Command semantics live in `@netscript/service/commands`; transaction persistence in
   `@netscript/database/commands`; opt-in client errors in `@netscript/contracts/commands`; command
   telemetry extends `@netscript/telemetry/attributes`. No new package or root re-export is
   proposed.
3. Consumer-owned, provider-aware generated schema/migrations bind side rows to the true transaction
   client. Hidden framework tables, startup migrations, and a weak capability mode are rejected.
4. Receipt identity is `(scope, commandName, SHA-256(idempotencyKey))`; request identity is SHA-256
   over RFC-8785 JCS bytes for the exact versioned semantic request. Replay outputs and outbox
   payloads use explicit Standard Schema-backed codecs.
5. Optimistic concurrency is a repository conditional mutation; zero rows becomes a typed conflict.
   There is no read-then-compare helper and no hidden transaction-callback retry.
6. One `executionId` joins receipt/audit/outbox evidence. Replay creates no new rows. Committed
   incomplete or undecodable receipts are corruption, never permission to execute again.
7. Remote I/O is outside the command callback. The relay uses stable message identity, leases,
   stale-token checks, retry/terminal disposition, and at-least-once wording. Workers, sagas,
   streams, and webhook receivers still own downstream deduplication/idempotency.
8. PostgreSQL is the reference target; MySQL and SQL Server are conforming targets only after the
   same real-provider suite. SQLite remains unclaimed pending an adapter/contention suite. Deno KV
   and every cross-store shape are refused in v1.
9. Default telemetry is bounded and redacted: no raw scope, actor, key/hash, request hash, version,
   correlation ID, durable row ID, payload, response, or arbitrary destination/topic attribute.
10. This PR is documentation only. RFC numbering, FCP, implementation, issue/milestone mutation,
    merge, and release remain maintainer/orchestrator work.

## Unresolved FCP questions

1. Whether idempotency is mandatory for every v1 command or may be explicitly optional for
   controlled internal callers. Recommendation: required by default; explicit opt-out only.
2. Whether SQLite conformance is a first-release requirement. Recommendation: later and unclaimed
   until real contention/crash tests pass.
3. Whether correlation ID may become an opt-in telemetry attribute. Recommendation: durable-row and
   policy-controlled log only by default.
4. Receipt retry-window and published-outbox cleanup defaults. Recommendation: require explicit
   deployment values until operational evidence exists; audit retention remains application policy.

## Validation evidence

| Evidence                                                                                                | Result                                                                                                                                |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `deno fmt --check rfcs/0000-command-composition-kit.md .llm/runs/docs-rfc-command-composition-kit--rfc` | PASS; 10 owned Markdown files                                                                                                         |
| `git diff --check` plus `origin/main...HEAD` changed-file audit                                         | PASS; only RFC + required run artifacts, no package/plugin/lock change                                                                |
| `rtk proxy deno task docs:links`                                                                        | PASS; 102 docs, 0 broken links, 0 broken anchors, 0 orphans                                                                           |
| `rtk proxy deno task docs:accuracy`                                                                     | PASS; repository accuracy/discoverability assertions                                                                                  |
| Focused RFC frontmatter/required-section/forbidden-vocabulary assertion                                 | PASS; `0000`, `Draft`, #1361, all required sections; no forbidden domain terms                                                        |
| Focused transaction callback probe                                                                      | Existing `withTransaction` incorrectly compiled root-only/nested transaction calls; defect proven, probe removed                      |
| Focused SDK typed-error probe                                                                           | Expected TS2339 (`error.code` on `never`) reproduced #1350; probe removed                                                             |
| Focused future command type-shape probe                                                                 | PASS after exposing the required direct `@standard-schema/spec` service dependency; probe removed                                     |
| Structured full-entrypoint doc-lint baseline                                                            | Service `0`; database combined `0`; contracts `9` existing private-type findings; telemetry `7` existing findings; reports exited `0` |
| `agentic:review-threads` on #1389                                                                       | PASS; 0 threads, 0 unanswered                                                                                                         |
| `agentic:pr-checks` on #1389 at RFC HEAD                                                                | PASS; 15 reconciled checks, 0 current failures; docs-only lanes intentionally skipped                                                 |
| Product/CLI runtime E2E                                                                                 | N/A by scope; no product, generated output, schema, package export, or lock changed                                                   |

No evaluator verdict is claimed. The existing contracts/telemetry doc-lint findings are baseline
implementation constraints, not changes or waivers introduced by this PR.

## Board reconciliation proposal

No issue, milestone, or board item was mutated by this generator.

- Keep #1361 as the RFC ratification record; this PR references it without a closing keyword.
- Keep #1363 as the `0.0.8` implementation umbrella and create PR-sized children only after RFC
  acceptance.
- Treat #1350 as stage 0 for client-visible typed command errors.
- Let #1362 own generated service layering; command-handler generation depends on that shape.
- Let #1364 own the outbound HTTP/webhook recipe and consume stable command-outbox IDs.
- Keep #1293 adjacent rather than making the lower-level MySQL adapter hook a false atomicity
  prerequisite; cross-reference #1278 for broader type-soundness work.
- Do not assign the RFC number, close #1361, close an umbrella, or move milestones from this PR.

## Exact Fable-review handoff

The root orchestrator should resume the existing Claude Fable 5 session and send exactly:

> Review draft PR rickylabs/netscript#1389 as the separate PLAN-EVAL / cross-RFC reviewer. Do not
> author implementation code, open another session, assign an RFC number, merge, close issues, or
> mutate milestones. Read
> `.llm/runs/docs-rfc-command-composition-kit--rfc/{supervisor,research,plan,worklog,context-pack,drift,final-handoff}.md`,
> `rfcs/0000-command-composition-kit.md`, the carried RFC-B proposal, RFC-A/RFC-C where they share
> seams, current `origin/main@fac9e339042c`, and live #1361–#1364/#1350/#1293/#1278/#1347. Challenge
> package ownership and dependency direction; true transaction-client binding; receipt races and
> canonical request identity; CAS/isolation/provider claims; same-commit audit/outbox invariants;
> relay lease/terminal/crash semantics; worker/saga boundary; typed error feasibility; telemetry
> redaction/cardinality; JSR/slow-type/publish consequences; generator ownership; refusal boundary;
> and whether the four FCP questions are the only unresolved policy. Check specifically for hidden
> exactly-once, distributed-transaction, ORM, event-sourcing, or domain-specific assumptions. Return
> one structured PR comment beginning `**[PHASE: PLAN-EVAL] [VERDICT: APPROVED]**` or
> `**[PHASE: PLAN-EVAL] [VERDICT: CHANGES_REQUESTED]**`, with numbered findings tied to exact RFC
> sections and a concise next action. Do not edit this branch; the root orchestrator owns
> remediation and the later independent Qwen adversarial pass.

## Generator stop condition

After this handoff is pushed, the draft PR body is reconciled, and its sole lifecycle label is
`status:plan-eval`, generator work stops. Fable review and Qwen adversarial evaluation remain
external and pending; the PR stays draft and unmerged.
