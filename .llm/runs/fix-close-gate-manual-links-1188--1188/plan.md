# Plan

1. Query `closingIssuesReferences` plus PR commit messages through GraphQL.
2. Build a deterministic union with source metadata: body keyword, commit message, or manual link.
3. Gate the authoritative union and print source metadata in JSON/pretty output.
4. Add pure fixture tests for manual-link fail/remove-pass, commit source, union/dedup, and unchanged body-only behavior.
5. Run focused validation tool tests, targeted check/lint/fmt, and workflow guard tests.

Locked: GitHub closing references are authoritative; body/commit parsing exists only to explain provenance. Open decisions: pagination beyond 100 references/commits is safe to defer because GitHub's closing-reference surface and normal PR commit bounds are well below it; fail closed on GraphQL errors. Risk: mislabeling overlapping sources; retain every detected source. Deferred: changing GitHub link state or acceptance mirroring.

Per D6, no local PLAN-EVAL is spawned.

