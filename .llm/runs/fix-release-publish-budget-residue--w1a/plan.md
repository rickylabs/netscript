# Plan

## Scope

W1-A only: #1312 publish-budget/partial-publish safety and #1148 generated-source residue coverage.

## PLAN-EVAL decision

The owner explicitly waived PLAN-EVAL for this small connected W1 cluster. The writer must still lock decisions, record design, select gates, and obtain separate-session IMPL-EVAL before ready/merge.

This written waiver is recorded in `supervisor.md`, `plan.md`, `worklog.md`, and `drift.md` before
implementation. PLAN-EVAL: N/A; independent IMPL-EVAL remains mandatory.

## Acceptance contract

### #1312

- Determine exact reset semantics and record them in the release skill.
- Check remaining budget before minting; refuse clearly before partial publication.
- Detect/report partial publication distinctly from pinned-E2E failure.
- Revise cadence against the real budget.
- Decide/document partial-canary policy.

### #1148

- Scan generated source assets capable of embedding the release version.
- Prove a deliberately stale generated `.ts` negative case.
- Preserve/document `.llm/tmp`, `.llm/runs`, `.data`, and release baseline exclusions.
- Measure scan cost and record the selected scope/rationale.

## Locked decisions

1. Add a small authenticated, read-only JSR scope-budget checker. Required attempts equal the
   authoritative publishable workspace-member count. It runs before the cut step and fails closed
   on unavailable/malformed quota data or insufficient remaining attempts.
2. Add a public exact-version outcome reporter used only after a failed real publish. Its contract
   is `none | partial | complete` plus present/missing member lists. Workflow status/summary wording
   keys off publish-step and E2E-step outcomes, so partial upload and pinned-E2E failure cannot
   collapse into one message.
3. Extend residue candidates only to generated TypeScript (`*.generated.ts` and `generated.ts`),
   rather than every TypeScript source file. This covers generated embedded assets with bounded I/O
   and avoids flagging ordinary historical strings in tests/docs/tool source.
4. Preserve all current exclusions. Add explicit negative and exclusion fixtures.
5. Documentation makes rolling-window, coordinated-candidate cadence, and identical-tree
   same-semver completion policy authoritative; no publishing or yanking occurs in this PR.

## Open-decision sweep

- Safe to defer: changed-package-only publication. It changes coordinated workspace publication
  semantics and belongs outside W1-A.
- Safe to defer: a locally persisted quota ledger. The authenticated JSR scope response is the
  authoritative live source.
- Safe to defer: exact rolling-window expiry timestamps. JSR exposes current usage/limit but not
  per-attempt timestamps; the guard does not guess a reset instant.
- Must resolve now: none.

## Commit slices

1. **Bootstrap proves current scope/design is reviewable.** Files: run directory only. Gate: raw
   git/base/lock inspection and live issue reads.
2. **Contracts/tests prove budget, outcome classification, and generated-source residue behavior.**
   Files: release/deps test files plus run artifacts. Gate: focused Deno tests (expected red until
   slice 3 implementation is present; contract-first work is committed together with its minimal
   implementation if a red-only commit would break the shared draft head).
3. **Implementation/docs wire the pre-mint guard and truthful failure reporting.** Files: new
   release tools, canary workflow, bump scanner, release skill, run artifacts. Gates: focused tests,
   workflow/static wrappers, release readiness/dry-run and JSR/dependency gates selected below.
4. **Generator gate and self-inspection evidence.** Files: run artifacts and PR evidence only.
   Gate: the complete selected generator set; no IMPL-EVAL verdict.

## Risk register

- JSR API shape or authorization changes: strict schema validation and fail-closed diagnostics.
- Budget race between check and publish: workflow concurrency plus full-member headroom minimizes
  it; the guard promises preflight sufficiency, not a registry transaction.
- Already-published same-version members during republish: pre-mint guard applies only to new
  canaries; existing identical-tree recovery retains its established contract.
- False residue positives/performance: restrict to generated TS names, retain exclusions, measure
  focused scan elapsed time.
- Misclassified registry propagation: outcome reporting runs only after publish failure and names
  the observed exact member set; it never writes a green pair.

## Selected gates

- Focused: new budget/outcome tests, `bump-version_test.ts`, and canary workflow contract tests.
- Wrapper evidence: scoped check/lint/fmt for `.llm/tools/release` and `.llm/tools/deps` TypeScript.
- Release: `publish:readiness`, `publish:dry-run`, release preflight test surface, workflow contract
  tests, and generated publish-asset freshness where relevant. No real publish.
- Dependency/JSR: repository `deps:audit` wrapper and applicable JSR publication-safety audit;
  package doc-lint is N/A because no package public surface changes.
- Full CLI runtime E2E: N/A unless current-head CI shows the changed release-tooling surface reaches
  it; this PR does not alter scaffold/runtime output.

## Deferred scope

W1-B, W1-C, Billing Run, changed-package publication, release dispatch/publication, orchestration
machinery, and any foreign worktree are excluded.
