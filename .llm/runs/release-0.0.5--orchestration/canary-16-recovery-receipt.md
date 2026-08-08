# Canary.16 recovery receipt

## Recovery boundary

- `v0.0.5-canary.15` was published completely but its pinned production E2E run
  [31196896495](https://github.com/rickylabs/netscript/actions/runs/31196896495) failed on two
  connected generated-scaffold assumptions. The immutable tag/package/release was not changed or
  reused.
- Focused repair PR [#1346](https://github.com/rickylabs/netscript/pull/1346) passed its separate
  DeepSeek V4 Flash 0731 max IMPL-EVAL, all current-head CI including both runtime scaffold lanes,
  the acceptance mirror, close gate, and review-thread gate. It squash-merged to `main` as
  `fac9e339042c5394bf882311657d8981d353a1c3` and auto-closed #1345. Both are
  `status:shipped`.
- Deferred installed-consumer observation remains isolated in
  [#1343](https://github.com/rickylabs/netscript/issues/1343), open in milestone 0.0.6 with
  `status:triage`.

## Green release pair

- Fresh parent dispatch: [run 31201279314](https://github.com/rickylabs/netscript/actions/runs/31201279314),
  `canary 0.0.5 from main`, exact source
  `fac9e339042c5394bf882311657d8981d353a1c3`, terminal success.
- JSR publish-attempt budget preflight passed before minting. Publish readiness, package existence,
  dry run, real graph-build preflight, production publish, payload labeling/drift, child dispatch,
  child wait, ephemeral-branch deletion, and green-pair recording all passed.
- Exact version: `0.0.5-canary.16`. Repo-native exact-version registry verifier returned
  `complete`, 35 published packages, zero missing.
- Annotated tag `v0.0.5-canary.16`: tag object
  `8d9bd82ad24157cf0bf4bcb9faead14fd9276261`, release commit
  `94feaea3b6ece86bf44d9de7229c20ee7ad40e35`, tree
  `a1df63793c3938e6c4ccf3fd4fd3efc6d5f715b2`, sole parent
  `fac9e339042c5394bf882311657d8981d353a1c3`.
- GitHub prerelease:
  [NetScript 0.0.5-canary.16](https://github.com/rickylabs/netscript/releases/tag/v0.0.5-canary.16),
  published `2026-08-07T17:16:52Z`, non-draft prerelease.
- Exact pinned production E2E:
  [run 31201560939](https://github.com/rickylabs/netscript/actions/runs/31201560939), tag ref
  `v0.0.5-canary.16`, exact head `94feaea3b6ece86bf44d9de7229c20ee7ad40e35`, terminal success.
  JSR propagation, published CLI installation, public init, full one-pass scaffold runtime, and the
  seven-verdict quickstart walk all passed; evidence artifact upload passed.
- Source status `release/canary-pair` is success with description
  `Canary 0.0.5-canary.16 publish + pinned production E2E passed` and targets the pinned child run.

## Hygiene

- PR #1346 and issue #1345 carry exactly one lifecycle label, `status:shipped`, plus
  `canary:0.0.5-canary.16`; milestone remains 0.0.5.
- W1-B PR #1342 and issues #1024/#1328 remain merged/closed, `status:shipped`, milestone 0.0.5.
  The publication-dependent external-checkout observation is not duplicated and remains #1343.
- Coordination root `deno.lock` remains at protected SHA-256
  `1c4d59cc38c00742997d3c20dc39ae79b7966891422969b7b444d76642d0ccc1`; release and repair
  worktree locks remain at
  `d32ef0c1f2b9256e05cf7339c452bd8cf6addeb9a4b433d38abcee992651b529`.
- Quarantined/foreign worktrees were not cleaned, reused, or modified. OpenHands was not invoked.
  Billing Run was not started.
