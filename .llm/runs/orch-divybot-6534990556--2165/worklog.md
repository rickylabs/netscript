# Worklog

## Authority and routing override

Owner grant, verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Feature-tier loop: at most 2 PLAN-EVAL rounds and 5 IMPL-EVAL rounds. The final IMPL-EVAL must review the exact pushed head and end with one line: VERDICT: MERGE <full sha> or VERDICT: CHANGES <full sha>.”

This explicit owner override selects native Anthropic evaluation instead of matrix default for the critical silent-loss fix. Implementation remains Sol xhigh, feature tier. Separate sessions and vendor families remain mandatory. Operator-specific draft, Refs-only, no taxonomy mutations and READY stop override the generic dispatcher template. Final publication uses the excluded file handoff.

## Design

1. Public surface: same types/builders/ports; scheduled events now carry slot-stable id and idempotencyKey, custom dedup callbacks take effect, payload fallback is trigger-scoped.
2. Domain vocabulary: scheduled slot = (trigger id, nominal scheduled ISO instant); duplicate = same slot despite attempt/firedAt changes; restart = recreated adapters/processors over retained data. Existing TriggerEvent statuses and processor lifecycle remain.
3. Ports: RuntimeCronScheduler supplies time and callbacks; TriggerIdempotencyPort supplies atomic claim/complete/release; KvStore supplies durable storage; existing action dispatcher enqueues JobMessage and worker dispatcher executes the handler. Stop drains in-flight work as before.
4. Constants: remove the sequence field; retain established scheduled_ identity namespace, sha256 digest namespace, existing kind/status/TTL vocabularies. Tests name schedule and slot fixtures. No duplicated magic TTL or process-id prefixes.
5. Commit slices: bootstrap; identity/claim fix and persisted fault proof; evaluator-required repair only. Detailed files and gates in plan.md, fewer than thirty per slice.
6. Deferred scope: file-watch adapter, primitive cron scheduling behavior, runtime wiring and release; those have independent ownership or no defect here.
7. Contributor path: packages/plugin-triggers-core/README.md scheduled identity semantics.

Delivery guarantee remains at-least-once with atomic deduplication per key, not transactional exactly-once effects. Concurrency and diagnostics remain existing processor policy.

## Bootstrap

- Consulted available prior session memory. RTK is absent; focused raw commands used while structured wrappers remain verdict authority.
- Read full assignment, issue body and correction, AGENTS and applicable skills. No existing #2165 PR. NetScript MCP consulted before code inspection.
- Fetched main matches initial baseline. No file-watch changes. PLAN-EVAL pending.
