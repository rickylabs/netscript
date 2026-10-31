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
- 22:52Z: Cockpit relay: the #2187, #2144 and #2396 launches never started. The Cockpit hourly cap (6/h) held them as "Needs you" (hourly_cap_reached), and in-app approval is broken (cockpit #937). Plan: re-post each as a new `/swarm` comment with tag `mc009d-r1-<n>` after 23:40Z, spaced about 10 min apart, each after confirming no `state=started` binding. Relaunch briefs `briefs/<n>.r1.md` fold in addendum-1.
- 22:54Z: G1 Step 0 re-check. Correction or narrowing comments posted on #1364, #1655, #1667, #1668, #1912, #1366, #2068, #2185 and #2233 (texts in `receipts/g1-step0/`). Findings:
  - #1668: done.
  - #1364: done once a row is added to #1381.
  - #1667: evidence only; an opposite-family evaluator rules on boxes 1 and 3 (Codex run started).
  - #1655: 2 `doc:lint` findings left. Code leaf in W7.
  - #1912: published-CLI `--check` smoke on Windows and Linux.
  - #1366: box 6 crash-loop detection plus the box 4 decision. Boxes 5 and consumer proof to #429–#431 and #1343, pending Eric.
  - #2068: cold-consumer persistence/replay check on published 0.0.8.
  - #2185: a local-Docker `scaffold.runtime` run.
  - #2233: owner decision on box 1 vs box 6 (`MANIFEST.md`); the `status:impl` label is stale.
- 22:56Z: Re-intake checkpoint. Eric approved new leaf #2478 (H02, repo-wide Code quality red on main since #2469), filed directly into 0.0.9. Added to the intake (release-critical, owner-ratified), the inventory (internals, group H02), the DAG (W1) and cluster state; validator green.
  - Launch plan within the Cockpit hourly cap and the 5-builder cap: #2187-r1 at 23:40Z, #2478 about 23:50Z, #2144-r1 about 00:00Z, then #2396-r1 at the next free builder slot.
  - Before each post, confirm no `state=started` binding on that issue, and that the previous launch started.
- 22:58Z: #1667 and #1668 closed as completed after the opposite-family acceptance evaluation (Codex, `receipts/g1-step0/eval-1667-1668.md`, all boxes MET).
- 22:59Z: #2477 (#2165) PLAN-EVAL APPROVED (leaf's Opus evaluator); implementing.
- 23:00Z: #1364 closed as completed after the Codex acceptance evaluation (`receipts/g1-step0/eval-1364.md`); its observational Wave-7 criterion is routed to #1381.
- 23:14Z: #2477 (#2165) READY at `c313a62`. Gate: Opus IMPL-EVAL MERGE at the exact head; CI 20 success / 33 skipped, no failures; review threads 0 unanswered; diff limited to plugin-triggers-core and tests. **expensive-gate.acquired**: e2e-cli scaffold.runtime on #2477 via `e2e-cli-gate`.
- 23:15Z: #2477 (#2165) READY at `c313a62`. Gate: Opus IMPL-EVAL MERGE at the exact head; CI 20 success / 33 skipped, no failures; review threads 0 unanswered; diff limited to plugin-triggers-core and tests. **expensive-gate.acquired**: e2e-cli scaffold.runtime on #2477 via `e2e-cli-gate`.
- 23:31Z: **merged** #2477 (`7907293f3`) for #2165 after e2e-cli was green on both runtime tiers at `c313a62` (65/65 checks); #2165 closed with evidence; expensive gate released. #2187 must merge main into its branch (function ownership in trigger-processor.ts).
- 23:40:56Z: relaunched #2187 (`mc009d-r1-2187`, comment 6535845592); started 23:44:01Z. #2478 is scheduled for 23:50Z (scripted: post, then wait for its binding).
- 23:50:19Z: dispatched #2478 (H02, comment 6535993009); started 23:54:22Z. #2144-r1 is scripted for 00:04Z and #2396-r1 for 00:14Z, each only after the previous launch started.
- 23:59Z: #2187 → PR #2479 (draft); #2478 → PR #2480 (draft). Both recorded as implementing.
- 00:08Z: **merged** #2480 (`6a71cd059`) for #2478 (H02). CI 47/47 green at `b2e1d30`, Opus MERGE, 0 threads. #2478 closes once the repo-wide Code quality run on main is green.
- 00:09Z: Code quality is green on main (run 41148483243, `code-quality-repo` success at `6a71cd059`); #2478 closed with evidence.
- 00:04:17Z: relaunched #2144 (`mc009d-r1-2144`, comment 6536190825); started 00:07:20Z.
- 00:14:01Z: relaunched #2396 (`mc009d-r1-2396`, comment 6536318991); started 00:17:04Z. Builders: #2438, #2187, #2144, #2396; #2395 is scripted for 00:25Z (5th builder).
- 00:20Z: Cockpit: the netscript hourly limit is full again (6 launches since 23:44Z), and the Fresh UI #2415 fix is held while it blocks the S2 merge. Stopped the scripted 00:25Z #2395 post before it ran (#2395 has 0 comments). The first free slot (~00:45Z) is left to #2415; #2395 posts at 00:55Z or later.
- 00:24Z: #2476 (#2438 H01) READY at `1684e82`. Bound: `@opentelemetry/instrumentation` 0.223.0 with API 1.9.1 (SDK peers need API <1.10). Shared locked-fixture tool. Root lock and fresh-ui lock deltas disclosed in lock-delta.json; Fresh UI PRs may need a lock rebase. `command-postgres` green on the PR head; Opus MERGE at head; 0 threads. **expensive-gate.acquired** on #2476.
- 00:26Z: Cockpit: a second Fresh UI fix (#2416, 00:25:45Z) is held too. Stopped the scripted #2395 post (nothing was posted). #2395 now waits for Cockpit's explicit go, after both Fresh UI fixes have started (about 00:52Z).
- 00:37Z: **merged** #2476 (`a410a815c`) for #2438 (H01). 49/49 checks green, including command-postgres and e2e-cli on both runtime tiers at `1684e82`; expensive gate released. #2438 closes after command-postgres is green on main.
- 00:38Z: #2144 → PR #2481 (draft), implementing.
