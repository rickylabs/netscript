# Worklog

## Design

Public surface and domain: Pin qualified DB 0.6.17/react-db 0.1.95/query-db-collection 1.2.1/durable-state 0.3.1 in owning manifests/catalog, guard isolated consumer graphs, prove real worker stream Collection through actual adapter with production SSR, client hydration and teardown; preserve public builder contracts

Ports: preserve existing owning package contracts. Constants: existing finite vocabulary; additional values only when needed by the issue. Contributor path: extend existing implementation and adjacent regressions.

Commit slices: bootstrap plan, source/test/mutation evidence, independent evaluation evidence. No speculative files.

PLAN-EVAL: Selected: hard stop until independent PLAN-EVAL PASS; multiple owning packages and actual SSR/hydration dependency boundary

## Nine phases

1. Bootstrap: clean clone, fetch, fresh branch from current main.
2. Research: issue, MCP, selected skills/doctrine and existing implementation examined.
3. Plan & Design: locked design recorded above.
4. Plan-Gate: Selected: hard stop until independent PLAN-EVAL PASS; multiple owning packages and actual SSR/hydration dependency boundary
5. Implement: pending.
6. Gate: pending; raw exit codes to be recorded.
7. Evaluate: pending; independent different-vendor session mandatory.
8. Release: N/A, owner explicitly requires unmerged PRs.
9. Close: pending source delivery and handoff; publication remains owner work.

## Design details

Public surface: unchanged SDK collection and Fresh query/factory APIs; additive optional native StreamDB preload/close on existing owned handle. Domain vocabulary: exact supported DB family and complete resolved npm identity; worker execution schema fixture; source Collection/subscriber lifecycle. Ports: existing NetScriptStreamDB and SDK query client/collection only; no new ports/classes/packages. Constants: supported versions only in owning manifests/catalog, test fixture witnesses qualified immutable family. Slices/files/gates locked in plan D1-D4/S2-S5. Contributor path: owning manifest update -> cold guard -> adjacent factory integration and production fixture -> independent source/publication consumer qualification. Deferred: coordinated release and exact published consumer, no source regression deferred. PLAN-EVAL selected and hard stop before any source implementation.

Gate `baseline-doc-sdk`: raw exit `1`. Command: `deno task doc:lint --root packages/sdk`. Full raw output retained privately.

Gate `baseline-doc-fresh`: raw exit `1`. Command: `deno task doc:lint --root packages/fresh`. Full raw output retained privately.

Phase 4 Plan-Gate complete: independent GLM max PLAN-EVAL PASS at 3ecd0c25729c5cc98dee3ebca2b9daf24781caea; mandatory hard stop satisfied before source. Refined S2-S5 authoritative. Phase 5 implementation begins after evaluator termination.

Gate `db-lock`: raw exit `0`. Command: `deno cache --unstable-kv packages/sdk/mod.ts packages/fresh/src/runtime/streams/mod.ts packages/fresh/src/application/query/mod.ts`. Full raw output retained privately.

Gate `db-cold-guard`: raw exit `0`. Command: `deno task deps:check:db`. Full raw output retained privately.

Gate `db-policy-tests`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-db-alignment_test.ts`. Full raw output retained privately.

Gate `db-policy-mutation`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-db-alignment_test.ts`. Full raw output retained privately.

Gate `db-policy-restored`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-db-alignment_test.ts`. Full raw output retained privately.

Gate `db-fmt-write`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/deps --include check-db-alignment* --ext ts --write`. Full raw output retained privately.

Gate `db-policy-check`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/deps --include check-db-alignment --ext ts --deno-arg --frozen`. Full raw output retained privately.

Gate `db-policy-lint`: raw exit `2`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/deps --include check-db-alignment --ext ts`. Full raw output retained privately.

Gate `db-quality`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `db-policy-lint-scoped`: raw exit `1`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/deps --include check-db-alignment --ext ts --config <private-scoped-lint-config>`. Full raw output retained privately.

Gate `db-policy-fmt`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/deps --include check-db-alignment --ext ts`. Full raw output retained privately.

Gate `db-policy-lint-final`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/deps --include check-db-alignment --ext ts --config <private-scoped-lint-config>`. Full raw output retained privately.

Gate `db-policy-final`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/deps/check-db-alignment_test.ts`. Full raw output retained privately.

