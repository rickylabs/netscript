# Drift Log: #1249 form control props and Zod 4 constraints

Drift is append-only. No divergence has been observed yet.

## 2026-09-02 — Explicit deferred follow-ups and exclusive-bound mapping

- **What:** `@netscript/fresh-ui` narrowing-helper cleanup and docs-site prose simplification remain deferred; exclusive Zod numeric bounds will not be emitted as native `min`/`max`.
- **Source:** Owner implement brief; HTML inclusive bound semantics; `plan.md` D2.
- **Expected:** The brief excludes Fresh UI/docs-site changes and requires an explicit, non-off-by-one exclusive-bound decision.
- **Actual:** The plan keeps those files outside the ceiling and maps only checks whose `inclusive` flag is true.
- **Severity:** minor
- **Action:** defer
- **Evidence:** `plan.md` Locked Decisions and Deferred Scope.

## 2026-09-02 — RTK unavailable in the generator environment

- **What:** The repo-preferred `rtk` executable is not present on `PATH`.
- **Source:** `rtk proxy deno task deps:why zod` and `rtk rg ...` returned exit 127.
- **Expected:** The repository skill describes machine-level RTK availability.
- **Actual:** The generator used raw focused reads and the authoritative structured validation wrappers instead.
- **Severity:** minor
- **Action:** accept
- **Evidence:** No verdict relies on filtered RTK output; all gate evidence is wrapper-sourced.
