NetScript 0.0.7 brings the Aspire integration onto the coordinated 13.5.3 release, expands typed
client and worker APIs, and makes generated applications more complete and easier to operate.

- Aspire owns endpoint allocation; generated apps use listener-based readiness, validated service
  references, bounded database commands, and the shared telemetry-endpoint resolver. MCP guidance
  and shipped integration resources follow the same 13.5.3 train.
- SDK clients gain typed bearer and locale contributions, contract-driven procedure metadata and
  request/cache policy, browser-safe entrypoints, and exact typed contract-error propagation.
- Workers deliver durable progress in FIFO order and carry job policy plus literal payload/result
  types through installed registries. Saga publish receipts and tracing also become more explicit.
- CLI resource-slice generation and collision-safe service clients connect contracts, services and
  Fresh applications. Generated production builds exclude the development-only design surface.
- Fresh improvements cover partial navigation, typed routes, forms and hydration freshness. AI
  tooling gains cancellation propagation, context-aware handlers and isolated MCP-pool failures.
- Canonical cross-host agent skills and structured validation reports reduce duplicated guidance
  and make failed checks actionable. Database examples and migration documentation are refreshed.

Breaking API details and migration notes are recorded in the package changelog and documentation;
notably, SDK safe failures use undefined data and lazy server cache setup is explicit outside
defineFreshApp. The Prisma-next database architecture remains an RFC, not a shipped database rewrite.

