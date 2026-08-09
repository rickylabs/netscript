# Worklog: #1379

## Design

- **Public surface:** no export or product API change; one CI workflow and package/root tasks.
- **Domain vocabulary:** lock policy is `frozen-private-lock`; verdicts are check, lint,
  frozen-lock regression, and clean tree.
- **Ports:** Deno 2.9.5 native `--frozen`, scoped wrapper scripts, Git, and GitHub Actions.
- **Constants:** package root is `packages/fresh-ui`; private lock is
  `packages/fresh-ui/deno.lock`.
- **Commit slices:** S0 research/plan/draft PR; S1 gate, negative controls, full evidence.
- **Deferred scope:** root-lock migration, registry/gallery sync, #1378 quality-scan expansion,
  CLI lint coverage.
- **Contributor path:** update package sources normally; the path-filtered job invokes the same
  package tasks available locally and rejects stale locks or a dirty worktree.

## Progress

- Clean branch created from `origin/main@2e7c845ad`; upstream unset.
- Live issue read in full; ten acceptance rows recorded.
- Current mutable check and native frozen failure reproduced; research mutation restored explicitly.
- `PLAN-EVAL: N/A` recorded before implementation because frozen-private-lock is empirically
  selected and no material design decision remains.

## S1 implementation evidence

### Negative controls

| Control | Result |
| --- | --- |
| Broken `registry.ts` type | expected RED, raw exit 1; `TS2322`, number not assignable to string, line 9 |
| `debugger` lint mutation | expected RED, raw exit 1; `no-debugger`, line 9 |
| Stale private-lock mutation | expected RED, raw exit 1; 2/2 frozen check batches failed |
| Lock mutation integrity | PASS; mutated SHA-256 remained `064ea1c2…` before and after the failed check |
| Frozen-lock fixture regression | PASS, raw exit 0; child Deno check rejected stale lock and fixture bytes remained equal |

Both source mutations were restored explicitly from `HEAD`. The lock mutation was reversed with an
exact patch because the refreshed lock is intentional S1 content and differs from `HEAD`.

### Green gates

| Gate | Result |
| --- | --- |
| Frozen package check | PASS, raw exit 0; 150 files / 2 batches / 0 findings |
| Package lint | PASS, raw exit 0; 150 files / 1 batch / 0 findings |
| Package scoped format | PASS, raw exit 0; 150 files / 1 batch / 0 findings |
| Frozen-lock regression | PASS, raw exit 0; 1 passed / 0 failed |
| Regression-file scoped check | PASS, raw exit 0; 1 file / 0 findings |
| Regression-file scoped lint | PASS, raw exit 0; 1 file / 0 findings |
| Regression-file scoped format | PASS, raw exit 0 after owned-file formatting |
| Root `deno task check` | PASS, raw exit 0; 2,843 files / 24 batches / 0 findings |
| Root `deno task lint` | PASS, raw exit 0; 2,009 files / 11 batches / 0 findings |
| Root `deno task fmt:check` | PASS, raw exit 0; 2,009 files / 11 batches / 0 findings |
| `quality:scan` | PASS, raw exit 0; no findings / 7 existing allowances |
| `arch:check` | PASS, raw exit 0; existing repository warnings only |

The refreshed private lock changes by 197 insertions / 61 deletions and has SHA-256
`79097acf20de876869f065809f208e721e817a7e198734d180fad085bde5754b`. Root `deno.lock` is
unchanged. The package `lock:update` task names the sole intentional regeneration path; the CI
failure message tells contributors to review the diff before committing it.

### Committed-head CI sequence

At S1 commit `dce857a4d`, the exact workflow commands returned:

- before `git status --porcelain`: empty;
- frozen package check: raw exit 0, 150 files / 2 batches;
- package lint: raw exit 0, 150 files / 1 batch;
- frozen-lock regression: raw exit 0, 1 passed / 0 failed;
- after `git status --porcelain`: empty;
- combined CI sequence: raw exit 0.

This is the decisive rows 1–5 receipt: the job runs both source gates, native frozen behavior
rejects rewrites, and successful execution leaves the entire worktree unchanged.

### Reconcile

Issue #1379 remains open at `status:impl`; draft PR #1426 carries `Closes #1379`, milestone 0.0.5,
the explicit frozen-private-lock policy, and exactly one status label. No boundary issue or new
doctrine debt was found.

Final reconcile moves issue and PR to `status:impl-eval` after this evidence commit. The PR remains
draft; the milestone owner owns separate-session evaluation, readiness, CI, and merge.
