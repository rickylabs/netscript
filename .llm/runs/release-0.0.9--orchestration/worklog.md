# Worklog — 0.0.9 milestone run

## step-0
- 2026-10-30 22:25Z: brief, plan and Cockpit handover read. Prior launches on #2474 (mc009, mc009b, mc009c) never started; this is the first live coordinator run.
- Baseline main `30c800958dbf512a4951d640f08748703a8b59e3`. Board snapshot: milestone 0.0.9 has 73 open issues = 53 in scope + 19 `epic:design-system` + #2474. Open PRs in scope: #2421, #2422, #2423 (#2396), #2408 (#2406, Fresh UI lane), #2424 and #2433 (no linked issue).
- Main health: `ci` green; repo-wide "Code quality" red since #2469 (PR runs use the diff-scoped job, which is green, so PR CI is unaffected); `command-postgres` red (H01 #2438).
- Dispatch preconditions: builder cap 5 and ≤ 6 launches/h (owner brief); routing per owner brief (Codex gpt-6.1-sol implementers, Opus 5.5 cross-family evaluators), consistent with the pinned matrix `feature` tier (SOL xhigh). Paid-transport check: implementers run on the Codex subscription through orchid; evaluators on the Claude subscription CLI.
- 22:30Z: intake (53 include + #2465 defer), inventory (53 active), DAG (53 nodes, 8 requires edges, 7 waves) and cluster state written; render + validate with live PR export: `{"ok": true, "errors": [], "findings": []}`.
- 22:35Z: owner via Cockpit: dates approved as deadlines; start dispatching now; post canary readiness the moment a canary is ready.
- 22:37Z: dispatched #2438 (H01). 22:38Z: dispatched #2165, #2187 (A1, split by file ownership), #2144 (A3), #2396 (D1, adopts #2421–#2423).
