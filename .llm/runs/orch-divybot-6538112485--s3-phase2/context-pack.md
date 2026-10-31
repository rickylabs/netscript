# Resume S3 phase 2

Read plan.md, research.md and worklog.md. Branch orch/divybot-6538112485,
draft PR2488, baseline now main ad252e8. Operator says Refs #2416 only, no
labels/session IDs, no tokens/lock churn, stop at READY; Cockpit merges.
Never commit assignment/final-report files. Same separate Claude Opus5.5 high
read-only evaluator has reviewed each slice; final IMPL-EVAL remains required.

Completed and independently PASS: all104 typed/JSON contracts;3 Actions gap
components;4 native Forms gap controls; migration onto main's S2 registry.json.
73 shipped/31 gaps remain. Legacy-v1 snapshot unchanged; explicit post-v1 item
allowlist has7 components and no support items. Keep that list, native registry
count, style-utility maps and collection docs current for each new item.

Rebase repair gates:130 focused tests,60 real browser cases, quality,
release preflight, docs accuracy111, four carrier checks pass. Full package
run347 passed/1 stale design-sync count, corrected with targeted9/9 PASS;
repeat whole suite at phase final. Required CI skipped on draft, no READY.
Latest main advanced after first force push; six commits replayed cleanly onto
ad252e8. Push using explicit lease8d093a9, confirm mergeable, then continue.

Next slice4:6 untracked Calendar/DatePicker files restored from recovery stash.
Two pure Gregorian-date tests pass; no registry/contracts/browser integration
yet. Fix date-picker CSS nonexistent --ns-raised to --ns-surface-raised.
Integrate calendar-date support item plus Calendar and DatePicker through S2
registry.json, style maps, forms-core, contracts and actual copy installer test.
Add render and real browser keyboard/accessibility/focus/disabled/range tests.
Do not commit/start next category before scoped gates and same reviewer PASS.

Browser instructions in tools/fresh-ui-browser/README.md; suite rebuilds current
source automatically. System Chromium libs from a read-only existing project
run must be supplied only to npm/Playwright, not restricted Deno spawn wrappers.
Review transport/private identity is outside repository in project's run folder.
Remaining phase2a: Navigation, Overlays, Data display + Feedback/docs gap audit.
Then stacked phase2b: Layout, AI, Desktop, Docs kit and all-style harness.
