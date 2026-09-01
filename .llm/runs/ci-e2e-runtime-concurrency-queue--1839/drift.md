# Drift Log: e2e-cli runtime concurrency queue

Drift is append-only.

## 2026-08-31 — Owner-controlled evaluation handoff

- **What:** This implementation session will not run IMPL-EVAL or transition the draft PR to ready.
- **Source:** Owner directive in the slice brief.
- **Expected:** Harness normally requires a separate-session IMPL-EVAL before close.
- **Actual:** The owner explicitly retained IMPL-EVAL, label-after-opening, and ready-transition ownership.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`; slice brief.

## 2026-08-31 — RTK unavailable on implementation host

- **What:** The repository's preferred `rtk` command is not installed/on `PATH` in this session.
- **Source:** `rtk ls .llm/harness/templates` returned `command not found`.
- **Expected:** `.agents/skills/rtk/SKILL.md` states a machine-level binary is present.
- **Actual:** Raw focused shell reads are required; authoritative exits will still be captured directly.
- **Severity:** minor
- **Action:** accept
- **Evidence:** bootstrap command output; no product/runtime behavior affected.

## 2026-08-31 — Workflow-scope push credential fallback

- **What:** The first explicit-refspec implementation push was rejected because the active HTTPS
  PAT lacks GitHub's `workflow` scope; the configured SSH transport also has no key.
- **Source:** `git push origin HEAD:refs/heads/ci/e2e-runtime-concurrency-queue` exit 1; SSH
  `git ls-remote` exit 128.
- **Expected:** Push the workflow and evidence commit together through the requested refspec.
- **Actual:** The installed GitHub connector wrote the exact validated workflow content as
  `e74f8bdc6`; local evidence was rebased onto it (exit 0), leaving only non-workflow evidence for
  the explicit-refspec retry.
- **Severity:** minor
- **Action:** accept
- **Evidence:** remote workflow commit `e74f8bdc6`; worklog push ledger.

## 2026-09-01 — Generic simulation does not satisfy exact runtime acceptance

- **What:** The standalone no-op simulation was originally described as satisfying the issue's
  three-arrival acceptance, but it proves only the GitHub queue primitive generally.
- **Source:** Owner audit ruling on PR #1846.
- **Expected:** The original owner brief directed simulation and treated the issue's “or simulate”
  wording as permitting a generic no-op proof.
- **Actual:** Acceptance box 1 requires three PRs carrying `e2e-cli-gate` to execute both modified
  runtime tiers to real conclusions; boxes 2, 3, and 5 require corresponding actual-job timestamp,
  actual-PR head, and run/job evidence.
- **Severity:** material evidence-scope correction; implementation design is unchanged.
- **Action:** Rewrite current evidence claims in place, retain the simulation as general mechanism
  evidence, prepare the exact procedure, and defer its execution until explicit owner release after
  the Aspire runtime queue drains.
- **Evidence:** `simulation-evidence.md`; `exact-runtime-proof-procedure.md`; owner audit ruling.
- **Evaluation currency:** The owner-controlled separate-session IMPL-EVAL targets
  `a8f3f9e81`; this later artifact correction is not covered by that exact-head evaluation.
