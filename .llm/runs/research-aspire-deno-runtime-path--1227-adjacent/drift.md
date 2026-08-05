# Drift Log: Aspire Deno runtime / NuGet dependency research

Drift is append-only.

## 2026-08-05 — Owner route, D6 evaluation composition, and branch override

- **What:** The run uses OpenAI GPT-5.6 Sol at xhigh, does not launch a local formal PLAN-EVAL, and
  uses the owner-specified `research/` branch prefix.
- **Source:** Owner brief; `.llm/harness/workflow/milestone-run.md`; `netscript-pr` branch rules.
- **Expected:** Canonical extraction/default branch rules and normal per-run PLAN-EVAL.
- **Actual:** The owner explicitly supplied the route, D6 waiver, and exact branch.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`, `plan.md` D6–D7, `plan-eval.md`.

## 2026-08-05 — Inherited lock-file change excluded

- **What:** `deno.lock` was already modified when the run activated.
- **Source:** Raw `git status --short --branch` at bootstrap.
- **Expected:** Clean baseline at `origin/main`.
- **Actual:** HEAD equals `origin/main`, with an unrelated modified lock file.
- **Severity:** minor
- **Action:** accept and preserve
- **Evidence:** `worklog.md` bootstrap entry; raw status before commit.

## 2026-08-05 — Corrected upstream repository and live thread

- **What:** The opening brief pointed to stale issue context and was corrected to `microsoft/aspire`
  PRs #18627/#18628 against milestone 13.5.
- **Source:** Owner correction and live upstream PR metadata/reviews.
- **Expected:** Historical issues #15119/#16220 as the principal capability signal.
- **Actual:** They are context only; the two open owner-authored PRs are the live capability work.
- **Severity:** material research rebaseline; no product-scope change
- **Action:** accept; read both PRs and current review discussion in full.
- **Evidence:** `research.md` section 5.

## 2026-08-05 — Source comment contradicted by execution

- **What:** An external Toolkit package exports into the 13.4.6 TypeScript SDK and runs.
- **Source:** Isolated Toolkit restore, generated module inspection, and live resource wait.
- **Expected:** Local comment says external NuGet exports are skipped.
- **Actual:** `addDenoApp` and related methods generated; resource reached running.
- **Severity:** material existing documentation drift
- **Action:** record only; scaffold/source correction remains outside this research slice.
- **Evidence:** `research.md` sections 1–2.
