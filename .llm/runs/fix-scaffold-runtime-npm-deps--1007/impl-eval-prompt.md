You are the independent IMPL-EVAL for NetScript harness run fix-scaffold-runtime-npm-deps--1007.
Do not use tools; all required evidence is embedded. Return PASS or FAIL first, then concise findings.

Objective: fix published CLI scaffolds whose Fresh app imports @netscript/fresh/query but lacks its npm runtime dependencies in the generated app node_modules. Include the runtime subset required by @netscript/sdk, keep root/package/scaffold versions aligned, and add drift coverage.

Implementation:
- packages/cli scaffold catalog now emits Fresh runtime dependencies from the pre-existing Fresh manifest contract: @preact/signals, @tanstack/preact-query, @tanstack/query-core, @tanstack/react-db, vite.
- It also emits the SDK package.json runtime dependency keys: @orpc/client, @orpc/contract, @orpc/openapi, @orpc/server, @orpc/tanstack-query, @orpc/zod, @tanstack/db, @tanstack/query-core, @tanstack/query-db-collection.
- A drift test reads the root catalog, Fresh deno.json, SDK deno.json and SDK package.json, asserting exact npm targets in package and scaffold manifests.
- @tanstack/query-db-collection was aligned root/SDK/scaffold from ^1.0.40 to stable ^1.2.1 after generated typecheck proved the old graph resolved incompatible @tanstack/db minors. deno.lock was regenerated, not hand-edited.

Causal evidence:
- Published canary.5 exact in-repo scaffold with an empty DENO_DIR had no @tanstack/preact-query in app-local node_modules and the exact app-home probe returned HTTP 500 with Vite Cannot find module npm:@tanstack/preact-query@^5.101.0.
- A node_modules-free copy differing only by the fixed imports, installed under a second empty DENO_DIR, materialized @tanstack+preact-query@5.101.4 app-locally and the identical Aspire topology/probe returned HTTP 200 with 130,356 bytes of real HTML.
- This proves root cache downloads and packages/fresh/deno.json do not materialize the dependency for the consuming app; the generated app import map does.

Validation:
- Focused tests: 4 tests / 15 steps pass.
- Scoped CLI check/lint/fmt: 742 files, zero findings.
- quality:gate and CLI doc lint pass.
- Full one-pass scaffold.runtime reached generated typecheck and app startup. The environment's hardcoded 3001 was owned by unrelated Windows products.exe PID 10700, so default-port attempts failed only users health. With only the local E2E fixture port temporarily changed to free 13001, the exact one-pass suite passed 62/62 including generated.deno-check, behavior.service-health, behavior.app-home, cleanup; the fixture source was restored and is absent from the branch diff.

Review for correctness, minimal runtime subset, dependency alignment, regression quality, and whether the evidence genuinely closes issue #1007. Flag the environmental port deviation explicitly if it prevents PASS.
