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
