# Drift Log: #611 CI Markdown-only classifier

## 2026-07-11 — milestone mapping follows current repository roadmap

- **What:** PR #613 uses milestone `0.0.1-beta.7`.
- **Source:** live milestone list queried during PR bootstrap.
- **Expected:** the PR skill names `0.0.1-beta.1` as its beta milestone example/target.
- **Actual:** `0.0.1-beta.1` is absent; current open beta milestones start later, and #611 was filed during beta.6 wrap-up, so the next beta is `0.0.1-beta.7`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** PR #613 milestone and `gh api repos/rickylabs/netscript/milestones`.

## 2026-07-11 — requested status label is not in the repository taxonomy

- **What:** The brief requests `status:in-progress`, but the namespaced repository taxonomy contains no such label.
- **Source:** `.github/labels.yml` and `.agents/skills/netscript-pr/SKILL.md`.
- **Expected:** PR label `status:in-progress`.
- **Actual:** The canonical harness lifecycle uses `status:impl` during implementation, `status:impl-eval` during evaluation, and `status:ready-merge` after IMPL-EVAL PASS.
- **Severity:** minor
- **Action:** accept; follow the canonical single-status lifecycle rather than inventing a new label.
- **Evidence:** PR #613 phase comments/label history and `evaluate.md` PASS.
