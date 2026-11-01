# Post-merge acceptance mirror — 2026-11-01

Issue #2562; PR #2564. Run: `.llm/runs/orch-divybot-6555644738--post-merge-mirror/`.

The explicit `--issue n --pr m` mode previews changes by default and requires
`--apply` to write. It reads structured evidence from the PR body and paginated
comments, requires merged state, and refuses cited commits outside main. Existing
CI labels, closing references, write defaults, parser and provenance remain intact.

Focused tests demonstrate the previous failure and the corrected behavior. See the
run's gate table, independent evaluation and exact live dry-run outputs. No real
issue mutations were made; existing evidence/data must be reconciled before apply.

No architecture debt or dependency changes. Cockpit owns merge.

Coordinator repair also requires body/commit association and repository ownership
before writes, paginates provenance reads, and reports failed provenance delivery
as partial state after bounded retries. See repair-summary.md and repair-evaluate.md
in the run for the repair contract and independent evidence.
