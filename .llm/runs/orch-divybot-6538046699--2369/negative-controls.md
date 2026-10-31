# Real PostgreSQL negative controls

Each control mutated only the named production guard, ran the focused generated-client PostgreSQL test through the structured test wrapper, observed exit 1 with the named child assertion failure, and restored the source in a finally block. No compile/process error was accepted as a negative result. All nine retention tests have at least one red control.

| Removed guard | Focused real PostgreSQL test | Verdict |
| --- | --- | --- |
| outbox-settled-age | retention outbox ages | exit 1, semantic RED |
| outbox-lease | retention outbox rechecks | exit 1, semantic RED |
| terminal-status | retention replay expiry | exit 1, semantic RED |
| completion-window | retention replay expiry | exit 1, semantic RED |
| group-window | retention applies per-saga | exit 1, semantic RED |
| fresh-metadata | retention replay rechecks | exit 1, semantic RED |
| parent-version | retention replay rechecks | exit 1, semantic RED |
| delete-envelope | retention delete compares | exit 1, semantic RED |
| parent-lock | retention skips locked | exit 1, semantic RED |
| outbox-query-limit | retention bounds examined | exit 1, semantic RED |
| marker-query-limit | retention bounds examined | exit 1, semantic RED |
| policy-validation | retention validates bounds | exit 1, semantic RED |

Version control removes both the fresh-parent comparison and DELETE version predicate: these are two layers of the same guard. The other controls remove one logical guard each. Limit controls retain valid bound parameters and increase the SQL LIMIT so failure proves excess work, not invalid SQL. Policy control removes constructor rejection of nonpositive/nonfinite days.

Command: `SAGA_COMMAND_TEST_FILTER="<focused test>"` with an isolated native PostgreSQL socket server, then `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/database/tests/saga-command-postgres_test.ts`. The ordinary full suite is rerun after restoring all guards.
