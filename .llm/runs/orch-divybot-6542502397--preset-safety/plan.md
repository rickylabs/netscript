# Plan & Design — READY FOR REVIEW

Locked scope: only issue 2516's first two requirements. Pre-resolve/fetch/schema-validate init presets before the scaffold executor for both public and maintainer entry points; retain the result for application after scaffold. Reject non-HTTPS preset URLs except exact localhost, 127.0.0.1 and [::1] HTTP hosts. Apply uses the shared resolver. Update CLI reference and regenerate documentation carriers.

PLAN-EVAL: N/A. Bounded bug fix with owner-specified policy and acceptance tests; no unresolved architectural tradeoff. IMPL-EVAL mandatory through the owner-selected independent read-only Claude invocation.

Risk: deferred remote schema validation could still create a scaffold; validate registry schema and theme/base type in resolution. Risk: duplicate fetch could change payload after validation; pass resolved selection to application. Dry-run preserves its no-network contract. Existing application-specific file/compiler conflicts remain transactional at application stage.

Gates: red/green regression tests, CLI init/apply/preset tests, scoped structured check/lint/fmt, quality:gate, release:preflight, docs:accuracy, carrier generation and all check:* tasks, full scaffold.runtime with cleanup (UNPROVEN if Docker unavailable), independent IMPL-EVAL, exact-head remote required checks before READY.

Deferred: remaining issue boxes, broader registry transport/redirect policy, new export surface and scaffold redesign. No open decisions; no new debt.

## Owner-directed CI repair slice

Regenerate the tracked Aspire inventory after the new regression test becomes tracked. Public behavior, vocabulary, ports and constants remain unchanged. Contributor path: `.llm/tools/validation/aspire-surface-manifest.ts`. Files: its existing TSV fixture and run evidence. Gates: phase-1 parity, 26 existing parity tests, deterministic regeneration and carrier freshness. Same independent evaluator reviews the row before commit. No broader Aspire changes are authorized or needed.
