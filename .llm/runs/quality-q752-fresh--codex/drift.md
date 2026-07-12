# Drift Log: properly type `packages/fresh`

## 2026-07-12 — Owner-directed local evidence trail

- **What:** Draft PR creation, PR comments, and GitHub reconcile mutations are omitted.
- **Source:** Owner directive: “Do NOT open PRs.”
- **Expected:** Default Harness V3 uses a draft-PR commit/comment trail.
- **Actual:** Run artifacts, separate local evaluator sessions, commits, and the pushed branch form
  the evidence trail.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`; this entry.

## 2026-07-12 — Archetype corrected during research

- **What:** Initial boundary inspection suggested an integration profile; doctrine inventory names
  `@netscript/fresh` as Archetype 4.
- **Source:** `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`.
- **Expected:** Select the smallest archetype from surface behavior.
- **Actual:** Package-level doctrine classification is Public DSL / Builder plus frontend overlay.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `plan.md`; no source implementation preceded the correction.

## 2026-07-12 — Structured doc-lint diagnostics recorded

- **What:** The canonical doc-lint runner exits successfully but records 25 diagnostics for the
  route implementation reference now exposed directly instead of hidden by a compatibility cast.
- **Source:** Slice acceptance requires `deno task doc:lint --root <pkg>` to be recorded; the
  repository wrapper treats diagnostics as structured evidence rather than a failing verdict.
- **Expected:** Baseline recorded zero diagnostics.
- **Actual:** 8 private-type references and 17 missing JSDoc entries are reported for the internal
  route contract surface; publish dry-run and slow-type validation remain green.
- **Severity:** minor
- **Action:** tracked under the existing `@netscript/fresh` Restructure verdict with a zero-route-
  diagnostics/no-new-allowances closing gate; do not restore a cast solely to hide the
  implementation type from documentation.
- **Evidence:** `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`; IMPL-EVAL;
  package publish dry-run.
