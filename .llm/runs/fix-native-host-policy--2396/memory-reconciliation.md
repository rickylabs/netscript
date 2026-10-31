# Merge reconciliation recipes

A dispatcher shallow clone may have only main at depth1 and full fetched PR history. If git merge-tree reports unrelated histories, fetch main with --deepen=100; never use --allow-unrelated-histories.

Conflicted page carriers contain duplicate page rows. The canonical prose generator reads the previous carrier and refuses duplicates before it can write. Seed incoming main carriers with git checkout --theirs for the two conflicted generated files, then run the full generator chain. This is a generator seed, not final conflict resolution. Preserve both debt blocks. Use explicit --allow-dirty for corpus generation during the merge; final check must omit that flag.


This dispatcher checkout has no repository-local Git identity. Reuse the authenticated maintainer's existing public noreply identity from the original PR commits; set it locally, never globally. Do not add tool attribution trailers.

The structured test runner buffers TAP until completion; an empty redirected log while the process and its bounded child controls are alive is expected. Its --output JSON is the authoritative pass/fail/count evidence. Root check likewise reports at batch completion. Do not replace either wrapper with a raw CLI gate solely to obtain progress output.

Factory/native service qualification command (repository root):

    deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv --frozen packages/service packages/plugin packages/fresh plugins/workers plugins/streams packages/plugin-workers-core/tests/runtime/job-retry-policy_test.ts packages/sdk/tests/internal-credential-contribution_test.ts packages/sdk/tests/client-contribution-validation_test.ts packages/sdk/tests/client-contribution-observability_test.ts packages/sdk/tests/integration/client-contribution-adapter_test.ts packages/sdk/tests/discovery/env-ordering_test.ts

Run output can contain child scratch paths; keep raw JSON outside Git and commit only repo-relative command scope, counts and actual exit codes. Use neither stale exact-head verdicts nor RUNNING receipts as PASS.