S2 substantive slice review: supported exact declarations flow through existing SDK/Fresh manifests and catalog consumers. Cold guard counts complete DB npm identities and rejects graph loader errors; Fresh-only optional peer probe remains one core without an added graph anchor. Identity-disabled mutation raw exit 1, restored regression raw exit 0. Scoped check/fmt and final scoped lint pass; initial lint all-excluded refusal preserved, followed by explicit narrow lint config (no rule exclusions); inline imports replaced by root aliases. quality:gate exit 0. Initial generated lock attempted unrelated React/use-sync-external-store peer upgrades; discarded those changes, preserving all npm and JSR package identities byte-semantically and changing only owning family specifiers/workspace declarations. Publication remains deferred, EIS application DB pins not yet removable.

Gate `db-real-boundary`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/src/runtime/streams/create-stream-db_test.ts`. Full raw output retained privately.

Gate `db-real-boundary-typed`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/src/runtime/streams/create-stream-db_test.ts`. Full raw output retained privately.

Gate `db-real-boundary-final`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/src/runtime/streams/create-stream-db_test.ts`. Full raw output retained privately.

Gate `db-browser-check`: raw exit `1`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/tests/fixtures/db-collection-browser --file packages/fresh/tests/db-collection_browser.ts --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `db-browser-check-fixed`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/tests/fixtures/db-collection-browser --file packages/fresh/tests/db-collection_browser.ts --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `db-production-browser`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/tests/db-collection_browser.ts`. Full raw output retained privately.

Gate `db-frozen-install`: raw exit `1`. Command: `deno ci --frozen`. Full raw output retained privately.

Gate `db-ci-install`: raw exit `0`. Command: `deno ci`. Full raw output retained privately.

Gate `db-production-browser-installed`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/tests/db-collection_browser.ts`. Full raw output retained privately.

Gate `db-locked-build-warm`: raw exit `1`. Command: `deno run --frozen -A vite build --config packages/fresh/tests/fixtures/db-collection-browser/vite.config.ts`. Full raw output retained privately.

Gate `db-locked-build-qualified`: raw exit `1`. Command: `deno run --frozen --config packages/fresh/deno.json -A vite build --config packages/fresh/tests/fixtures/db-collection-browser/vite.config.ts`. Full raw output retained privately.

Gate `db-production-build-warm`: raw exit `1`. Command: `<private-locked-production-build-launcher>`. Full raw output retained privately.

Gate `db-production-build-catalog`: raw exit `1`. Command: `<private-locked-production-build-launcher>`. Full raw output retained privately.

Gate `db-production-build-native`: raw exit `1`. Command: `<private-locked-production-build-launcher>`. Full raw output retained privately.

Gate `db-production-build-catalog-resolve`: raw exit `0`. Command: `<private-locked-production-build-launcher>`. Full raw output retained privately.

Gate `db-production-browser-resolved`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/tests/db-collection_browser.ts`. Full raw output retained privately.

Gate `db-production-browser-cache-fixed`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/tests/db-collection_browser.ts`. Full raw output retained privately.

Gate `db-production-browser-diagnostics`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/tests/db-collection_browser.ts`. Full raw output retained privately.

Gate `db-production-browser-static`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/tests/db-collection_browser.ts`. Full raw output retained privately.

Gate `db-production-browser-teardown`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/tests/db-collection_browser.ts`. Full raw output retained privately.

Gate `db-fmt-source`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh/src/runtime/streams --root packages/fresh/tests/fixtures/db-collection-browser --file packages/fresh/tests/db-collection_browser.ts --include create-stream-db|db-collection --ext ts,tsx --write`. Full raw output retained privately.

Gate `db-boundary-mutation`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/src/runtime/streams/create-stream-db_test.ts`. Full raw output retained privately.

Gate `db-browser-mutation`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/tests/db-collection_browser.ts`. Full raw output retained privately.

Gate `db-boundary-browser-restored`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/src/runtime/streams/create-stream-db_test.ts packages/fresh/tests/db-collection_browser.ts`. Full raw output retained privately.

Gate `db-scoped-lint`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh/src/runtime/streams --root packages/fresh/tests/fixtures/db-collection-browser --file packages/fresh/tests/db-collection_browser.ts --include create-stream-db|db-collection --ext ts,tsx`. Full raw output retained privately.

Gate `db-doc-sdk`: raw exit `1`. Command: `deno task doc:lint --root packages/sdk`. Full raw output retained privately.

Gate `db-doc-fresh`: raw exit `1`. Command: `deno task doc:lint --root packages/fresh`. Full raw output retained privately.

Gate `db-scoped-check`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/src/runtime/streams --root packages/fresh/tests/fixtures/db-collection-browser --file packages/fresh/tests/db-collection_browser.ts --file packages/sdk/tests/type-fixtures/query-collection_type.ts --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `db-fmt-final-write`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh/src/runtime/streams --root packages/fresh/tests/fixtures/db-collection-browser --file packages/fresh/tests/db-collection_browser.ts --include create-stream-db|db-collection --ext ts,tsx --write`. Full raw output retained privately.

