# Worklog

## Owner routing override

> Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Feature-tier loop: at most 2 PLAN-EVAL rounds and 5 IMPL-EVAL rounds. The final IMPL-EVAL must review the exact pushed head and end with one line: VERDICT: MERGE <full sha> or VERDICT: CHANGES <full sha>.

## Bootstrap

Baseline equals current fetched main. No triage comment or existing PR referencing #2369; broader outbox-retention search returns older relay/projection PRs, not this delivery. Consulted committed environment/Postgres memories and shared memory index before source inspection. MCP find_guidance then search_docs consulted. RTK absent; focused raw commands and structured wrappers will be used. No local scaffold.runtime run: coordinator must arm CI gate.

## Design

1. Public surface: installed outbox model+declared constraint migration; independent relay pruneSettled and saga command retention factory/prune.
2. Vocabulary: settled=published or terminal outbox, unleased=no token/until; terminal saga=completed/failed/cancelled/compensated, replay marker=atomic instance/hash.
3. Ports: existing PostgresCommandClient + TransactionClientPort; separate optional retention contract preserves relay fakes.
4. Constants: default completed-retention seven days; one day=86400000ms; maximum page 100; finite terminal status set and fixed SQL identifiers.
5. Commit slices: S0 plan; S1 contribution/migration + install Postgres proof; S2 retention + real guard/negative tests; S3 docs/carriers/final gates. Gates and files are in plan.
6. Deferred scope: scheduling/canonical state cleanup/receipt-audit retention/engine path/local full E2E/merge; outside requested seam or owner prohibits.
7. Contributor path: prisma-saga-command-retention.ts plus linked schema/migration recipe.

Public additions use named typed exports on existing database commands/postgres and saga stores subpaths, explicit return annotations and JSDoc examples; no new entrypoints, dependencies or slow-type carveouts.
