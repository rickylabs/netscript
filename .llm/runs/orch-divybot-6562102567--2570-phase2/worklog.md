# Worklog

## Intake — 2026-11-01

Read complete assignment, AGENTS, harness/PR/tooling skills and prior phase/sample-model memory. No phase 2 PR found; phase 1 #2572 merged. Baseline includes #2582 plugin wiring and #2583 rich data. Deno 2.9.7 available; RTK absent, direct-command fallback.

Owner routing override (verbatim):
> IMPL-EVAL: a fresh read-only Codex reviewer session (Claude is paused until its weekly reset). Cockpit does the cross-family review at READY.
> model: gpt-6-astra
> effort: xhigh

Design checkpoint pending focused inspection; no product edits yet.

## Design

1. Public surface: generated Overview, Records/detail, examples/service, Health, Settings, sign-in and command palette. Existing CLI and route references remain canonical.
2. Vocabulary: ScaffoldOverview/Metric/Record/Records/Capability, page query (search/status/sort/page), localized presentation and actual job/event projections.
3. Ports: typed service client and plugin contracts, existing service discovery, Request locale/AbortSignal, registry asset installer. No new abstract port.
4. Constants: scaffoldStatuses, scaffoldSortFields, SCAFFOLD_PERIOD_DAYS, page size, bounded probes and semantic tones; derive types from existing contracts.
5. Commit slices: S1 page templates/adapters/registry/writer/tests; S2 examples/health/plugins/templates/tests; S3 generated carriers and evidence. Each includes this worklog/context-pack and its scoped gates plus independent review.
6. Deferred: showcase provisioning, invented history, new authentication modes, unrelated component programs. Existing CLI spine/registries are reused unchanged.
7. Contributor path: `packages/cli/src/kernel/assets/app/lib/scaffold-projections.ts.template` defines the overview data; template registry/writer maps each new asset to generated output.

PLAN-EVAL N/A per plan's risk selection. No product edits before this checkpoint.

## S1 — terminal PASS, 2026-11-01

Implemented real KPI deltas, currency-separated totals, daily chart/status donut, rich native tables with page selection/CSV export, server search/status/sort/pagination, localized detail and actual timestamp timeline. Activity selects latest updates across the complete dataset. Extended typed service search before pagination, including PostgreSQL insensitive matching.

Evidence: Deno 2.9.7 structured tests 61/61; scoped check/lint/fmt 11 files; emitted app/service check 125 files; quality:gate passed. Live seeded SQLite: Overview, Records, detail at 1440/390 in light/dark, 12 captures; search/selection/CSV each combination, no browser errors or page overflow. These are S1 checks, not final plugin or visual acceptance. Private screenshots/logs remain outside public source. Independent Astra S1 source supervisor PASS in s1-review.md; all five earlier findings repaired. Supervisor authorizes the S1 signoff commit.

Reconcile: S1 satisfies the first slice on current branch. S2 owns plugin state/progress/events, live-example/health redesign and Settings/sign-in/commands polish; S3 owns complete carriers, CI runtime, final independent code/visual review. No READY claim.

## Base reconciliation — 2026-11-01

