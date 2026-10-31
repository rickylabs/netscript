# H01 worklog

## Design

1. Public surface: telemetry exports and package versions stay unchanged; its oRPC instrumentation peer is explicitly bounded to the existing API 1.9-compatible 0.223.0 release.
2. Vocabulary: committed fixture authority means recorded versions and integrities, including maintained private consumer graphs; native adaptation means metadata/peer-ID recomputation without accepting any unrecorded dependency; frozen execution rejects further resolution changes.
3. Ports: native Deno resolver, filesystem, subprocess API and PostgreSQL provider. No production abstraction or port added.
4. Constants: instrumentation 0.223.0 has one catalog declaration; Prisma CLI stays 7.10.0; private fixture execution uses --lock/--frozen and no --no-lock bypass. Root/Fresh UI/reference locks own the recorded dependency versions.
5. Slices: bootstrap plan; implementation and gates; independent exact-head handoff. Final scope/gates in plan.md. Every slice updates this run and the draft PR.
6. Deferred: unrelated dependency upgrades, scaffold changes, local scaffold.runtime, readiness/merge and publication.
7. Contributor path: .llm/tools/testing/locked-fixture.ts defines fixture policy. The normalizer reference README gives its deliberate lock refresh recipe.

## Dependency choice

Toolbelt latest stable results: API 1.10.0, instrumentation 0.300.0 and oRPC OTel 1.16.1 are available. deps:why identifies telemetry's tracing plugin as the instrumentation/oRPC consumer. Native API update proved existing core/sdk peers require API <1.10; the experimental update was discarded. The final bound uses an already-resolved instrumentation release and keeps the published stack coherent without unrelated SDK upgrades. consumer-peer-control.ts verifies oRPC OTel 1.16.1 with API 1.9.1 + bounded instrumentation succeeds, while forcing instrumentation 0.300.0 reproduces the missing logs export.

## Local validation

| Gate | Result |
| --- | --- |
| Native command-postgres-conformance.sh | PASS: 5 outer provider tests, none ignored; includes saga atomic transitions, relay/worker delivery and real HTTP crash replay |
| Structured fixture test wrapper | PASS: 17 tests, none ignored |
| Structured telemetry test wrapper | PASS: 66 tests, none ignored |
| Structured scoped check | PASS: 308 files, 3 batches, no diagnostics |
| Structured scoped lint / format | PASS: 12 changed/new source files; owned files only |
| Unlocked consumer positive / negative | PASS: bound exits 0; forced 0.300 exits 1 with missing logs export |
| Workspace publish:dry-run | PASS: full workspace dry run completed |
| Architecture/dependency gate | PASS (receipt exit 0); native Fresh UI lock update; native dependency-edge/peer changes are disclosed in lock-delta.json |
| quality:gate | FAIL on unchanged main docs/site/_plugins/markdown-render-fixture.ts unsafe cast; not suppressed or repaired in this leaf |
| Telemetry doc lint | FAIL, identical to archived clean baseline: 7 findings (6 private-type refs, 1 missing JSDoc); no public declarations changed |
| Telemetry JSR rubric audit | No FAIL findings; existing cardinality warnings; full publish dry run supplies publication evidence |

Structured results and raw receipts are retained outside the public checkout. Public gate summaries omit private machine paths. Run evidence is not a substitute for current-head CI.

## Negative control

locked-fixture_test.ts runs a recorded API dependency successfully, changes its requirement to absent exact API 1.10.0, and verifies frozen execution fails while both the private lock and root lock remain byte-identical. Native adaptation also checks every resolved version/integrity before accepting its private graph. A separate consumer control reproduces the original logs failure. An attempted npm integrity mutation did not fail against Deno's warm cache; it is explicitly NOT claimed as additional integrity/tamper protection (drift.md).

## Reconcile

Bootstrap opened draft PR #2476 from current main. Specific owner rules override dispatcher boilerplate: body uses Refs; draft stays with coordinator; no labels/milestones changed. Implementation stays on the assigned branch. Source package versions are unchanged. Root/Fresh UI lock deltas are required to freeze the existing Prisma generator and declare the bounded telemetry peer. Native resolution also moves driver-adapter-utils 7.10 from Prisma debug 7.8 to 7.10, removes debug 7.8, and changes Prisma client / better-auth peer contexts to include the now-present Prisma CLI and its React peers. The added CLI closure includes lifecycle-script metadata; lockfile-only preparation does not execute those scripts. Exact entry counts and lifecycle-script packages are in lock-delta.json. Final review and CI snapshot follow the implementation commit. Acceptance that command-postgres passes on main remains unchecked until coordinator merge and main verification.

Final local summaries: gate-summary.json. The framework-only quality scan passes; full quality remains red on the unchanged docs cast. Archived baseline telemetry doc lint has the exact same seven findings. These baseline failures are not suppressed and do not introduce a new acceptance claim.

## IMPL-EVAL round 1 repairs

Removed bare package-name overrides. Direct npm import requirements select only satisfying recorded versions, and incompatible requirements fail before preparation. Major/minor and exact selectors preserve separate recorded npm versions. The normalizer reference was rebuilt without the bad dotenv binding; its requested ^16.4.7 now resolves 16.6.1. Its documented native refresh is reproducible, and the reference entrypoint also passes the ordinary repository check context. Root lock includes the legacy dotenv16 probe dependency; full lock counts/edges and lifecycle metadata are in lock-delta.json.

New controls call preparation with unrecorded is-odd (guard throws before execution), reject the API >=1.10 <1.11 requirement against the legacy authorities, keep an open-ended instrumentation range pinned to 0.223.0, and keep a dotenv16 consumer on 16.6.1. Repository lock bytes remain unchanged by those controls. All 17 fixture tests pass. The dead catalog branch in the provider map was removed.

Coordinator comment #issuecomment-6535146563 now authorizes marking ready after blocker-free implementation review to start CI. Final exact-head evaluation and READY still follow CI repair; only coordinator merges.

## CI repair slice

At53b8bbe, CI's cold command-postgres guard rejected node typings26.6.6; no unrecorded version was accepted. Supplying recorded26.6.5 as the private fixture's direct type dependency fixes cold wildcard resolution without a bare override or repository lock change. A new isolated DENO_DIR native provider run passes5 tests. The exact catalog census assertions now expect40 (the two approved new catalog entries), and the snippet-compiler plus fixture-policy regression suite passes15 tests. Independent repair review PASS is appended to evaluate.md. The close-gate's final exact-head publication checkbox remains pending until the final verdict is published; then its job is rerun.
