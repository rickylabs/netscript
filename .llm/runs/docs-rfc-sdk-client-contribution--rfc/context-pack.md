# Context Pack: typed SDK client contribution RFC

## Run Metadata

| Field          | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Run ID         | `docs-rfc-sdk-client-contribution--rfc`                |
| Branch         | `docs/rfc-sdk-client-contribution`                     |
| Current phase  | `plan-eval`; awaiting owner-directed Fable/Qwen review |
| Archetype      | `2 + 4 + 5 + 6` described; docs-only PR                |
| Scope overlays | `SCOPE-docs`                                           |
| PR             | `https://github.com/rickylabs/netscript/pull/1390`     |

## Current State

The RFC is authored at `rfcs/0000-sdk-client-contributions.md` and keeps `0000`/Draft. It rejects
the starting single “everything” envelope and ratifies a narrow, versioned request-header
preparation axis. Research, type proof, current JSR/doc-lint baselines, live board state, and
primary upstream sources are recorded. No product source is changed.

## Decision Snapshot

- `defineSdkClientContribution<TContext>()` produces a named major-1 descriptor with a runtime
  required/optional context declaration, exclusive lower-case header ownership, mandatory cache
  effect, and async `prepare`.
- Literal tuples intersect context and diagnose duplicate id/context/header ownership; runtime
  repeats checks. Limit: 16 contributions/service.
- Each contributor sees the same immutable snapshot; successful composition is order-independent.
- Query-safe contributions are `invariant` or supply a synchronous non-secret id-sorted partition.
  `direct-only` service keys are omitted from generated query maps.
- Bearer auth is the first dogfood in `plugin-auth-core`; locale/`accept-language` is the non-auth
  proof.
- `NetScriptProcedureMeta.access.authentication` is `none | optional | required`; unmarked auth
  defaults to `none`.
- SDK transport retains discovery/codec/fetch/retry/dedupe/trace/errors. Trace fields are reserved;
  #1353 is a trace-ownership proof, not a contribution.
- Plugin discovery registers static module/export/targets; generated/app config explicitly selects
  contributions per service.
- Preparation failures are stable local errors, never server-defined contract errors.

## Files Changed

| Path                                               | Status          | Notes                                                 |
| -------------------------------------------------- | --------------- | ----------------------------------------------------- |
| `rfcs/0000-sdk-client-contributions.md`            | new             | Decision-complete RFC; no product implementation.     |
| `.llm/runs/docs-rfc-sdk-client-contribution--rfc/` | updated/new     | Mandatory harness evidence plus launch records.       |
| `.llm/tmp/sdk-client-contribution-probe.ts`        | ignored scratch | Non-product inference/conflict proof; not part of PR. |

## Live Board Snapshot

- #1348 is open `status:triage`, milestone 0.0.6; it remains tracking and needs post-FCP body
  reconciliation.
- #1349–#1353 are open `status:triage`, milestone 0.0.7.
- #1093 is generic discovery; #451 remains sole custom-link owner.
- #928/#934 align protocol/metadata vocabulary at 0.0.9; #884 is a later tenant candidate.
- PR #1347 remains an open draft planning record and says it must not merge.
- No issue/milestone was mutated by this run.

## Gate Snapshot

| Gate                           | Status           | Evidence                                                                        |
| ------------------------------ | ---------------- | ------------------------------------------------------------------------------- |
| RFC formatting                 | pass             | `deno fmt --check`                                                              |
| RFC internal links             | pass             | focused repo link checker, 0 broken                                             |
| Repository docs links/accuracy | pass             | both tasks exit 0                                                               |
| Type probe                     | pass             | Deno check; 16 accepted/17 rejected fixture                                     |
| Package dry-run baseline       | pass             | contracts/sdk/plugin/auth-core all report dry-run OK                            |
| JSR package audit              | baseline finding | plugin audit exit 1 on pre-existing module tags/cardinality; other three exit 0 |
| Doc-lint baseline              | baseline finding | combined private refs 9/3/15/4 respectively; RFC adds none                      |
| Doctrine                       | pass             | `deno task arch:check` exits 0; existing warnings are baseline                  |
| Plan Gate self-audit           | pass             | complete for external evaluator entry; no evaluator verdict claimed             |
| Final PR reconciliation        | pass             | draft, required labels, sole `status:plan-eval`, no milestone/closing keyword   |

## JSR Consequences

- No new contracts/SDK/plugin subpaths; root/client/ports/config symbols expand.
- Auth core adds `./sdk` and possibly a constrained `./sdk/server` export.
- No oRPC public type may leak into declarations.
- Implementation must reduce or isolate existing private-type references, preserve precise error and
  metadata types, and pass doc-lint/publish/consumer gates.

## Board Reconciliation Proposal (no mutation yet)

1. Amend #1348 acceptance to the narrow header/context/cache law after RFC acceptance.
2. Narrow #1349 to descriptor/composer/context/query-safety work.
3. Keep #1350 exact error/metadata repair and #1351 SDK-owned transport consolidation.
4. Place bearer convention in auth core under #1352.
5. Re-scope #1353 to final trace injection/reserved-key conformance.
6. File a locale proof child only after acceptance.
7. Cross-link #1093 and keep #451 independent.

## External Reviewer Entry Point

Read, in order:

1. `rfcs/0000-sdk-client-contributions.md`;
2. `research.md` proposal challenge and API/board evidence;
3. `plan.md` locked decisions, gates, and issue reconciliation;
4. `worklog.md` Design and gate results; and
5. `drift.md` for owner-authorized evaluator routing and design drift.

The reviewer must not implement product code, assign an RFC number, merge, close issues, or mutate
milestones. Findings should cite RFC headings and classify blocking versus safe FCP feedback.

## Commits

- Bootstrap: `158849031bba78025d0ec16c8361628211fbc4ed`.
- RFC/research: `89ae608ea935ba8b2776d55e7cb5a09cc29e2520`.
- The handoff-only commit and per-slice PR comments complete the V3 commit record.
