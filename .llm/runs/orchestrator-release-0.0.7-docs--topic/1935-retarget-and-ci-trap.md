# #1935 — squash reconciliation and the stacked-base CI trap

## #1925 merged; the stack needed reconciling

Coordinator squash-merged #1925 into `main` `25a026c0e` at 13:57Z. #1924 auto-closed
`COMPLETED` / `status:shipped` — the closing keyword and the acceptance mirror both worked.

Because it was a **squash**, `d0fa4ffea` is not an ancestor of `main`, so #1935's branch still
carried #1925's original commits and its three-dot diff against `main` re-showed 446 insertions of
content `main` already had. Merging `origin/main` produced exactly two `add/add` conflicts, both on
files where this branch holds the strictly newer version.

Resolved by keeping this branch's copy — then **verified line-by-line against `origin/main`'s copy**
rather than trusting the resolution. Every difference is one of the intended ceiling changes
(`tsLike` 72→73, `checked` 71→73, `syntaxInvalid` 1→0, `failingReadmes` 7→5, `typeErrors` 32→7, plus
the header note and the matching test expectations). Nothing `main` carried was dropped. This is the
same wholesale-restore class that near-missed five times earlier in the milestone; the check is what
makes taking `--ours` safe, not the resolution itself.

All 7 PR-owned files are byte-identical (sha256) between the evaluated head `25ecb5ee7` and the
current head `62b848e51`, so the running IMPL-EVAL carries forward without a re-run.

## The trap: a stacked base silently disables required CI

#1935 was opened with `--base docs/readme-fence-gate`. `ci.yml` triggers on

```yaml
pull_request:
  branches: [main, 'feat/**', 'epic/**', 'canary/**']
  types: [opened, synchronize, reopened, ready_for_review]
```

A leaf-branch base matches **no** branch filter, so `ci` — `check-test`, `quality`, `close-gate` —
**never ran**. GitHub still reported the PR `MERGEABLE / CLEAN`, because "clean" means no conflicts,
not "gates passed", and the push-triggered workflows populated the checks list convincingly enough
to look normal.

Retargeting to `main` did not fix it either: a base change emits `pull_request: edited`, which is
not in `types`. A **new head** is required to fire `synchronize`. Amending the merge commit with a
proper message did it — no fake commit needed. `ci` run created immediately after.

**Had this gone unnoticed, a merge packet would have been handed for a PR that nothing had
checked.** Recorded as a durable lesson: whenever a PR's base is not `main`, or has been retargeted,
confirm a `ci` run exists for the exact head via
`gh api "repos/<repo>/actions/runs?head_sha=<sha>"` before trusting any check summary.

## State

| | |
| --- | --- |
| head | `62b848e51` |
| base | `main` (retargeted) |
| diff vs main | exactly the 7-file repair, +69 / −22 |
| gate | `PASS … syntax_invalid=0 type_errors=7 failing_readmes=5` |
| tests | `readme-fence-policy_test.ts` 6/0, `readme-fence-workflow_test.ts` 2/0 |
| IMPL-EVAL | running, GLM 5.3 Flash `max`, evaluated head `25ecb5ee7` (content-identical) |
