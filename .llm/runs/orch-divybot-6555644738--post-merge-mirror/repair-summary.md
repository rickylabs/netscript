# Repair mapping for coordinator review

Reviewed source: `83f0b63`; active repair is one additional commit slice.

| Finding | Resulting behavior | Negative/positive controls |
| --- | --- | --- |
| Unrelated merged PR with evidence comment | `post-merge-issue-not-referenced` before writes unless body or PR-owned commit messages reference target | Unrelated comment under apply refused; fenced example and prefix sibling refused; Refs/Closes/Part of and commit references accepted |
| Foreign repository | `post-merge-repository-mismatch` before writes and before SHA lookup | Foreign PR base, issue URL, qualified body/commit refs, evidence metadata, GitHub/API URLs (including root/Actions/blob/compare) and shorthand refused; case differences and fork heads accepted |
| Busy issue comments | New mode reads every PR and issue comment page | PR comment adapter page 2; provenance marker available only with full issue pagination prevents a duplicate |
| Failed POST after PATCH | At most two attempts, reconciling marker before retry | Transient failure recovers with one PATCH; ambiguous delivered POST is not repeated; exhaustion returns changed issue/snapshot and named partial-state error |
| Existing CI mode | Existing gates, defaults, first-page reads and failure behavior retained | Label/closing-reference/write default regression plus one-attempt original POST failure despite foreign metadata |

Structured repair baseline: 11 failures, 2 positive controls passing. Current full
focused suite: 69 passing. Shared parser grammar and validation remain unchanged.
Only in-memory test fixtures exercise apply; real checks are dry-run only.
