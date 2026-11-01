# Repair handoff / resume

Issue #2562; PR #2564; branch `orch/divybot-6555644738`. Original implementation head
was `83f0b63ec9c928782162b2ad0df9f93244a1e051`; coordinator repair is slice S3.

The coordinator's three findings are repaired. Post-merge mode now requires a
reference in the PR body or PR-owned commit messages (comments alone do not count),
checks canonical PR/issue/evidence repository scope, paginates issue provenance
comments, and retries failed comment delivery after marker reconciliation. Exhaustion
returns the confirmed PATCH/snapshot with post-merge-provenance-incomplete and a
partial: line. Fresh issue ownership is checked immediately before PATCH.

69 focused tests pass. Structured check/lint/fmt process all three source files and
pass. Release preflight and relevant policy checks pass. Independent Opus repair
review and same-session follow-ups PASS; final reviewed hashes are recorded in
repair-evaluate.md. Code is committed unchanged after review.

Shared parser grammar, existing CI label/closing-reference behavior, CI write/failure
defaults and post-merge dry-run defaults are preserved. No real apply was run.
Fresh live dry-run outputs remain safe data refusals and are in
repair-real-data-dry-runs.md. Screenshot URL SHA parsing is an existing limitation;
the repository-policy exemption alone does not add end-to-end screenshot support.

The latest commit, current CI state and final READY are recorded in PR checks and
delivery comments. Final READY uses the excluded report-file handoff only after
required checks are green or policy-skipped. No labels or public session IDs.
Merge origin/main on conflicts; never rebase, force-push, apply real evidence or
merge the PR. Cockpit/coordinator owns merge and issue data reconciliation.