Outside this release: [#1453](https://github.com/rickylabs/netscript/issues/1453) needs re-scoping
because its referenced migration tool is absent from this repository. Aspire exploration
[#1725](https://github.com/rickylabs/netscript/issues/1725) was closed as not planned under 0.0.8,
and deeper protocol/credential readiness remains tracked in
[#1726](https://github.com/rickylabs/netscript/issues/1726). None is claimed as shipped here.

Use the root README's configuration-specific prerequisites. Its PostgreSQL/cache walkthrough uses
containers, but NetScript and Aspire do not require Docker for every configuration. Normal image
and dependency caches are supported; users do not need to clear them before installation.

<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### ⚠️ Breaking changes
* fix(sdk): preserve contract errors through safe() and isDefinedError by @rickylabs in https://github.com/rickylabs/netscript/pull/1692
### 🚀 Features
* feat(harness): encode milestone orchestration clusters by @rickylabs in https://github.com/rickylabs/netscript/pull/1636
* feat(prisma-mysql): expose connected surface and wire connection errors by @rickylabs in https://github.com/rickylabs/netscript/pull/1662
* feat(ai): per-request application context that never reaches a provider by @rickylabs in https://github.com/rickylabs/netscript/pull/1696
* feat(sdk): define NetScriptProcedureMeta without erasing contract errors by @rickylabs in https://github.com/rickylabs/netscript/pull/1731
* feat(aspire): listener-readiness health checks for backing services (S6) by @rickylabs in https://github.com/rickylabs/netscript/pull/1743
* feat(ai): map generation options for OpenAI Responses by @rickylabs in https://github.com/rickylabs/netscript/pull/1805
* feat(fresh): expose awaited chat response completion by @rickylabs in https://github.com/rickylabs/netscript/pull/1810
* feat(kv): publish createLazyKv and adopt it in the plugin service scaffold by @rickylabs in https://github.com/rickylabs/netscript/pull/1820
* feat(workers): persist and publish execution progress (Slice 1) by @rickylabs in https://github.com/rickylabs/netscript/pull/1814
* feat(sdk): typed client contribution seam — Slice 1 by @rickylabs in https://github.com/rickylabs/netscript/pull/1834
* feat(service): type principal and declare procedure policy by @rickylabs in https://github.com/rickylabs/netscript/pull/1762
* feat(sdk): add typed client contribution runtime by @rickylabs in https://github.com/rickylabs/netscript/pull/1841
* feat(workers): complete JobConfig policy schema by @rickylabs in https://github.com/rickylabs/netscript/pull/1861
* feat(workers): route progress to durable execution by @rickylabs in https://github.com/rickylabs/netscript/pull/1864
* feat(sdk): close remaining client contribution acceptance tripwires by @rickylabs in https://github.com/rickylabs/netscript/pull/1886
* feat(workers): generate config-aware installed job registries by @rickylabs in https://github.com/rickylabs/netscript/pull/1872
* feat(aspire): typed db-cli-mode resource commands with bounded wait and excludeFromMcp (S8) by @rickylabs in https://github.com/rickylabs/netscript/pull/1754
* feat(sdk): add typed bearer credential contribution by @rickylabs in https://github.com/rickylabs/netscript/pull/1915
* feat(sdk): ship locale as the non-auth contribution proof by @rickylabs in https://github.com/rickylabs/netscript/pull/1922
* feat(sdk): name contribution diagnostic conflicts by @rickylabs in https://github.com/rickylabs/netscript/pull/1927
* feat(plugin): publish structural service context factory by @rickylabs in https://github.com/rickylabs/netscript/pull/1842
* [sdk-client S5] route CLI auth sessions through typed bearer preparation by @rickylabs in https://github.com/rickylabs/netscript/pull/1931
* feat(cli): define resource slice reconciliation contract by @rickylabs in https://github.com/rickylabs/netscript/pull/1946
* feat(plugin): publish reusable PluginServiceContext host factory by @rickylabs in https://github.com/rickylabs/netscript/pull/1944
* feat(cli): adapt Fresh manifest derivation by @rickylabs in https://github.com/rickylabs/netscript/pull/1943
* feat(cli): establish neutral resource slice templates by @rickylabs in https://github.com/rickylabs/netscript/pull/1948
* feat(cli): compose resource slice command internals by @rickylabs in https://github.com/rickylabs/netscript/pull/1954
* feat(cli): generate collision-safe service query wiring by @rickylabs in https://github.com/rickylabs/netscript/pull/1664
* plan(cli): resource-slice generation plan for #1354 by @rickylabs in https://github.com/rickylabs/netscript/pull/1891
* feat(cli): converge init and activate resource generation by @rickylabs in https://github.com/rickylabs/netscript/pull/1956
* feat(cli): add resource slice runtime acceptance by @rickylabs in https://github.com/rickylabs/netscript/pull/1958
### 🐛 Fixes
* fix(release): grant canary verifier Deno subprocess access by @rickylabs in https://github.com/rickylabs/netscript/pull/1635
* fix(tooling): make evidence and verdict failures actionable by @rickylabs in https://github.com/rickylabs/netscript/pull/1644
* fix(auth): require an explicit streams session URL by @rickylabs in https://github.com/rickylabs/netscript/pull/1643
* fix(cli): correct generated scaffold output by @rickylabs in https://github.com/rickylabs/netscript/pull/1654
* fix(tooling): fail closed on quality scan root coverage by @rickylabs in https://github.com/rickylabs/netscript/pull/1656
* fix(scaffold): gate the generated design registry catalog by @rickylabs in https://github.com/rickylabs/netscript/pull/1657
* fix(agentic): bind OpenHands dispatch claims and refusals by @rickylabs in https://github.com/rickylabs/netscript/pull/1658
* fix(ai/mcp): make pool startup failure-isolated and propagate cancellation by @rickylabs in https://github.com/rickylabs/netscript/pull/1661
* fix(sdk): make the cached-entry fast path honour its stale policy by @rickylabs in https://github.com/rickylabs/netscript/pull/1669
* fix(docs/exports): gate reference drift and repair Fresh UI coverage by @rickylabs in https://github.com/rickylabs/netscript/pull/1666
* fix: make package quality gates honest by @rickylabs in https://github.com/rickylabs/netscript/pull/1663
* fix(cli): fail fast on unresolved background references by @rickylabs in https://github.com/rickylabs/netscript/pull/1728
* fix(cli): improve agent init guidance and cross-host skills by @rickylabs in https://github.com/rickylabs/netscript/pull/1729
* fix(fresh): preserve readonly query hydration on 5.102.x by @rickylabs in https://github.com/rickylabs/netscript/pull/1736
* chore(aspire): generator re-validation against the 13.5 TypeScript API + deploy-adapter contract (S4) by @rickylabs in https://github.com/rickylabs/netscript/pull/1738
* fix(aspire): remove runtime literal ports from plugin contributions, infrastructure, and E2E probes (S5) by @rickylabs in https://github.com/rickylabs/netscript/pull/1740
* fix(agentic): make Claude hook logging cwd-independent by @rickylabs in https://github.com/rickylabs/netscript/pull/1775
* fix(cli): detect generated plugin registry source drift by @rickylabs in https://github.com/rickylabs/netscript/pull/1739
* fix(sdk): isolate server cache provider from root imports by @rickylabs in https://github.com/rickylabs/netscript/pull/1758
* fix(cli): ui:add page --island emits a working data screen, not a counter by @rickylabs in https://github.com/rickylabs/netscript/pull/1781
* fix(sagas): emit and correlate cascade spans by @rickylabs in https://github.com/rickylabs/netscript/pull/1764
* fix(sagas): make publish receipts non-discardable by @rickylabs in https://github.com/rickylabs/netscript/pull/1819
* fix(ai): preserve nested TokenUsage detail through the TanStack bridge by @rickylabs in https://github.com/rickylabs/netscript/pull/1829
* fix(sdk): normalize Aspire browser service keys by @rickylabs in https://github.com/rickylabs/netscript/pull/1831
* fix(harness): detect stale or missing milestone PR leaves by @rickylabs in https://github.com/rickylabs/netscript/pull/1823
* fix(cli-e2e): restore deno.unstable compiler-lib parity by @rickylabs in https://github.com/rickylabs/netscript/pull/1828
* fix(cli/skills): use canonical agent skill tree by @rickylabs in https://github.com/rickylabs/netscript/pull/1830
* fix(sdk, cli): align residual Aspire Vite key normalization by @rickylabs in https://github.com/rickylabs/netscript/pull/1835
* fix(aspire): make sibling register generators source-safe by @rickylabs in https://github.com/rickylabs/netscript/pull/1837
* fix(agentic): accept documented task separator in agentic launchers by @rickylabs in https://github.com/rickylabs/netscript/pull/1840
* fix(mcp): regenerate stale export-surface corpus by @rickylabs in https://github.com/rickylabs/netscript/pull/1862
* fix(fresh): order partial navigation lifecycle by @rickylabs in https://github.com/rickylabs/netscript/pull/1848
* fix(agentic): recover stale sender leases and propagate resume rejection by @rickylabs in https://github.com/rickylabs/netscript/pull/1802
* fix(workers): keep registry compiler in JobConfig parity by @rickylabs in https://github.com/rickylabs/netscript/pull/1882
* fix(plugin-core): let third-party plugin factories participate in discovery by @rickylabs in https://github.com/rickylabs/netscript/pull/1850
* fix(agentic): preserve formal OpenHands evaluator verdict artifacts by @rickylabs in https://github.com/rickylabs/netscript/pull/1894
* ci(e2e-cli): defer runtime overflow instead of cancelling by @rickylabs in https://github.com/rickylabs/netscript/pull/1846
* fix(aspire): validate background reference names by @rickylabs in https://github.com/rickylabs/netscript/pull/1747
* fix(fresh): bind captured navigation fetch receiver by @rickylabs in https://github.com/rickylabs/netscript/pull/1904
* fix(agentic): remove Claude skill mirroring by @rickylabs in https://github.com/rickylabs/netscript/pull/1911
* fix(ci): isolate runtime concurrency from stale workflow branches by @rickylabs in https://github.com/rickylabs/netscript/pull/1910
* fix(fresh): exclude tests from publish set by @rickylabs in https://github.com/rickylabs/netscript/pull/1918
* ci(mcp): enforce export-corpus freshness in quality by @rickylabs in https://github.com/rickylabs/netscript/pull/1929
* fix(docs): repair the README fence debt the compile gate made visible by @rickylabs in https://github.com/rickylabs/netscript/pull/1935
* fix(release): authorize corpus regeneration after bump by @rickylabs in https://github.com/rickylabs/netscript/pull/1951
* fix(e2e): typed-db Phase-B observes the induced listener departure via the #1909 follow stream (120s shared ceiling) by @rickylabs in https://github.com/rickylabs/netscript/pull/1957
* fix(e2e): select the live Postgres endpoint resource by @rickylabs in https://github.com/rickylabs/netscript/pull/1962
* fix(aspire): reproduce and contract the Postgres Running/Unhealthy readiness false negative (#863 gate 2) by @rickylabs in https://github.com/rickylabs/netscript/pull/1952
* fix(e2e): isolate DENO_INSTALL_ROOT for the verbatim README quickstart walk (#863 gate 3) by @rickylabs in https://github.com/rickylabs/netscript/pull/1975
* fix(readme): carry --minimum-dependency-age=0 in the printed global install command (#863 gate 3) by @rickylabs in https://github.com/rickylabs/netscript/pull/1980
* fix(release): wait for README service health before probing by @rickylabs in https://github.com/rickylabs/netscript/pull/1981
* fix(scaffold): gate /design out of production builds by @rickylabs in https://github.com/rickylabs/netscript/pull/1945
* fix(release): verify README quickstart on a cold runner by @rickylabs in https://github.com/rickylabs/netscript/pull/1983
### 📚 Documentation
* docs(database): make the MySQL Prisma adapter example honest and executable by @rickylabs in https://github.com/rickylabs/netscript/pull/1711
* docs(skills): make Aspire event system the required observation surface by @rickylabs in https://github.com/rickylabs/netscript/pull/1907
* docs(sdk): document client contribution composition by @rickylabs in https://github.com/rickylabs/netscript/pull/1936
* docs(cli): top up the 0.0.7 changelog before the stable cut by @rickylabs in https://github.com/rickylabs/netscript/pull/1949
* docs(cli): fold #1856 into the 0.0.7 changelog by @rickylabs in https://github.com/rickylabs/netscript/pull/1955
* docs(skills): add aspire-upgrade skill for recurring Aspire pin bumps by @rickylabs in https://github.com/rickylabs/netscript/pull/1953
* docs(cli): fold #1952 into the 0.0.7 changelog by @rickylabs in https://github.com/rickylabs/netscript/pull/1968
* docs(cli): fold #1959 bounded listener readiness into the 0.0.7 changelog by @rickylabs in https://github.com/rickylabs/netscript/pull/1972
* docs(cli): fold #1960 controlProps assignability into the 0.0.7 changelog by @rickylabs in https://github.com/rickylabs/netscript/pull/1973
* docs(cli): fold #1664 service query wiring into the 0.0.7 changelog by @rickylabs in https://github.com/rickylabs/netscript/pull/1976
### 🧰 Maintenance
* ci: adopt structured check reports by @rickylabs in https://github.com/rickylabs/netscript/pull/1639
* chore(quality): make scan allowances fail closed by @rickylabs in https://github.com/rickylabs/netscript/pull/1653
* chore(mcp): regenerate stale export-surface corpus by @rickylabs in https://github.com/rickylabs/netscript/pull/1691
* test(ai): guard request context from provider payloads by @rickylabs in https://github.com/rickylabs/netscript/pull/1763
* test(aspire): re-capture 13.5.3 fixtures beside kept 13.4.6 compat cases (S3) by @rickylabs in https://github.com/rickylabs/netscript/pull/1741
* chore(aspire): atomic Aspire 13.5.3 pin bump + version-parity gate (phase 1) by @rickylabs in https://github.com/rickylabs/netscript/pull/1727
* chore(agentic): route open evaluation to GLM 5.3 Flash and Qwen 3.8 Flash by @rickylabs in https://github.com/rickylabs/netscript/pull/1792
* chore(harness): restore #1833 run artifacts stripped in error by @rickylabs in https://github.com/rickylabs/netscript/pull/1852
* test(cli): gate dynamic scaffold route binding by @rickylabs in https://github.com/rickylabs/netscript/pull/1773
* chore(harness): restore #1815 run artifacts stripped from #1816 by @rickylabs in https://github.com/rickylabs/netscript/pull/1854
* deps(ai): advance TanStack AI dependency family by @rickylabs in https://github.com/rickylabs/netscript/pull/1832
* chore(deps): declare the undeclared streams-core dependency by @rickylabs in https://github.com/rickylabs/netscript/pull/1876
* chore(deps): move the oRPC family to 1.15.0 by @rickylabs in https://github.com/rickylabs/netscript/pull/1890
* test(docs): compile published JSDoc examples by @rickylabs in https://github.com/rickylabs/netscript/pull/1756
* refactor(sdk): centralize transport policy by @rickylabs in https://github.com/rickylabs/netscript/pull/1889
* test(sdk): prove transport trace header authorship by @rickylabs in https://github.com/rickylabs/netscript/pull/1921
* fix(mcp): guard corpus generation against dirty sources by @rickylabs in https://github.com/rickylabs/netscript/pull/1937
* chore(aspire): stale version-bound surface cleanup, D-17 telemetry resolver, parity phase 2 (S13) by @rickylabs in https://github.com/rickylabs/netscript/pull/1779
* fix(sdk): reconcile S6/S7 acceptance evidence by @rickylabs in https://github.com/rickylabs/netscript/pull/1941
* test(fresh): deterministic A→B→A partial-navigation browser proof (#1590 Slice 2) by @rickylabs in https://github.com/rickylabs/netscript/pull/1895
* test(e2e): walk the root README quickstart verbatim on the clean prod runner (#863 gate 3) by @rickylabs in https://github.com/rickylabs/netscript/pull/1965
* refactor(cli): share the generated client selector (resource slice A) by @rickylabs in https://github.com/rickylabs/netscript/pull/1950
### Other changes
* fix(ci): trigger Fresh UI quality for private-lock inputs by @rickylabs in https://github.com/rickylabs/netscript/pull/1917
* fix(ci): bound remaining repo-wide concurrency groups by @rickylabs in https://github.com/rickylabs/netscript/pull/1923


**Full Changelog**: https://github.com/rickylabs/netscript/compare/v0.0.6...v0.0.7

## Closed Issues

- #1712 Epic: Aspire 13.5 adoption and orchestration stabilization
- #863 scaffold: `netscript db init` can block indefinitely on an Unhealthy-but-Running Postgres resource (clean-machine quickstart flake)
- #1881 test(aspire): clean-machine quickstart canary runs the root README sequence without manual recovery (#863 gate 3)
- #1977 test(e2e): cleanup.aspire-stop races docker inspect against container removal (No such object)
- #1971 scaffold: production deno task build fails on catalog: zod specifier after db codegen
- #1481 fix(fresh-ui): /design ships ungated — the defect class RFC 0005 guards against
- #1360 fix(scaffold): the canonical island never passes initialDataUpdatedAt, so the loader's cachedAt is computed, displayed and discarded
- #1455 workers: preserve job payload type through definition, registry, and enqueue
- #1355 feat(cli): app-side client/query wiring is a one-shot template with hardcoded names, colliding 'service' cache keys and a no-op invalidation
- #1354 feat(cli): no verb generates a resource route slice — the typed contract, cache-first loader and withResource page must be hand-copied from init
- #1249 fix(fresh/form): controlProps() is not element-assignable, and Zod 4 constraint derivation misses numbers and regex
- #1844 ci(e2e-cli): runtime.wait.garnet times out at 300s on the Postgres scaffold-runtime tier
- #1906 test(e2e): observe Aspire resources through the event system, not hand-rolled polling
- #1966 fix(e2e): allow the package-doctor fixture to consume a just-published canary
- #1880 fix(aspire): reproduce or contract the Postgres Running/Unhealthy health-probe false negative (#863 gate 2)
- #1590 Fresh partial navigation needs last-intent ordering and remount-safe region identity
- #1348 Epic: Typed SDK client contributions — credentials, transport policy, metadata, and cache-safe extensions
- #1601 test(fresh): defer-island client-bundle test resolves npm:vite over the network, making the package verdict environment-dependent
- #1557 test(fresh): no capability to assert the deferred coordinator reaches the client bundle
- #1845 fix(fresh/scaffold): the generated showcase island never hydrates — no island element, no query client, no onMutate
- #1961 fix(e2e): resolve the live Postgres container instead of the postgres-password parameter
- #1868 test(e2e): project-boundary dev probe counts dependency verification against its 60s HTTP budget
- #1947 docs(cli): top up the 0.0.7 changelog before the stable cut
- #1934 fix(docs): 26 of 32 README fence errors are undeclared bindings in published JSR landing pages
- #1924 fix(docs): package and plugin README code fences are required but never compiled
- #1920 ci(mcp): the export-surface corpus gate is not wired into CI, and main is stale again
- #1913 ci: pages-deploy and release-canary share the unbounded repo-wide concurrency group defect fixed in #1908
- #1900 fix(fresh): navigation coordinator calls captured window.fetch unbound — Illegal invocation in a real browser
- #1908 ci(e2e-cli): pre-#1846 branches still cancel runtime jobs on fixed branches through the shared concurrency group
- #1898 fix(e2e): readiness-fixture app injection collides with the project's positional app identifiers, so listener-fault-controller never starts
- #1897 build(fresh): tests/runtime-catalog-dependencies.ts still ships in the published package
- #1892 fix(docs): unattributed deno check diagnostics are dropped whenever any JSDoc example has a classified failure
- #1888 fix(agentic): preserve formal OpenHands evaluator artifacts in comment output mode
- #1879 deps(orpc): move the @orpc/* family to stable v1.15.0 and collapse duplicate @orpc/shared
- #1877 fix(e2e): scaffold.runtime blocked on main — runtime.wait.workers requires a worker startup log line #1864 renamed
- #1875 fix(workers): registry-compiler emits job policy without a parity check against the normalized config contract
- #1870 fix(e2e): scaffold.runtime blocked on main — an Auto-mode cache emits two RESP health attachments and #1837's uniqueness check rejects them
- #1867 chore(mcp): gate check:mcp-export-corpus in CI and guard gen against a dirty tree
- #1863 fix(e2e): scaffold.runtime blocked on main — prepare-flow-b-fixture expects a workers-api marker #1837 renamed
- #1859 fix(mcp): export-surface corpus stale on main since #1841 — check:mcp-export-corpus red for every PR
- #1857 docs(plugins): seven plugin reference pages are unpoliced by docs:exports-drift, and two document a nonexistent /scaffolding subpath
- #1839 ci(e2e-cli): runtime-tier concurrency groups cancel queued runs instead of deferring them
- #1855 fix(aspire): exact-AppHost cleanup removed a foreign network and left an anonymous volume
- #1836 fix(aspire): reserved-word bindings and unescaped literals in the four sibling register generators
- #1817 docs(fresh): no Exports table exists, and four real entrypoints have no documentation section at all
- #1833 fix(sdk,cli): residual Aspire key-normalization mismatches in shorthand, deploy prebuild, and the cross-package pin
- #1815 docs(plugin-sagas-core): the reference page's already-correct Exports table sits under an unrecognized heading
- #1751 fix(agentic): recover stale sender leases and propagate resume rejection
- #1732 fix(cli): validate background reference names before emitting AppHost source
- #1750 fix(agentic): accept the documented task separator in the Claude hybrid launcher
- #1724 [aspire-13-5 S13] Stale version-bound surface cleanup + parity phase 2 (complete enforcement)
- #1723 [aspire-13-5 S11] Public docs + README refresh for Aspire 13.5
- #1722 [aspire-13-5 S10] E2E gate upgrades: doctor receipt, `describe --follow` evidence, `stop --force` cleanup, resource-command gate class
- #1721 [aspire-13-5 S9] Skills, corpora, and Aspire MCP alignment — with an exact-13.5.3 MCP smoke receipt
- #1720 [aspire-13-5 S8] Typed resource commands for db-cli-mode resources + `excludeFromMcp()` ownership
- #1695 deps(ai): @tanstack/ai pinned at ^0.39.0 while 0.48.0 ships — the 0.x caret cannot drift forward
- #1719 [aspire-13-5 S7] Teardown/leak-check on 13.5: orphan cleanup, `stop --force`, descendant tracking
- #1642 docs(aspire): expose detached non-TTY start state and dashboard-token discovery
- #1616 test(cli): the scaffold emits no dynamic route, so no gate exercises dynamic route binding end to end
- #1609 fix(fresh): managed form silently drops navigation:'document' when mode:'client'
- #1610 fix(fresh): route-pattern path inference makes unknown params never instead of a compile error
- #1592 Workers durable execution stream should publish typed progress
- #1544 fix(cli): `emit` is advertised and implemented by three deploy adapters but never routed, so `deploy list` reports a command that does not exist
- #1543 chore(deps): plugin-workers-core and plugins/triggers import plugin-streams-core without declaring it
- #1533 test(docs): nothing compiles JSDoc `@example` blocks, so a published JSR reference can import a module that does not exist
- #1467 [sdk-client S7] feat(sdk): ship locale as the non-auth contribution proof
- #1452 feat(plugin): publish reusable PluginServiceContext host factory
- #1451 feat(plugin-workers): generated registry cannot consume project job policy metadata
- #1429 fix(agentic): leak-check cannot see orphaned Aspire process descendants, so it reports clean through a real leak
- #1353 [sdk-client S6] feat(sdk): express trace propagation as a general contribution
- #1352 [sdk-client S5] feat(sdk/auth): prove typed credential contributions end to end
- #1351 [sdk-client S4] refactor(sdk): centralize HTTP method and GET-cache policy
- #1349 [sdk-client S3] feat(sdk): expose the typed oRPC client-contribution seam
- #1093 [sdk-client S8] fix(plugin-core): let third-party plugin factories participate in discovery
- #979 fix(aspire): plugin API resources still pin host ports 8091–8094
- #1370 fix(plugins): sagas/triggers/streams contributions and the generated browser consumer stub still publish pre-randomization ports
- #1926 fix(sdk/desktop): isolated dpkg cannot import @orpc/contract from transport-policy — desktop-native-linux red on every #1889 head
- #1905 ci(fresh-ui): the private lockfile gate cannot see the member-manifest changes that stale it
- #1725 [aspire-13-5 S12] 0.0.8 spikes: `addDenoApp` via CommunityToolkit TS projection, `withPostgresMcp` opt-in, NetScript MCP as a resource MCP server
- #1874 fix(workers): official sample config authors a plugin job without source:'plugin', which D6 discovery rejects
- #1851 fix(cli): escape user-supplied names in generate-register-infrastructure emitted source
- #1873 fix(tooling): the MCP export-surface corpus is stale on main and its freshness check runs in no workflow
- #1777 docs(tooling): 21 published reference pages are unpoliced by docs:exports-drift (108 measured findings)
- #1847 chore(harness): 99 tracked codex-thread-ids.md files publish host paths and live session UUIDs
- #1827 fix(cli-e2e): restore deno.unstable compiler-lib parity
- #1824 bug(sdk): browser full-key discovery never matches Aspire for hyphenated resources — only the shorthand alias saves it
- #1809 docs(ai): the Export map heading is unrecognized and the table is missing the /skills row
- #1812 docs(plugin-workers-core): the reference page's already-correct Exports table sits under an unrecognized heading
- #1807 docs(plugin-triggers-core): the reference page's already-correct Exports table sits under an unrecognized heading
- #1804 docs(plugin-auth-core): the Sub-path exports table has no Path column
- #1801 docs(auth-kv-oauth): the Sub-path exports table has no Path column, and one row's embedded backtick breaks the row regex
- #1799 docs(mcp): Sub-path exports heading has no checker-recognized summary table for any of the three exports
- #1797 docs(plugin-streams-core): the reference page's already-correct Exports table sits under an unrecognized heading
- #1753 fix(harness): detect live milestone PR leaves missing or stale in cluster state
- #1795 docs(plugin-ai-core): the reference page's already-correct Exports table sits under an unrecognized heading
- #1737 fix(cli/skills): two shipped skill bodies point at .claude/skills/help.md, contradicting the canonical .agents/skills tree
- #1677 ai: tanstack-bridge drops promptTokensDetails/cost from TokenUsage — cache and cost accounting are structurally impossible
- #1458 feat(fresh/ai): expose awaited durable chat response completion
- #1591 AI provider adapter needs a typed OpenAI Responses mapper
- #1387 feat(service): handlers receive `principal` as an untyped bag entry and no procedure can declare a policy
- #1368 fix(sagas): 5 of 6 saga span factories have zero callers — compensation emits no span and deleting the saga telemetry surface keeps CI green
- #1365 fix(sagas): publish receipts are discardable and four documentation sites teach discarding them — user jobs report success while the saga never starts
- #1843 fix(e2e): runtime.wait.garnet times out at 300s on the Postgres tier only, blocking unrelated PRs
- #1838 feat(ai/anthropic): allow explicitly configured forward-compatible model IDs
- #1793 docs(watchers,runtime-config,prisma-adapter-mysql,auth-workos,auth-better-auth): five single-entrypoint reference pages have no Exports table row, leaving them unpoliced by docs:exports-drift
- #1791 chore(agentic): make GLM 5.3 Flash the default open evaluator/hybrid model, Qwen 3.8 Flash for PLAN-EVAL
- #1788 docs(cli,plugin): both reference pages defer sub-path symbols to pages that do not exist
- #1784 docs(logger): the reference page defers /middleware and /orpc to pages that do not exist
- #1782 docs(aspire): the reference page's /public claim is false and four exported symbols are undocumented
- #1778 docs(tooling): adopt the six already-clean packages into docs:exports-drift
- #1774 fix(agentic): make Claude hook logging independent of turn cwd
- #1770 docs(aspire): the fatal background-reference preflight error is undocumented
- #1757 docs(cli): the changelog stops at 0.0.6 and no gate enforces it
- #1745 docs(agentic): document canonical cross-host skill installation
- #1749 docs(quickstart): show the canonical .agents/skills/ bundle in the scaffold tree
- #1734 fix(fresh): readonly DehydratedState breaks TanStack hydrate() on query-core 5.102.x, failing generated-project check
- #1730 test(ai): the provider-invisibility invariant has no executable guard above the adapter
- #1718 [aspire-13-5 S6] Listener-readiness health checks for backing services via TS `addHealthCheck`/`withHealthCheck`
- #1716 [aspire-13-5 S4] Generator re-validation against the 13.5 TypeScript API
- #1717 [aspire-13-5 S5] Remove every literal pre-randomization port from plugin contributions and E2E probes
- #1715 [aspire-13-5 S3] Re-capture 13.5 fixtures: dashboard telemetry, `aspire describe`, `aspire ps`
- #1714 [aspire-13-5 S2] 13.5 runtime verification pass with receipts
- #1713 [aspire-13-5 S1] Atomic Aspire 13.5.3 pin bump + `check:aspire-version-parity` gate
- #1466 [sdk-client S2] feat(sdk): define NetScriptProcedureMeta without erasing contract errors
- #1673 fix(cli): plugin doctor validates the registry against itself, so registry drift reports healthy while the durable layer never loads
- #1462 bug(sdk): importing defineServices in a browser auto-registers the server KV cache provider
- #1357 fix(cli): ui:add page --island emits a useSignal counter and an empty queryLoaders object instead of the advertised data-screen triad
- #1280 aspire: backing services report no real health check — blocked on TypeScript AppHost custom health-check support
- #1000 docs: Rename .NET Aspire to Aspire
- #1293 prisma-adapter-mysql: adapter class is unexported and has no connection-error hook — the honest example needs both
- #1564 fix(ci): pull_request.base.sha is stale on long-lived PRs, so every gate that computes a range from it silently inspects the wrong changeset
- #1112 docs(database): make the MySQL Prisma adapter example honest and executable
- #1306 fix(aspire): 'the dashboard is the authority' is unusable for an agent — aspire start detaches in a non-TTY and prints no login token
- #1371 verify(aspire): re-test the wave-6 claim that BackgroundProcessors.*.ServiceReferences is parsed but never injected
- #1606 verify(sdk): confirm the published @netscript/sdk JSR landing page shows the canonical query dialect
- #1709 fix(tooling): Deno lint and fmt wrappers report green when Deno drops part of a selected batch
- #1694 ai: no per-request app-context seam — TanStack's context/middleware/metadata is never forwarded by the bridge
- #1674 fix(cli/agent-init): root AGENTS.md is the only guaranteed-read file and teaches diagnostics but not how to build — and never links the app-level guide
- #1675 fix(cli/agent-init): skills install only to .claude/skills with no .agents/skills canonical mirror — non-Claude agents get nothing, and usage measures ~zero
- #1672 feat(cli/agent-init): generated guidance must teach the Deno toolchain — 55 deno calls, 0 were deno doc/info/eval
- #1733 fix(cli/aspire): resource and reference names containing quotes or backslashes emit unparseable AppHost source
- #1659 docs(comparison): replace the measurement protocol with two entertaining NetScript-vs pages
- #1637 fix(sdk): cache write limits must not fail successful query results
- #1634 release: publish.yml canary-pair verification lacks deno run permission, blocking stable publish
- #1622 mcp: the guidance closeScoreGap constant is pinned by no test — a 10x change passes green
- #1623 docs(sdk): CacheStore.get JSDoc documents a return shape that no longer type-checks
- #1621 tooling: acceptance-evidence blocks fail opaquely when the target issue has no checkbox boxes
- #1619 fix(sdk): cache telemetry evidence validation throws into the data path
- #1620 fix(sdk): cache namespace cardinality is unbounded because operationId is caller-supplied free text
- #1618 tooling: deno fmt cannot verify packages/mcp — a deliberately malformed test fixture aborts config parsing
- #1613 agentic: report refused OpenHands commands to their author and align generation retry across dispatch paths
- #1611 agentic: formal evaluator dispatch helper must emit phase/head and acquire the existing claim
- #1604 test(cli): the prescribed deno task --cwd packages/cli test is always red — 3 tests resolve repo-root-relative paths
- #1598 SDK cache-provider throw should name its module identity when two SDK instances are loaded
- #1588 fix(scaffold): omit unreachable provider URL parsers from SQLite workspaces
- #1563 fix(agentic): verdict extractor records NONE when the token is a markdown heading
- #1561 fix(tooling): acceptance-evidence mirror throws on an empty entry list instead of reporting it
- #1551 docs(positioning): establish “NetScript vs …” and “Migrate from …” comparison framework, starting with Next.js
- #1545 chore(quality): register the pre-existing quality-allow population so #1378's linked-issue rule can land without a day-one red gate
- #1542 fix(tooling): quality:gate roots omit published packages, so a green gate is not proof they were scanned
- #1502 RFC: Plugin CLI command contribution architecture — one typed mount and generation seam
- #1461 docs/sdk: getCachedEntry cache-first loader example never revalidates stale entries
- #1378 chore(quality): `quality:scan` cannot see an `any` in an exported type, an unbudgeted allowance, or a docs snippet
- #1448 fix(ai/mcp): make pool startup failure-isolated and propagate cancellation
- #1358 fix(scaffold): the generated /design/components gallery lists 50 of 66 registry items — the whole AI collection is invisible and no gate compares them
- #1296 fix(docs/exports): repair contracts and Fresh UI reference drift, then wire the regeneration gate
- #1350 [sdk-client S1] fix(sdk): preserve contract errors through safe() and isDefinedError
- #1263 service: generated by-id handler returns 500 {defined:false} for a missing row instead of a defined 404
- #1243 auth: session list --stream-url default pins localhost:4437 which no longer exists post-#1211
- #1262 scaffold: db seed is a placebo — SELECT 1 plus a success banner, no rows seeded
- #1650 docs(migration): derive the full Next.js concept map and parity checklist
- #1649 docs(comparison): prioritize and author the post-Session case-study backlog
- #1648 docs(comparison): run blinded human and agent discovery studies
- #1647 docs(comparison): measure Session runtime, freshness, and failure isolation
- #1646 docs(comparison): benchmark Session type continuity and LSP diagnostics
- #1645 docs(comparison): publish a runnable public Session equivalence fixture
