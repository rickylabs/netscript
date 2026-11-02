# Resume — scaffold activity and seeded execution

Issue #2587; draft PR #2589; branch `orch/divybot-6569760641`.
Baseline `20ba1729`. Owner explicitly requires Refs #2587, no labels, draft, normal pushes,
and STOP at READY. Cockpit owns cross-family review and merge. Never rebase or force-push.
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
that green/policy-skipped evidence. The final report is queued through the excluded atomic
`.divybot-final-report.tmp` → `.divybot-final-report.md` handoff, never posted directly.