Owner requested the latest main merge. Merged a182c37 (Fresh UI core contracts/gaps #2488) normally. The sole conflict was embedded.generated.ts; regenerated from the combined source with gen:assets-barrel, preserving both sources. S1 regression wrapper rerun. S2 will consume the now-merged richer command-palette API.

## S2 progress — 2026-11-01

Implemented bounded reads of typed worker executions and the documented durable workers topic, real progress/state and stream events, measured resource health with false-readiness rejection, designed live service table/managed form/summary, real record results in the command palette, and capability-derived Settings/sign-in panels. Corrected public streams ambient types to merge with Vite. No record mutation is implied by the generic note form.

Current local evidence: 81 focused tests; emitted app/service 126 files; scoped check/lint/fmt; quality:gate; shipped CSS/publish-size 4 tests. Browser matrix passed all eight routes plus command palette in light/dark at 1440px/390px: seeded values, real job/stream data, lowercase reference search, selection/CSV, empty/out-of-range pages, settings save and command results/Escape. The public s2-browser-evidence.json records each check. These are preview checks; independent source signoff is pending and final Figma score/IMPL-EVAL/full CI gate remain S3.

S2 source review round 1: FAIL_FIX for readiness, generic field retention/units, and bounded stream history. Implemented strict background readiness and streams ready endpoint, explicit monetary presentation with raw fallback, all fields preserved, and bounded cursor snapshots with honest catch-up/history-budget copy. Streams preview reads anonymously and never elevates with a service secret; protected topics remain unauthorized. This matches the authored public streams entrypoint while preserving private deployments. Regression and same-session review pending.

S2 review round 2 found structured values in rich mapped fields and rejected cursor recovery. Rich eligibility now requires supported optional field types; otherwise the complete generic table renders nested values. Numeric pagination metadata alone is consumed. Saved cursors reset once on protocol 400/410, preserving bounded reads and access-denial behavior. Added nested-field and populated→reset→recovered regression cases.

## S2 — terminal PASS, 2026-11-01

Same independent Astra supervisor returned terminal PASS after the two correction rounds; see s2-review.md and preserved earlier findings. Final focused wrapper: 86/86 tests; scoped check/lint/fmt 16 source files; emitted app/service 126 files; quality:gate raw exit 0; CSS/publish-size 4/4; review-threads PASS (0 threads). Live seeded service/workers/streams preview passed eight routes plus command palette at 1440/390, light/dark, with search/select/export/settings/palette interactions. Background discovery absent from the app is honestly Not linked, distinct from worker execution status/progress. Behavior-only final edge-case fixes are regression-tested; S3 will regenerate the fixture for final captures. Supervisor authorizes S2 signoff.

Reconcile: S2 completes the planned page/plugin changes against merged main a182c37. No dependency version or lock changes. S3 remains all carriers, full root/check:* validation, fresh seeded captures, independent final IMPL/visual review, and CI runtime. READY is not claimed.

## S3 validation — started

S2 signoff commit66dec2d pushed normally and scope/evidence posted to PR2586. Starting full carrier chain in required order, full root/check:* gates, clean generated plugin fixture, fresh final reviewers, and CI runtime. Prior individual web restart could not stop; read-only ownership inspection precedes owned AppHost cleanup. Public review Markdown hard-break whitespace normalized without changing verdicts.

Carrier chain passed all four tasks in order and produced no additional drift beyond committed assets. All15 root check:* tasks passed. Root lint/fmt and architecture, docs:accuracy, publish:dry-run and release:preflight passed. Additional broad public doc-lint found an existing plugin-streams-core private-type-ref: DurableStreamProducerOptions.instrumentation references StreamsInstrumentation. Its entrypoint and both declarations are byte-identical to origin/main; not introduced or accepted as new debt by this run. CLI public doc-lint is checked separately.

Fresh final IMPL-EVAL round1 FAIL_FIX: numeric CSV fidelity, unsupported empty-state creation guidance, and language quality weights. All three fixed with focused assertions; generic note action now accurately says Validate note. Same independent read-only reviewer is re-steered; no new evaluator per round. Carrier chain reruns after final source fixes, followed by fresh canonical fixture/captures.

Independent visual round 1 inspected all ten references and all 68 actual captures: FAIL_FIX. Six groups need responsive density/craft corrections; Detail, Settings and Sign-in passed. S3 now addresses intact mobile KPI amounts, uncluttered chart ticks and consistent status tones, compact record rows/filters with sticky pagination, compact example route entries, responsive service rows retaining every field, compact truthful Health discovery summary, and a single-close, scroll-bounded command palette. No new product dependency or fabricated values. The original review is retained in `visual-eval-round1.md`.

S3 final source review closed CSV numeric fidelity, unsupported action copy, Accept-Language quality weights and nested mobile label findings. All 122 focused tests, 25 source check/lint/fmt files, 126 generated app/service files, full root check (4,198 files / 35 batches), quality/architecture, CSS budgets, carrier chain and all 15 root check:* tasks passed. The final visual review is separate and remains authoritative for the Figma bar.

A final live POST check found the resource generator exported only the default page and omitted the form handler. S3 exports the builder handler and shows a validation-only confirmation using the public form state. Initial screenshots are unchanged; the submit flow is separately verified. This required fix remains inside the resource-slice surface.

S3 visual round 2: terminal PASS after reopening all 78 distinct reference/actual images. Every page group is at least 8/10 and each theme/width meets the Figma density and craft bar; Command is 8.5. The extension beyond the references is coordinated charts, responsive service records, live operational panels and mixed page/record/action command results. Scope and limits are in `visual-eval.md`. The source reviewer independently approved the responsive changes; final form-handler reconciliation is retained separately. Remaining release step: push the signed-off source/evidence commit, run full scaffold.runtime CI, mark ready and confirm all required checks before the ignored READY report.

S4 CI follow-up: test shard 3 failed one public init/regenerate integration test (1,860 passed, 17 ignored). Locally reproduced: the regenerated island conflicts because init's explicit minor-unit presentation was not persisted for regeneration. Contract first: add an optional validated amount unit to canonical island ownership metadata, recover it only after exact canonical rerender proof for the selected client/procedure, and retain generic unknown-unit behavior. Do not weaken edited/unowned-file conflict protection. Scope: resource-slice contract/renderer, generate-resource use case/tests, public init regression and this run's reconciliation evidence. Existing visual markup is unchanged by provenance metadata; source review and CI must be reconciled to the follow-up head.

S4 CI reconciliation: shard2 confirms the init/command canonical-role parity failure (1,939 passed, one failed); the explicit sample-unit parity correction passes locally. The aggregate check-test fails because shards2/3 fail. Both PostgreSQL and SQLite full runtime lanes passed106 gates and failed only behavior.app-home: populated worker/activity sections omitted capability readiness attributes. Restore attributes from actual capability state, preserving unavailable/unauthorized/empty/absent semantics. A rendered-dashboard regression invokes the unchanged runtime assertion against populated panels and all negative states. This adds dashboard template, its existing test module and generated carrier to S4; no visible design or probe weakening.

S4 — terminal PASS: same read-only Astra source reviewer approved explicit unit provenance, then readiness-marker reconciliation. 163/163 focused tests passed, including both failed CI tests; source wrappers7, generated126, root4198/35batches, quality/architecture, carrier4 and all15check:* passed. Live canonical seeded service/workers/streams passed unchanged behavior.app-home with both capabilities ready. No visible presentation changes since visual PASS. Latest origin/main remains a182c37 and is already merged. Commit/push S4, then rerun full CI on its exact head; READY remains pending.

S5 CI contract reconciliation: S4 test3 is green (1,861passed,0failed), and SQLite runtime passed the restored Overview gate before exposing obsolete behavior.app-reference expectations for the former Cache-first query/Managed form/Deferred summary headings. Update the E2E expected headings to the authored Service records/Validate a note/resource summary surface, preserving seeded-cell requirements, both viewport sizes and every route. Strip script bodies before semantic-marker checks so hydration-only strings cannot satisfy them. Scope: app-reference probe/tests and run evidence; no product or visual change. Same source reviewer and full CI rerun required.

S5 — terminal PASS: same independent read-only Astra source reviewer confirms current authored headings and unchanged route/viewport/seeded-cell scope.63probe/builder/registry tests, scoped2filecheck/lint/fmt and quality/architecture PASS. Live browser DOM passed the updated assertions on the seeded Orders example plus freshly CLI-generated People resource at1440/390; fixture labels adapt Users→Orders and Seed User→Seed Order only. Owned preview stopped. No product/visual/carrier changes; source manifest reconciled. Rerun full CI after this signoff commit.

## S6 — owner polish checkpoint, 2026-11-01

Owner direction places PR #2586 on hold and supersedes the previous READY. Baseline bc0d1cd; normal merge of origin/main a182c37 is already satisfied. Same branch and evaluator override; no rebase or force push.

1. Public surface: five weekly count bins with axis and hover/keyboard values; varied sample dates and natural names; neutral cancellations and declines; genuine background readiness; consistent filters and record names.
2. Vocabulary: weekly bin is a consecutive group of up to seven UTC days within the current 30-day period; background readiness means the child's own registry and dependency flags, never the API sibling's availability.
3. Ports: existing service projections, ChartBlock, generated Aspire resource maps and server-only discovery, child /health, canonical sample factory. No dependency or authentication changes.
4. Constants: named seven-day bin width and deterministic sample day offsets/time slots; existing theme tokens for ink, field sizing and typography.
5. Slice: S6 implements required #2587 items 1/2/5/6 (owner list 1–4), meaningful focused tests, source and emitted gates, live screenshots and independent source/visual review; commit includes this run. Carriers and all check:* gates plus full runtime CI required on final head.
6. Deferred scope: assess record mutation event publication and seed-triggered jobs separately; preserve them in #2587 if their lifecycle/authentication work cannot fit the roughly two-hour window. Do not present fixture-triggered work as shipped seed behavior.
7. Contributor path: app/lib/scaffold-projections.ts.template explains chart data; service/sample-records.ts.template owns seed realism. Existing canonical scaffold README remains the architecture entry point.

Architecture: CLI/tooling archetype 6 plus existing Fresh UI component contract. Shared ChartBlock needs an opt-in interactive value mode because the current component has neither focus targets nor hover values; retain default rendering for existing consumers. Aspire generator passes background resources to app registration and injects only readiness-bearing Deno/KV child endpoints server-side. No new public network API or architectural debt.

### S6 optional-scope decision

Keep #2587 open for issue items 3/4 (owner items 5/6): attributed record create/update stream events require a distinct event contract and explicit topic access/actor mapping; automatic seed execution needs an idempotent handoff because DB CLI mode returns before plugin/worker registration. Neither should be improvised as UI data or a seed-time call to an absent worker. The roughly two-hour pass prioritizes the four required groups and repeats full live, independent review and CI gates. The acceptance fixture continues to trigger its real health-check job explicitly; that demonstrates progress/events but is not claimed as shipped seed automation.

### S6 implementation and local evidence

Independent source round1 found generic QueryResult cancellation still destructive; corrected it, added rendered cancelled/failed coverage and regenerated canonical goldens. Same evaluator round2 PASS. Browser found class-only filter selects missed Utility scope rules; replaced them with installed shared Select. Allfourvariants now report32pxheight/14pxsans for each control. Fresh40-record SQLite workspace with workers+streams reports5healthy resources including the actual background child. Explicit fixture health-check execution completed100% and generated real stream events.

Deno2.9.7:79focusedtests,232regressions,11renderer/goldenchecks and28finalparity/CSSchecks passed (overlapping groups); scopedcheck/lint/fmt10files, emitted134files and root4198files/35batches passed. Quality/architecture and all15rootcheck:* tasks passed.68freshscreens and browserinteractions passed allfourvariants. Independent newvisual review and new-headCI stillpending; no READY untilbothpass. See polish/validation.json and polish/source-review.md.

### S6 supervisor sign-off and reconcile

Independent source PASS and fresh independent visual PASS: all78images inspected (10Figma,68actual); everypagegroup/allfourvariants meetsdensity/craftbar, minima8.0–8.5. Requiredowneritems1–4 arecomplete; owneritems5/6remainin#2587. No unresolvedsource/visualfindings. Latestorigin/main remainsa182c37alreadymergednormally. Finalsourcehashesmatchpolish/reviewed-source.json; allrequiredlocalgatespass. OwnedAppHoststopped, zero provenrun-owned survivors;24unknown-ownerentriesleftuntouched. Commit/pushS6normally, thenrequirefullnew-headcore+runtimeCIbeforeNEWREADY.

## S7 — readiness fixture contract correction

New-head core CI reports one failing test in shard6 (1,485 passed): the readiness-splice test inventories repeated lexical names and expected only `endpoint` and `vite`. S6 adds `entry` inside a separate background-discovery loop. Its compile fixture also needs the new BackgroundProcessors config field. All product code and the independent visual verdict remain unchanged.

Checkpoint: (1) public surface is unchanged; (2) vocabulary is an intentional loop-local binding, not a duplicate declaration in one scope; (3) the test still compiles actual generated/spliced helper source against the SDK double; (4) no new constants; (5) one test-only slice updates the inventory and config double, then runs readiness/generator tests, scoped wrappers and independent source review; (6) no additional scope or gate relaxation; (7) contributor entry is prepare-readiness-fixture_test.ts. Push normally and require CI on the new head before READY.

### S7 supervisor sign-off and reconcile

The same independent source reviewer approved the test-only correction. All 58 focused readiness/generator/CORS tests and scoped check/lint/fmt passed. The actual generated-module compile check and all collision/marker negative controls remain intact. All S6 product/visual hashes still match. Both S6 PostgreSQL and SQLite full runtime jobs have now passed, along with all other core lanes; the single test-6 fixture mismatch alone caused the aggregate failure. No additional finding remains. Commit and push S7 normally, then require new-head CI before NEW READY.

## S8 — coordinator cross-family addendum

Owner-authorized follow-up at S7 head `7eb1d7749e829a863b68514e6e601f72a6f1d4f2`; READY is superseded until this slice passes. The review at bc0d1cdf identifies expensive no-Accept liveness, Overview worker N+1 and needless service reads on sign-in/settings.

Design checkpoint: (1) Public surface: generated health route remains SSR by default but no-Accept/wildcard probes use only local liveness; explicit HTML/JSON receives dependency status. Settings/sign-in read configuration without network. Worker summary uses bounded shared execution history. (2) Vocabulary: liveness, dependency status, configured (not runtime-ready), recent execution window. (3) Ports: existing page builder, filesystem topology, typed worker list APIs; no new endpoint. (4) Constants: explicit worker display/history limits; existing health timeouts retained for status requests. (5) One slice S8 changes scoped CLI templates/tests and emitted carriers, then meaningful negative-control, local gates, independent source review, commit/push, full CI/runtime and changed-page live evidence. (6) Deferred: attributed record events/seed execution remain #2587; native updater #859 remains pre-existing. (7) Contributor path: generated shared health helper and scaffold capability templates. Archetype 6 + frontend overlay; existing doctrine boundaries unchanged; no new debt. PLAN-EVAL N/A: localized correction to established contracts. Same read-only Astra reviewer and Cockpit cross-family ownership retained per owner override.

S8 implementation: local liveness payload and SSR fallback; explicit HTML/JSON dependency status; two bounded worker calls (five jobs, fifty executions), latest-per-job correlation and honest unknown for truncated history; configuration-only sign-in/settings with neutral Configured state. Original emitted regression and intentional mutation each failed because no-Accept called records/workers; restored code passes. 39 focused tests, scoped check/lint/fmt, generated 126-file check, root 4,198-file check, quality/architecture and asset carrier gates pass. Independent source review PASS (`polish/s8-review.md`). Live 32-page-variant/four-interaction-set matrix passes; five actual resources healthy and real fixture job/stream activity retained. With records stopped, sign-in/settings still returned HTTP200 in about12ms, explicit JSON reported degraded, and no-Accept SSR remained web-only. Visual continuation and exact-head CI remain required before renewed READY.

S8 visual continuation PASS after inspecting all16newPNGs and alltenFigmaPNGs; changed-page minima8.0–8.5, unchanged views retain S6approval. Owned AppHost stopped after live acceptance. Fresh main fetch still resolves a182c37, already an ancestor. Final core and full PostgreSQL/SQLite CI must pass on the S8 commit before updated NEW READY.
