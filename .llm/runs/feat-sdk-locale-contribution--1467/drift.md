# Drift log

## 2026-09-02 — reference implementation not on baseline

- Severity: minor, recorded baseline drift.
- Expected: bearer reference merged at
  `packages/plugin-auth-core/src/sdk/bearer-contribution.ts`.
- Observed: the file exists on `origin/feat/sdk-credential-contribution` at `fde87fe10`, but that
  commit is not an ancestor of required `origin/main` `77ad823dc`.
- Response: inspect the remote branch as a read-only reference; do not merge/cherry-pick it. Use an
  inline auth-shaped descriptor for composition/docs so this slice remains independently landable.

## 2026-09-02 — rtk unavailable

- Severity: informational.
- Expected: repository skill says `rtk` is installed.
- Observed: shell returned `rtk: command not found`.
- Response: use focused raw `rg`/`git`; retain structured wrappers/raw exit codes for verdicts.

## 2026-09-02 — CLI generated carriers are excluded from lint/fmt policy

- Severity: informational gate-policy drift.
- Expected: apply package wrapper check/lint/fmt to every package containing a changed carrier.
- Observed: the CLI check wrapper processed all 915 selected TypeScript files and exited 0. Root
  `deno.json` explicitly excludes `packages/cli/` from lint and fmt, so both whole-package wrappers
  exited 2 with zero findings after excluded batches; direct lint/fmt of the sole changed generated
  carrier returned `No target files found`. Passing `packages/cli/deno.json` explicitly did not
  override the workspace policy.
- Response: do not edit unrelated CLI policy. Record the real exit codes and use the mandated
  post-commit `check:assets-barrel` generator/diff check as the authoritative carrier verdict.
