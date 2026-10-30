# Worklog — 0.0.9 milestone run

## step-0
- 2026-10-30 22:25Z: brief, plan and Cockpit handover read. Prior launches on #2474 (mc009, mc009b, mc009c) never started; this is the first live coordinator run.
- Baseline main `30c800958dbf512a4951d640f08748703a8b59e3`. Board snapshot: milestone 0.0.9 has 73 open issues = 53 in scope + 19 `epic:design-system` + #2474. Open PRs in scope: #2421, #2422, #2423 (#2396), #2408 (#2406, Fresh UI lane), #2424 and #2433 (no linked issue).
- Main health: `ci` green; repo-wide "Code quality" red since #2469 (PR runs use the diff-scoped job, which is green, so PR CI is unaffected); `command-postgres` red (H01 #2438).
- Dispatch preconditions: builder cap 5 and ≤ 6 launches/h (owner brief); routing per owner brief (Codex gpt-6.1-sol implementers, Opus 5.5 cross-family evaluators), consistent with the pinned matrix `feature` tier (SOL xhigh). Paid-transport check: implementers run on the Codex subscription through orchid; evaluators on the Claude subscription CLI.
- 22:30Z: intake (53 include + #2465 defer), inventory (53 active), DAG (53 nodes, 8 requires edges, 7 waves) and cluster state written; render + validate with live PR export: `{"ok": true, "errors": [], "findings": []}`.
- 22:35Z: owner via Cockpit: dates approved as deadlines; start dispatching now; post canary readiness the moment a canary is ready.
- 22:37Z: dispatched #2438 (H01). 22:38Z: dispatched #2165, #2187 (A1, split by file ownership), #2144 (A3), #2396 (D1, adopts #2421–#2423).
- 22:44Z: #2438 and #2165 started (orchid binding `state=started`, codex gpt-6.1-sol). Dispatch comments are granted without owner action (`approval: bypass`).
- 22:45Z: PLAN-EVAL round 1 (Codex gpt-6.1-sol high; `receipts/plan-eval-1.md`): **CHANGES**, 4 blockers. (0) The first attempt ran in Codex's read-only sandbox, which cannot start on this host (bwrap namespaces), and inspected nothing (`receipts/plan-eval-0-sandbox-failed.md`). The rerun used no sandbox and read-only-by-prompt instructions; git status was clean afterwards.
  1. CI skips drafts and e2e-cli needs `e2e-cli-gate`, so "keep draft" deadlocks merge. Fixed: brief template and addenda now say mark ready after a clean IMPL-EVAL, and the coordinator arms `e2e-cli-gate` one PR at a time.
  2. #2108 and #2390 were not gated on all of B1. Fixed: edges from #2159, #2374 and #2382 to both; both moved to W7.
  3. #2268 needs `packages/**` changes, which the docs lane forbids. Fixed: #2268 and #2269 moved to internals.
  4. #2144 retry semantics. Fixed: one initial attempt plus `maxRetries` retries, zero-retry case; DLQ proof conditional on slice 2.
  Addenda posted on #2438, #2165, #2187, #2144 and #2396 (`briefs/<n>.addendum-1.md`); they are reposted on each leaf PR once it exists, since orchid relays PR comments. Validator green.
- 22:48Z: #2438 → PR #2476 (draft), #2165 → PR #2477 (draft); addenda reposted on both PRs; leaves recorded (implementing). Validator green.
- 22:58Z: PLAN-EVAL round 2 (`receipts/plan-eval-2.md`): round-1 blockers 1–4 RESOLVED. New blockers: #2151 conditional native-only proof, and #2159 crash-safe atomic commit (release-on-failure is not crash-safe). Both repaired in flight in the unposted briefs, plus #2161 doctor/fixture notes and the merge-gate E2E note. Plan APPROVED with in-flight repair (feature-tier policy).
