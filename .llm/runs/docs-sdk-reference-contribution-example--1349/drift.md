# Drift Log: SDK reference contribution example

## 2026-09-02 — README contribution count increased

- **What:** `packages/sdk/README.md` contains 18 case-insensitive contribution matches, not the carried-in 14.
- **Source:** `grep -ci contribution packages/sdk/README.md`.
- **Expected:** 14 matches and coverage complete.
- **Actual:** 18 matches and coverage remains complete.
- **Severity:** minor.
- **Action:** accept; do not edit the README.
- **Evidence:** re-baseline count recorded in `research.md`.

## 2026-09-02 — Owner-specified PR opening mode

- **What:** This run will open the completed PR non-draft rather than use the harness draft-at-bootstrap default.
- **Source:** Owner task contract under `PR contract`.
- **Expected:** Harness defaults to a draft PR at the first commit.
- **Actual:** Owner requires a non-draft PR with all metadata in the same creation action.
- **Severity:** minor.
- **Action:** accept the explicit owner override; open only after gates and metadata are complete.
- **Evidence:** task prompt and `plan.md`.

## 2026-09-02 — RTK unavailable

- **What:** The repository-preferred `rtk` executable is not available in this shell.
- **Source:** `rtk proxy deno task docs:snippets` exited 127 (`command not found`).
- **Expected:** Wrap Deno task output with `rtk proxy` for exploratory compression.
- **Actual:** Gates run directly and their raw process exit codes are authoritative.
- **Severity:** minor.
- **Action:** accept for this run; do not substitute filtered output for evidence.
- **Evidence:** `worklog.md` records each raw command and result.

## 2026-09-02 — Authoring correction

- **What:** The authoring lane's first example used `@orpc/server` rather than the required contract entrypoint.
- **Source:** First Antigravity response and supervisor diff review.
- **Expected:** A small contract built from `oc.route` and Zod as locked in `implement.md`.
- **Actual:** The same session corrected the page before any gate or commit; final snippet uses `@orpc/contract` and compiles.
- **Severity:** minor.
- **Action:** fix.
- **Evidence:** `docs/site/reference/sdk/index.md`; `deno task docs:snippets` exit 0.

## 2026-09-02 — Reference heading differs from guide terminology

- **What:** The final heading is `Client contributions (SdkClientContribution)`, not the plan's shorthand `Typed request contributions`.
- **Source:** Evaluator comparison of `plan.md` with the reference page and guide page.
- **Expected:** Reuse the guide section label as a planning locator.
- **Actual:** The reference uses its symbol-oriented heading convention and avoids duplicating the guide heading.
- **Severity:** minor.
- **Action:** accept; the content contract is unchanged.
- **Evidence:** `docs/site/reference/sdk/index.md`; `evaluate.md` low finding.

## 2026-09-02 — Reference page is outside the snippet gate floor

- **What:** `deno task docs:snippets` passes but does not compile `reference/sdk/index.md` because the page is outside `TIER_1_PAGES`.
- **Source:** Separate-session evaluator inspection of `.llm/tools/docs/snippet-policy.ts` and gate census.
- **Expected:** The broad gate's exit 0 would directly prove the new fence compiles.
- **Actual:** The evaluator ran the same docs snippet compiler/config scoped to this page; it exited 0 with the root lock unchanged.
- **Severity:** minor.
- **Action:** accept for this docs-only slice and cite the scoped compile honestly; a tier-floor change is optional follow-up tooling scope.
- **Evidence:** `evaluate.md`, Static Gates → `Independent snippet compile`.
