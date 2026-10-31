# Worklog

## Design

1. Public surface: published docs accurately describe worker delivery, saga messaging/projections/compensation, trigger actions/retry and stream producers.
2. Domain vocabulary: accepted write versus delivered write; at-least-once delivery; applied-key window; packaged entrypoint versus generated runtime wrapper; one scheduler owner. No new framework terms.
3. Ports: existing saga bus/store, worker idempotency port, stream producer lifecycle/receipt and trigger definition policy. No new runtime dependency.
4. Constants: use existing exported reconnect/buffer defaults and canonical WORKERS_CONCURRENCY. Recipe identifiers are named constants where reused.
5. Commit slices: S0 evidence/draft; S1 complete twelve-item docs reconciliation plus gates; S2 final evidence/handoff. Exact files and proving gates are in plan.md.
6. Deferred: all packages/plugins implementation, generated carriers outside assigned paths, releases and merge.
7. Contributor path: research.md maps every finding to canonical docs and source; streams.md is the extension entry for worker producer usage.

## Owner evaluation override

Verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”

Rationale: owner-selected independent Anthropic evaluator for this OpenAI implementation. Feature matrix queried first; owner override changes evaluator cells only.

## Intake

- Baseline equals fetched origin/main; no prior local changes.
- Original issue body and all comments read. No acceptance boxes exist; all twelve numbered findings are the acceptance surface.
- Related merged PRs are partial; no duplicate full audit found.
- MCP find_guidance then search_docs completed before code research.
- Memory consulted; RTK unavailable, use direct commands.
- Highest-priority operator directive selects reference-only PR body and coordinator-owned labels/milestone; generic closing-footer and automatic-label advice does not apply.
- PLAN-EVAL pending. Implementation has not started.

PLAN-EVAL round 1: FAIL_PLAN, retry-export/discovery design needs explicit constraints. Plan updated before implementation; second review reuses the same independent evaluator. Baseline docs verify, snippets and accuracy passed, and prose carrier freshness was true.

PLAN-EVAL round 2: PASS before S1 edits; same separate read-only evaluator. Exact report in plan-eval.md; prior report retained in plan-eval-r1.md.

## S1 implementation in progress

Corrected public delivery, producer lifecycle, runtime entrypoint and policy wording. The worker lesson now contains a schema-first `defineJobHandler(schema, handler)` and awaits the write receipt. Shared producers are not stopped per job. Retry example keeps base private, exports one frozen full-policy definition, and documents static discovery limitations. No packages/plugins changed.

S1 local gates passed: docs verify (253 pages, 23,829 links), docs:snippets (26 Tier-1 checks), focused workflow example compile, docs:accuracy, 33 existing runtime truth tests, scoped TS check/lint/fmt and diff whitespace. Baseline negative control fails as expected. Final per-item table is acceptance.md; detailed results are gate-results.md.

Freshness remains non-green: generated package prose carrier is stale after docs changes. Scope prohibits its update, so no package carrier changes are made and no CI-green claim is made. Independent slice review is next, before S1 sign-off commit.

Independent S1 slice review: docs PASS; all twelve source checks and worker/retry recipe constraints approved. Report: slice-review.md. Evaluator requested a publish-assets measurement; allowlisted check:publish-assets returns PASS against the current (old) corpus. Full allowlisted agent-docs-prose returns FAIL due to the stale CLI prose carrier. No package files changed.

Final source-tracing clarification: the job scaffolder emits a metadata comment and handler, not a separate job config file; tutorial now explicitly preserves that comment. Retry attempts are described per connection/delivery phase. These prose clarifications will be included in the final exact-head review.

Reconcile before S1: latest fetched main is b0b8f3f7282d073d92d64acdee522ea34bba4c5c; its sole new commit affects Figma variable exports, with no overlap in this audit.

## S1 terminal

- Commit: bed17028beb9096dc08cac05e3a44d0deb5c3faa. Pushed; direct ls-remote confirms identical remote SHA.
- Independent docs review PASS before the source commit. Coordinator supervisor sign-off/merge remains outside this implementer lane.
- Per-slice PR comment posted with scope, commit and gate evidence.
- No package/plugin/lock/assignment files changed.

## S2 evidence handoff

Dated lesson and evaluate.md prepared. Final evaluation authority will be the independent PR phase comment naming the exact final pushed head, avoiding a self-invalidating verdict commit. Required CI freshness remains unproven/red until the coordinator updates the prohibited generated package carrier. No new architectural debt introduced; trigger builder retry parity is an existing API gap, documented for follow-up.

Review threads gate: PASS, zero current/unanswered threads at the source-slice checkpoint. No AppHost, database, container or scaffold E2E was launched. No unclear resource ownership or cleanup needed.

Reconcile S2: source docs and test remain byte-identical to S1. Only scoped run artifacts change in this slice.

## S2 follow-up — maintained docs scan manifest

Before freezing the final head, check:aspire-version-parity identified a stale manifest after restoring the worker chapter. Regenerated with the existing aspire-surface-manifest.ts generator: exactly one row added for docs/site/tutorials/eis-chat/03-deliver-worker.md. Recheck PASS (manifestFresh true, 0 failures, missing []). This permitted docs-tooling metadata change expands scanning to the restored page; no rule or exclusion changed. Final independent review will include this deterministic follow-up.

The source remained unchanged while exact-head exploratory final gates at 1fb5f71 passed docs accuracy, 34 focused tests and normal snippets. The full agent-docs-prose gate still failed at that head, confirming the recorded package-carrier prerequisite. CI close-gate also reflects the unchecked prerequisite, not missing issue acceptance (there are no issue checkboxes).

## S3 — coordinator-authorized generated carrier integration

The coordinator authorized generated-only package updates in PR comment 6539166396. Exact authorization and limits are preserved in supervisor.md. The prior scope blocker is resolved; no package file will be hand-edited. Use canonical gen:agent-docs-prose, check:publish-assets and check:assets-barrel, regenerating only reported stale outputs. Record each changed file and its generator for READY. No branch rebase, force push, label, milestone or merge.

The externally prepared two-file preview demonstrated freshness and MCP byte-budget headroom, but it is not applied: the coordinator requires canonical generator tasks on the assigned branch.

S3 generated exactly two package files through the canonical tasks: CLI prose carrier via gen:agent-docs-prose; MCP publish assets via gen:publish-assets. Both are byte-identical to the external canonical preview. Authoritative after-generation agent-docs-prose and publish-assets checks pass, as do scoped generated-file check and quality:gate. assets-barrel generation changes no other file; its final diff check awaits the committed tree. Generator commands and hashes are recorded in generated-carriers.json. No other package/plugin/lock changes.

The prior final CHANGES at 7bc4f21 is preserved as historical evidence. The coordinator explicitly requested another exact-head review after this generated-only integration; it will use the same independent evaluator.
