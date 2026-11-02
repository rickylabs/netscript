# Resume — scaffold activity and seeded execution

Issue #2587; ready PR #2589; branch `orch/divybot-6569760641`.
Baseline `20ba1729`. Owner requires Refs #2587, no labels, normal pushes, and STOP at READY.
The later owner instruction explicitly authorized marking PR #2589 ready; it is no longer draft.
Cockpit owns cross-family review and merge. Never rebase or force-push.
Do not commit `.divybot-goal.md` or the final report handoff files.

Implementation covers real attributed create/update activity, an atomic seed identity handed
to registered workers once, nonfuture sample dates, and derived weekly-group day counts.
Producer identities survive retries but change on process/producer replacement. Activity
requires app and record service to reference the same stream. Unlinked fallback shows record
changes with explicit owners. No accepted product debt.

Independent fresh read-only Codex source evaluation: PASS (`impl-eval.md`), followed by PASS
for the shared runtime mutation gate (`impl-eval-ci.md`). Independent Astra visual review:
PASS, all sixteen variants8.0–8.3 and at least Figma level (`visual-review.md`). The first
review findings and their fixes are recorded in worklog.md. Cockpit's review is separate.

Deno2.9.7 validation is in `validation.json`:181 focused tests,28-file scoped check/lint/fmt,
134-file generated check,4203-file root check, root lint/fmt, quality, docs accuracy, publish
dry-run, the full four-task carrier chain and all15root check tasks. Product file hashes bind
the local receipts to the reviewed source. `live-acceptance.json`, `browser-matrix.json`,
`visual-dom.json`, and `screens/` contain actual seeded runtime and visual evidence.
Run-owned Aspire endpoints were stopped and verified closed (`cleanup.json`).

CI history: docs build failure fixed in4951bf1. Full PostgreSQL runtime passed there;
SQLite required the real mutation gate shared by both engines before Overview readiness.
The acceptance commit includes that independently reviewed correction. Final CI authority
is the PR check rollup plus the explicit e2e-cli workflow run on the acceptance head;
consult the PR body/phase comments for terminal links. No READY claim is valid without
that green/policy-skipped evidence. The original report used the excluded atomic handoff. The latest coordinator instruction
explicitly requires a NEW READY comment on issue #2587 with the full new head after core CI
and full scaffold runtime are green, then STOP. That later instruction controls publication.


## Ready-transition CI follow-up

At `1b3f459`, coordinator reports DeepSeek cross-family verdict MERGE, no blocking findings.
Core run41404240146 failed test-1, test-2, test-3, test-6; test-4/5, check, browser and quality
passed. Fixes are limited to four stale expectations/fixtures plus the canonical asset carrier:
chart/router assertions, actual-record isolation in the emitted memory test, exact activity file
inventory, and Prisma Date timestamps in the auth-policy fixture. No negative controls removed.
All45 combined regression tests pass locally on Deno2.9.7, including the original failure cases.
Quality gate and four carrier generators pass. Independent follow-up review PASS (`ready-ci-review.md`); all15root
check tasks PASS. Push normally after review; require core CI and full PostgreSQL/SQLite
runtime green at the new head. Preserve historical validation.json; follow-up evidence belongs
in ready-ci-validation.json and the PR phase comment.
