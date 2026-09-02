# Drift Log: PR 1664 convergence

## 2026-09-02 — non-generated Fresh package-config conflict

- Severity: significant for evaluated-head carry; no scope expansion.
- Expected: convergence conflicts concentrated in generated carriers.
- Observed: `packages/fresh/deno.json` also conflicted because the evaluated branch registers the
  query-hydration browser fixture while current `main` adds the `./navigation` subpath and its
  check/doc-lint surfaces and updates dependency pins.
- Resolution: retained both independently authored changes. No behavioral implementation was
  added or altered by this convergence slice.
- Consequence: six branch-touched non-generated package files differ from evaluated head
  `377811da8` due to intervening `main` commits. The prior IMPL-EVAL PASS cannot be claimed as a
  byte-identical carry; the converged head needs fresh evaluation.

## 2026-09-02 — inherited run-artifact whitespace

- Severity: informational; attributable to `main`.
- `git diff --cached --check` over the complete merge reports trailing/new-EOF whitespace in
  unrelated `.llm/runs/**` artifacts introduced by `main`.
- The convergence slice does not rewrite those historical artifacts. A scoped diff check over the
  two conflict resolutions and this run's three updated artifacts is the applicable hygiene check.

## 2026-09-02 — CLI wrapper coverage refusal inherited from main

- Severity: gate-attribution note; no scope expansion.
- The exact requested CLI lint/fmt wrapper commands exit 2 because root `deno.json` excludes
  `packages/cli/`; they report zero findings but drop 733 of 930 selected files.
- A clean detached checkout of `origin/main` reproduces the same refusal (723 of 915 files dropped),
  proving it is not introduced by this branch. The result is reported as red rather than weakened
  or relabeled as a pass.
