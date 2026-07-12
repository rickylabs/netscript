# Drift Log: #754 deeper type-erasure elimination tail

## 2026-07-12 — Owner-authorized no-PR harness variant

- **What:** No draft PR or per-slice PR comments will be created.
- **Source:** Slice identity ground rule: “Do NOT open PRs.”
- **Expected:** Harness V3 normally uses a draft PR as the commit trail.
- **Actual:** Local commits, pushed branch state, worklog, and evaluator artifacts are the trail.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` recorded override.

## 2026-07-12 — Remote target branch absent

- **What:** `origin` did not advertise `refs/heads/quality/q754-tail-h` during preflight.
- **Source:** `git ls-remote` / fetch attempt.
- **Expected:** Slice brief described a prior pushed attempt to supersede.
- **Actual:** Rejected commit was only recoverable as unreachable local object `f656c0ca`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** final push will create or update the owner-specified ref with force-with-lease.

## 2026-07-12 — Fresh UI test permission correction

- **What:** The package test task now grants read-only filesystem access.
- **Source:** `tests/ai/render-ui.test.tsx` reads its source fixture with `Deno.readTextFile`.
- **Expected:** The baseline `deno task test` should exercise all package tests successfully.
- **Actual:** The baseline task failed only on the missing permission; `--allow-read` is the narrow
  permission required by that existing test and leaves network, environment, write, and run access
  denied.
- **Severity:** minor
- **Action:** accept and keep the correction in the slice so the mandated package test gate is real.
- **Evidence:** independent slice review reproduced baseline failure and 133/133 success with the
  scoped permission.
