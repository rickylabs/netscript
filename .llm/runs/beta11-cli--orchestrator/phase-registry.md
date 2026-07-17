# Phase Registry — beta11-cli--orchestrator

Live status of milestone-13 phase groups. Statuses: `pending` → `active` → `impl-done` →
`eval-pass` → `merged`. GitHub wins on conflict.

| Group | Issue(s) | Branch | Wave | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| G1 | #826 | `fix/826-aggregate-health` | 1 | merged | PR #847 · IMPL-EVAL PASS · awaiting CI-green merge · thread 019f720b-8290-7542-975e-fcac3f562dc7 · wt-g1-826 · Sol·low |
| G2 | #841 | `feat/desktop-frontend-841-autoupdate` | 1 | merged | into integration e6e1be08; #841 closes at wave PR (box 2 = #457) |
| G3 | #842 | `feat/desktop-frontend-842-bindings` | 1 | active | Sol·high plan-first · wt-g3-842 |
| G4 | #452 | `feat/desktop-frontend-452-generator` | 1 | merged | into integration f86a9191; #452/#375 close at wave PR · thread 019f720b-9692-7bd2-bd66-e43066365b88 · wt-g4-452 · Sol·medium · plan-first |
| G5 | #843 | `feat/desktop-frontend-843-ui` | 2 | pending | after G2 |
| G6 | #456 | `feat/desktop-frontend-456-packaging` | 2 | active | Sol·high plan-first · wt-g6-456 · Refs-only (closes at wave PR) |
| G7 | #457 | `feat/desktop-frontend-457-e2e` | 3 | pending | after G2+G6; Windows legs on owner host |
| G8 | #824 | `plan/unified-runtime` | 1 | active | stage A done; run dir plan-unified-runtime--seed; drafts-only until owner stage-H |
| G9 | #804 | `fix/804-dry-run-writes` | 1 | eval-pass | PR #852 merge loop running |
| G10 | #802 | `fix/802-plugin-cli-help` | 1 | merged | squash 8cc6b21a; #802 closed |
| G11 | #818 | `fix/818-min-dep-age-lockstep` | 2 | pending | direction (a)+docs |
| G12 | #814 | `docs/814-mcp-readme` | 2 | pending | doc-audit pipeline |
| G13 | #815 | `docs/815-package-readmes` | 3 | pending | after G12 |
| G14 | #816 | `docs/816-main-readme` | 4 | pending | may slip to beta.12 (owner note) |

Integration branch `feat/desktop-frontend` (G2–G7 sub-PRs target it); everything else PRs to
`main`. Concurrency cap: ≤3 active Codex groups.
