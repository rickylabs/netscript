# Context pack — ci-scope-expensive-jobs--1152

**State**: plan written, awaiting PLAN-EVAL. No implementation slices landed.

- Branch `ci/scope-expensive-jobs` (base `origin/main`), worktree `/home/codex/repos/ns-ci-scope`.
- #1151 already shipped separately: PR #1153, verified by run 30825776156 (docs-only demo →
  desktop skipped-by-policy). Not part of this run's remaining scope.
- Read order to resume: `supervisor.md` → `research.md` → `plan.md` (D1–D5 decisions, S1–S6
  slices, open questions 1–4).
- Next actions: (1) dispatch PLAN-EVAL on the open-model evaluator lane; (2) on PASS, implement
  S1→S6 sequentially on this branch, one commit+push+PR comment per slice; (3) before/after
  measurement posted on #1152.
- Hard constraints: label set frozen (`ci:full`/`ci:skip-scaffold`/`ci:skip-e2e`), skipped jobs
  still report, unrecognised path ⇒ whole vector true, no routing tables in YAML, no
  docker/scaffold runs from this shared machine.
