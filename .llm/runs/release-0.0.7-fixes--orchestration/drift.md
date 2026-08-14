# Drift — release 0.0.7 fixes topic

No implementation or scope drift is accepted.

## 2026-08-15 reset reconciliation — no drift found

The Claude replacement topic orchestrator verified both leaf worktrees, both draft PR heads
(`gh pr view 1643/1654 --json headRefOid,state,isDraft,mergeable`), and local `git log`/`git
status` against coordinator `briefs/reset-gates/dispatch.json` and this session's exact brief.
Legacy leaf head `e6ba15ec6414c0a42b1f9870791131162ea71c36` (dispatch order 2) and scaffold leaf
head `14d8b38b4db7ba0635cbbcac2f8cd8903bee0ec9` (dispatch order 5) match exactly; both worktrees
are clean; both PRs are open/mergeable at those heads. No fact differs from the central dispatch
set, so nothing is reported to the coordinator as drift.

## Observed metadata inconsistency (non-blocking for this lane)

The frozen dependency DAG node for #1360 still says `lane: fixes`, while the approved plan, topic
issue allocation, leaf contract, and grouped `app-service-client-wiring` leaf assign #1360 to
`features`. The fixes authority list excludes #1360, so this topic leaves it untouched and does not
mutate central state. The coordinator should reconcile the generated DAG metadata when it next owns
a central state transition.

## Significant — #1243 contract is stale on current main

The approved `legacy-port-pin-sweep` surface says the manifest and official-copy fixture pins are
dead/mechanically removable. The first focused structured test proved the shared manifest schema
still requires `backgroundPort`, atomically validates the service triple, and official-copy
compatibility consumes the values. The viable fail-loud CLI change also requires
`auth-plugin-command_test.ts`, which is outside the contract. No product change was committed;
draft PR #1643 is clean/paused at `f3cf40909`. Coordinator replacement-contract or disposition
authority is required before the same thread resumes.

## Significant — scaffold generator seams omitted from frozen contract

The grouped scaffold leaf reproduced the three approved behavior gaps, except that current main
already projects OpenAPI 404 responses for the #1263 operations. That stale sub-symptom is handled
by the approved regression-test fallback; runtime not-found behavior remains red. The bounded
implementation needs `generate-prisma-config.ts` to select provider-specific helper fragments and
needs `scaffolder.ts` plus a new `generate-database-seed.ts` seam to emit model-aware or explicit
empty-schema seed output. Those generator surfaces are absent from the frozen contract. No product
change was committed; draft PR #1654 is clean/paused at `42572af32`. A coordinator amendment and a
separate PLAN-EVAL are required before implementation resumes.
