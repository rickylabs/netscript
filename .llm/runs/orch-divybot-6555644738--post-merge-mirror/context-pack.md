# Resume / handoff

Issue #2562; PR #2564; branch `orch/divybot-6555644738`. Baseline
`6a6a82e15f2de2cd820cef9b879ce263aa7cb06f`.

Implementation complete. The explicit issue mode is dry-run by default, validates
merged state and every recognized cited commit against main, paginates PR comments,
and reuses the parser, mapping validator, retries and provenance. CI mode retains
its label gate, closing-reference selection, first-page comments and write default.

All 50 focused mirror/parser/close-gate tests and scoped check/lint/format pass.
Root lint excludes internal tools; the explicit wrapper config retained root rules
without selection exclusions. Policy checks and release preflight pass. See gates.md.
Independent Opus review PASS and same-session follow-up PASS; reviewed content hashes
are recorded in evaluate.md and committed unchanged. No architecture debt.

Exact required live dry-runs are in real-data-dry-runs.md and the PR body. All three
safely refuse current data: #2524 has no recognized gate headings; #2548/#2450 cite
squash branch heads absent from main. Coordinator must reconcile those data before
applying. No real apply, issue edits or evidence-comment edits were performed.

The current remote check state and exact delivered head belong to the PR's live
checks and final delivery comments. Do not infer remote-green from local evidence.
Final READY uses the excluded report-file handoff, after required checks are green
or skipped by workflow policy. Cockpit owns merge.

No labels, no closing keyword, no public session IDs. Never rebase, force-push, merge
or run real --apply from this assignment. Dated lessons are retained in this run.
