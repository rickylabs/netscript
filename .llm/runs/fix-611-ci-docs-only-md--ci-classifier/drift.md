# Drift Log: #611 CI Markdown-only classifier

## 2026-07-11 — milestone mapping follows current repository roadmap

- **What:** PR #613 uses milestone `0.0.1-beta.7`.
- **Source:** live milestone list queried during PR bootstrap.
- **Expected:** the PR skill names `0.0.1-beta.1` as its beta milestone example/target.
- **Actual:** `0.0.1-beta.1` is absent; current open beta milestones start later, and #611 was filed during beta.6 wrap-up, so the next beta is `0.0.1-beta.7`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** PR #613 milestone and `gh api repos/rickylabs/netscript/milestones`.
