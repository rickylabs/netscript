# Current-main adoption audit

Baseline main: `6a71cd0599673d70cd6311de3bb20b2d6a9dde2c`, refreshed 2026-10-31.
The issue and all comments were read live; no orchid-triage comment exists.
Native MCP find_guidance then search_docs returned service builder/native policy guidance,
not an existing published plugin-startup-options recipe.

## Footprint (merge-base comparison)

| PR | Retained run files / added lines | Other files / additions / deletions |
| --- | --- | --- |
| 2422 | 529 / 38985 | 26 / 2025 / 120 |
| 2423 | 558 / 63787 | 15 / 981 / 107 |
| 2421 | 876 / 83567 | 21 / 3614 / 48 |

Other files include source, tests, documentation, canonical generated carriers and debt.
All historical run evidence is retained. Its historical results do not prove current heads.
2422 owns service auth exact anonymous rules, health install order, final-response CORS,
body cancellation and database-probe lifecycle, plus Windows documentation-tool fixes.
2423 owns Fresh/workers native reader headers, native type identity, wire/compiler controls.
2421 owns workers/streams singular service subpaths and native factory/lifecycle tests.

## Acceptance mapping

The live issue has eight plain-bullet acceptance entries, not markdown checkboxes.

| Entry | Existing delivery | Missing current-head proof / implementation |
| --- | --- | --- |
| 1 Compatibility: aliases, REST, SSE, context/db/principal, health/info/docs/404 | 2421 workers delegation; 2422 service tests; 2423 reader identity | Run retained suites against main; verify host context contract and both legacy entrypoints; characterize saga/trigger entrypoints. |
| 2 Invalid policy before IO; explicit public; guarded 401/503 | 2421 auth-first factories; 2422 native auth | Linux tests and absent/wrong/unavailable controls on adopted factories. |
| 3 Procedure/raw policy and anonymous health/docs/direct callers | 2422 native auth/health ordering | Current-head regressions and clear migration note; defaults stay compatible. |
| 4 Exact CORS/OPTIONS; denied variants; stream protocol/proxy | 2422 response authority; 2421 protocol defaults | Cross-factory integrated matrix and omitted-origin workspace behavior. |
| 5 Observed loopback binding and returned address | 2421 native listener tests | Genuine Linux listener tests and deterministic option precedence. |
| 6 Explicit SDK internal identity compatible with discovery, no overwrite/leak | Existing SDK contribution; 2423 explicit reader headers | Tested host recipe using the existing SDK contribution; preserve existing credential owners; no automatic auth adoption. |
| 7 Inert streams import, durability/proxy/health/shutdown | 2421 new singular factory; existing proxy/storage | Linux controls; delegate legacy startup through the factory while preserving authored public/wildcard defaults and direct CLI behavior. |
| 8 Defaults/opt-in/publish consumers/documented adoption | All three partial | Exact package consumer checks, documentation, dry-runs, generated freshness and new-head CI. |

## Smallest coherent landing order

2422 (native response/auth prerequisite), 2423 (independent reader credential seam),
then 2421 (final integrated host startup acceptance). Keep all original branches;
merge main into each without rewriting history. The final factory branch may integrate
accepted prerequisite heads so its exact tested graph contains all acceptance behavior.
No duplicate PR is opened: 2421 is the existing early draft review surface.
No PR is currently fully superseded by main. No new process-manager implementation or
parameterized authorization resolver is planned (#829 and #2364 remain separate).

## JSR planned-surface audit

Native auth/CORS/listener and header types are reused, not copied. Existing singular service
exports have explicit options/return annotations and module docs. Check complete exports,
private type closure, module inertness, publish file filtering and exact graph consumers.
The service package has an existing slow-types allowance; other touched units must pass
without adding one. Existing bounded facade/builder debt expires 2026-11-10 and is not
extended. Fresh native-header widening needs its own migration note for custom adapters.

## Environment lessons

RTK is absent; raw focused commands are necessary. This worktree starts shallow and its
origin fetch configuration does not create PR branch tracking refs from branch-name fetches.
Explicit destination refs and bounded deepening recovered real merge bases.
Consulted the shared NetScript memory before code/build work; generated documentation has
four freshness gates and retained run evidence is owner-controlled.

S3 pre-implementation finding: native auth defaults guard `/api`, while streams uses raw
`/v1/stream` paths. Existing factory tests explicitly select `protect: ['/']`, but the adopted
streams JSDoc examples omit it. Correct those examples and explicitly test/document native
raw-route policy selection. Do not silently rewrite caller policy or duplicate #2364.
