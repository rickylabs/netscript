# Drift

- RTK absent on this executor; use raw focused commands and structured wrappers (as prior run memory recommends).
- Operator-specific Refs/no-closure, no taxonomy mutation, no local runtime E2E and stop-at-READY directives supersede conflicting generic dispatcher defaults.
- Owner explicitly overrides evaluator route/effort; exact grant recorded in worklog.md.

- PLAN-EVAL round 1 identified a pre-existing stale-completion race. Sequence is now locked: consume follower initial snapshot before resource start, then require a fresh nonterminal update before accepting terminal exit. This tightens existing behavior within scope.

- The changed reference page is also shipped through agent-docs-prose.generated.ts. Canonical docs generation is necessary to keep the consumer corpus fresh; this adds only the corresponding generated carrier/provenance artifacts after decoded-content review. No template behavior changes are intended.