Gate `db-jsr-sdk`: raw exit `0`. Command: `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/sdk --text`. Full raw output retained privately.

Gate `db-jsr-fresh`: raw exit `0`. Command: `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/fresh --text`. Full raw output retained privately.

Gate `db-final-quality`: raw exit `1`. Command: `deno task quality:gate`. Full raw output retained privately.

Gate `db-sdk-fresh-tests`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --unstable-kv packages/sdk packages/fresh/src packages/fresh/tests`. Full raw output retained privately.

Gate `db-fmt-cleanup`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh/src/runtime/streams --root packages/fresh/tests/fixtures/db-collection-browser --file packages/fresh/tests/db-collection_browser.ts --include create-stream-db|db-collection --ext ts,tsx --write`. Full raw output retained privately.

Gate `db-boundary-mutation`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/src/runtime/streams/create-stream-db_test.ts`. Full raw output retained privately.

Gate `db-browser-mutation`: raw exit `1`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/tests/db-collection_browser.ts`. Full raw output retained privately.

Gate `db-final-production-boundary`: raw exit `0`. Command: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/src/runtime/streams/create-stream-db_test.ts packages/fresh/tests/db-collection_browser.ts`. Full raw output retained privately.

Gate `db-publish-sdk`: raw exit `0`. Command: `deno run -A .llm/tools/release/run-publish-dry-run.ts --member packages/sdk`. Full raw output retained privately.

Gate `db-publish-fresh`: raw exit `0`. Command: `deno run -A .llm/tools/release/run-publish-dry-run.ts --member packages/fresh`. Full raw output retained privately.

Gate `db-final-fmt`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh/src/runtime/streams --root packages/fresh/tests/fixtures/db-collection-browser --file packages/fresh/tests/db-collection_browser.ts --include create-stream-db|db-collection --ext ts,tsx`. Full raw output retained privately.

Gate `db-stream-types`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file packages/fresh/tests/type-fixtures/streamdb-wrapper_type.ts --deno-arg --no-lock --deno-arg --config --deno-arg packages/fresh/tests/type-fixtures/streamdb-consumer-deno.json`. Full raw output retained privately.

Gate `db-final-check`: raw exit `0`. Command: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh/src/runtime/streams --root packages/fresh/tests/fixtures/db-collection-browser --file packages/fresh/tests/db-collection_browser.ts --file packages/sdk/tests/type-fixtures/query-collection_type.ts --ext ts,tsx --deno-arg --frozen`. Full raw output retained privately.

Gate `db-quality-clean`: raw exit `0`. Command: `deno task quality:gate`. Full raw output retained privately.

S3 substantive slice review complete. Default factory production behavior preserved, public delta only optional native preload/close with explicit docs and unchanged generics. Actual worker definitions normalized through native createStateSchema, actual adapter BaseQueryBuilder.from accepts the native Collection and object constructors match the SDK query collection. SDK preload returns native rows (metadata preserved; assertions project IDs), cleanup leaves no subscriptions. Production Fresh uses actual SSR/client bundles, static assets and package hook; loading/empty/data, two real stream updates, SDK data, both responsive widths and zero subscribers after unmount pass, zero browser errors. Fixture waits for asynchronous native GC rather than a stale single sample. Pure Collection-to-plain-object source mutation produces actual QueryBuilderError in adjacent test and production SSR startup failure in browser regression; each restored test passes, final focused suite three pass. Guard policy mutation separately fails/restores. Full SDK/Fresh suite 524 pass, zero ignored/fail. Final frozen checks and streams type fixture, lint/fmt, JSR audits and both raw publish dry-runs pass. Existing all-export docs remain raw exit 1 for each package, exact per-entrypoint counts/exit codes and combined categories unchanged; db-doc-baseline-2039 proposed DEBT for independent adjudication. quality:gate initially found transient generated third-party bundles, not source; fixture now removes only its own _fresh output in finally and final clean quality/architecture exit 0. No scanner suppression. Public render/factory contracts retained; no source acceptance deferred.

Gate `db-carrier`: raw exit `0`. Command: `deno task check:assets-barrel`. Full raw output retained privately.

Gate `db-corpus-freshness`: raw exit `1`. Command: `deno task check:mcp-export-corpus`. Full raw output retained privately.

S4 source corpus freshness requires regeneration after additive native lifecycle members. Source is committed at 60dbcd048; metadata proof is committed before generator so it reads a clean tree. No generated file is hand-edited.
