# Issue #1349 acceptance audit

AUDIT: GAPS 7; DOCS/CONSUMER_PROOF

## Audit identity and authority

- Verification branch: `chore/sdk-client-1349-acceptance-audit`
- Audited commit: `77ad823dcb1874ccfc8964b4679ad92a3a145e0b`
- Remote `main` at audit time: `77ad823dcb1874ccfc8964b4679ad92a3a145e0b`
- Live issue: `rickylabs/netscript#1349`, fetched 2026-09-02; state `OPEN`, updated
  `2026-08-31T02:25:20Z`
- Harness role: separate verification/evaluator session; no product implementation and no changes
  under `packages/` or `plugins/`
- Effective profile: the audited seam is an SDK integration/public-composition surface; this
  artifact uses the docs scope overlay. The issue's 2026-08-13 normative amendment and accepted RFC
  0001 Stage 2 supersede the earlier public-link, callback-array, option-removal, server-handler, and
  dependency-ordering proposals.

The audit uses the live checkbox text. For published claims, the primary evidence is `deno doc` on
the SDK export entrypoints. Focused source reading was limited to tests and the private validation/
adapter boundary needed to prove negative claims.

## Row-by-row verdict

| # | State | Exact shipped surface and evidence |
| --- | --- | --- |
| 1 | **SHIPPED** | `packages/sdk/src/client/mod.ts`: `createServiceClient<TContract, TContributions = readonly []>` accepts `CreateServiceClientOptions.contributions`. `packages/sdk/src/ports/sdk-client-contribution.ts`: `SdkClientContribution` exposes exactly `protocol`, `id`, `context`, `headerKeys`, `responseCache`, and `prepare`; `SdkClientRequestPatch` exposes only `headers`. `deno doc --filter SdkClientContribution packages/sdk/src/client/mod.ts` confirms the published descriptor. The compile fixture `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` pins literal tuple inference, closed descriptor fields, ownership conflicts, and the 16-element budget. |
| 2 | **SHIPPED** | `CreateServiceClientOptions<TContract, TContributions = readonly []>`, `ServiceClient<TContract, TContext = ServiceClientContext>`, and the query defaults preserve source compatibility. `packages/sdk/tests/integration/client-contribution-adapter_test.ts` test **“omitted and explicit-empty contributions produce byte-identical requests”** compares both paths to a fixed URL/method/header/body baseline. The compile fixture preserves pre-RFC `ServiceClient`, `ServiceQueryUtils`, `defineServices`, and exact three-part key uses. Full `deno task check` also passed. |
| 3 | **SHIPPED** | `deno doc` reports `ServiceClient<TContract, TContext = ServiceClientContext>`, `QueryFactory<TContract, TContext = ServiceClientContext, ...>`, `ServiceQueryUtils<TContract, TContext = Record<never, never>>`, and `SdkClientContributionContext<TContributions>`. The RFC type fixture composes auth + locale into the generated client/query context, requires the contributed auth context, and keeps contribution-free uses assignable. |
| 4 | **SHIPPED** | The private implementation is exactly `packages/sdk/src/internal/client-contributions/adapter-ports.ts`, `prepared-call.ts`, and `stable-v1-adapter.ts`; there is no internal barrel or `deno.json` export. `deno doc --filter createStableV1ClientLink` locates the private stable-v1 adapter. Complete `deno doc --json` symbol inventories for `@netscript/sdk/client` and `@netscript/sdk/ports` contain none of `createHttpClientLink`, `ClientLinkPort`, or `ClientLinkCallOptions`. `packages/sdk/tests/client-contribution-private-surface_test.ts` pins those names across root/client/ports/desktop docs and rejects packed private subpath imports. |
| 5 | **SHIPPED** | Supply is closed twice: the published `SdkClientContribution` document has only six fields, and `prepared-call.ts::CONTRIBUTION_FIELDS` exact-validates the same set. Observe is closed by published `SdkClientPrepareOptions`, whose only keys are `context`, `signal`, `procedure`, `transport`, and `input`; `SdkClientTransportDescriptor` has only `kind`, `origin`, `rpcPath`, and `secure`, so no resolved method is present. `client-contribution-validation_test.ts` checks the exact runtime keys and separately asserts absence of method/fallback/max-URL, dedupe, retry, trace, fetch, link, and plugins. The type fixture rejects `link`, `fetch`, `plugins`, `interceptors`, `clientInterceptors`, `adapterInterceptors`, and `retry`; runtime exact-shape tests reject the upstream callback-array fields. Transport-owned context keys `retry`, `retryDelay`, `shouldRetry`, `onRetry`, and `traceHeaders` are reserved, while retry/dedupe/tracing/fetch remain behind the private stable-v1 transport. |
| 6 | **SHIPPED** | `deno doc --filter CreateServiceClientOptions packages/sdk/src/client/mod.ts` shows optional `port?: number` and `timeout?: number`, each with `@deprecated` guidance and explicit no-op compatibility semantics. `deno doc --filter DefineServiceConfig packages/sdk/src/presets/mod.ts` also shows both accepted and deprecated, with #1351 owning disposition. |
| 7 | **PARTIAL** | All rejection classes exist and tests reach them: duplicate id/context/header ownership → `SDK_CONTRIBUTION_CONFLICT`; unsupported family/major → `SDK_CONTRIBUTION_VERSION`; 17 entries → `SDK_CONTRIBUTION_LIMIT`; RFC-rejected dependency/order fields (`dependsOn`, `before`, `after`, `order`, `priority`; compile fixture also `requires`) → invalid closed shape; Desktop contributions → `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED`. The missing half is the row's deterministic diagnostic requirement **naming the conflicting descriptors**. A measured six-case diagnostic probe produced: duplicate id `{contributionId:"test:first"}`; header ownership `{contributionId:"test:second",headerName:"x-a"}`; unsupported version, over-16, dependency-field, and Desktop errors with **no contribution id**. Header/context ownership does not expose the earlier owner's id, and the tests assert codes/phases but do not pin both conflicting owners. The public `SdkClientContributionDiagnostic` has only one optional `contributionId`, so it cannot name both owners. |
| 8 | **SHIPPED** | Reconnect: `client-contribution-adapter_test.ts` pins prepare-once unary retry; fresh iterator reconnect epochs with credentials `[A,A,B,B]`; abort preventing a reconnect; and byte-identical omission. Cache: `client-contribution-cache-query_test.ts` pins sorted server/TanStack partitions, cross-partition isolation, invariant/empty unsuffixed keys, unsuffixed invalidation prefixes, `direct-only` omission, persisted separation, and generated key/query-function pairing. Removal effects are covered across the omitted/empty fixed wire baseline (header), the contribution-free default compile shape (context), and the three-part unsuffixed key (cache). Invalid partitions and abort-before-preparation are the corresponding negative cases. |
| 9 | **SHIPPED** | This is a non-scope assertion under the normative amendment/RFC Stage 2. Live PR file inventories for merged #1834, #1841, and #1886 contain SDK seam/runtime/tests and run artifacts only; none changes `packages/service` server handler/plugin forwarding or RPC deduplication. The public descriptor and `DefineServiceConfig` contain no server-handler fields. |
| 10 | **SHIPPED** | Exact repository commands at the audited SHA: `deno task check` → exit 0, 3,015 files/26 batches/0 diagnostics; `deno task test` → exit 0, 4,869 passed/0 failed/19 ignored; `deno task publish:dry-run` → exit 0 with non-empty package checking/packing output ending `Success Dry run complete`. The focused contribution suite also passed 34/34, and `deno check --unstable-kv packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` emitted its `Check` line and exited 0. |

## Gaps

### Row 7 — diagnostics do not name the conflicting descriptors

Construction does reject every required class, including dependency/order fields under the amended
Stage-2 rule that v1 has no ordering semantics. It does not meet the stricter diagnostic clause.
`validateSdkClientContributions()` stores earlier context/header owners internally, but on conflict
passes only the later `contribution.id` (and sometimes the header name) to the error. Version, tuple
limit, forbidden-extra/dependency-field, and Desktop rejection paths provide no contribution id.
`SdkClientContributionDiagnostic` has no pair/list field for both owners.

What is missing:

1. A diagnostic contract capable of identifying both owners for duplicate context/header ownership
   (or another owner-approved exact interpretation of “naming the conflicting descriptors”).
2. Descriptor identity on unsupported-version, limit, dependency-field, and Desktop errors where
   the acceptance row requires it.
3. Tests asserting the deterministic diagnostic payload, not only code and phase, for all six
   rejection families.

### Docs/consumer proof — two required site pages are absent/stale

`packages/sdk/README.md` is updated: it has a checked TypeScript contribution example, cache-mode/
Desktop guidance, a contribution-aware export table, the transport-ownership statement, and no
“escape hatch = fork the link” paragraph. `packages/sdk/tests/readme-doctest_test.ts` passes, and
`client-contribution-observability_test.ts` proves one contributed header retains the final
`traceparent` and CLIENT `rpc.client` span without leaking the header value.

The two explicitly required site pages are not updated:

- `docs/site/services-sdk/sdk.md` contains no contribution example or contribution vocabulary and
  still presents the older client option table.
- `docs/site/reference/sdk/index.md` contains no contribution symbols; its client table still spells
  `createServiceClient<TContract>(options): ServiceClient<TContract>`, and its `./client` subpath
  description says only “createServiceClient and the contract algebra.”

Under the amendment, the original request to list a newly public transport seam is superseded—the
transport/link stays private—but those pages still need the worked public contribution example and
the actual contribution/context/error symbol surface. The required consumer proof therefore remains
partial even though the README and runtime span/header proof are present.

## Acceptance-evidence disposition

No fenced evidence block is present. The mirror is intentionally not armed because row 7 and the
issue's Docs/consumer proof contract are not fully shipped. Adding a complete ten-entry mapping now
would overstate the measured state and could cause all ten boxes to be ticked despite known gaps.

## Command ledger

All commands ran from
`/home/agent/projects/netscript/worktrees/007-leaf-1349-audit`. Multi-command shell invocations list
their meaningful child exit codes where those differed from the shell's final status.

| # | Command | Exit / observed output |
| --- | --- | --- |
| 1 | `sed` reads of the full requested skill files: `netscript-harness`, `netscript-deno-toolchain`, `netscript-pr`, `netscript-tools`, and `rtk` (initial combined read, then complete per-file reads); `wc -l` over those files | 0; initial combined display was truncated, so complete reads were repeated. Counts: 365/148/393/234/82 lines. |
| 2 | `sed` reads of `.llm/harness/workflow/{activation,run-loop,lane-policy}.md`, `gates/{archetype-gate-matrix,plan-gate}.md`, and evaluator protocol/verdict files | 0; non-empty harness authority output. |
| 3 | `sed` read of `netscript-doctrine/SKILL.md`, archetype README, and attempted `ARCHETYPE-2-port-adapter.md` | 2; the guessed archetype filename did not exist. Follow-up read used `ARCHETYPE-2-integration.md` and exited 0. |
| 4 | `rg --files .llm/harness` piped to the focused docs-scope `rg` expression | 0; resolved `.llm/harness/archetypes/SCOPE-docs.md`. |
| 5 | `sed` reads of the docs overlay and relevant doctrine files 01, 02, 04, 05, 06, 07 | 0; non-empty doctrine/overlay output. |
| 6 | `rtk proxy gh issue view 1349 ...` | 127; `rtk` is not installed/on `PATH`. Raw commands were used thereafter. |
| 7 | `gh issue view 1349 --repo rickylabs/netscript --json number,title,state,body,url,labels,milestone,updatedAt` | 0; full live amendment and ten unchecked rows returned. |
| 8 | Ground-truth `git status --short --branch`, `git rev-parse HEAD`, `git rev-parse --abbrev-ref HEAD`, and `git merge-base HEAD main` through `deno eval` | all 0; clean branch, SHA `77ad823dc`; local `main` was stale (`merge-base 9e3b8bcba`). |
| 9 | `git ls-remote origin refs/heads/main` | 0; remote `main` = audited SHA `77ad823dcb1874ccfc8964b4679ad92a3a145e0b`. |
| 10 | Initial `find .llm/runs/chore-sdk-client-1349-acceptance-audit--1349 ...` | 1; run directory did not yet exist. |
| 11 | `sed -n '1,240p' packages/sdk/deno.json` plus archetype/docs-path reads | manifest/archetype reads 0; the first two guessed docs-scope paths exited 2, followed by the resolved overlay read in command 5. |
| 12 | `deno doc packages/sdk/src/{client,ports,query}/mod.ts` and `deno doc packages/sdk/mod.ts` | all 0; non-empty public documentation. |
| 13 | `deno doc --json <client-or-ports>` piped to `jq` | 127; `jq` is unavailable. |
| 14 | First two Deno JSON parser attempts (`d.nodes is iterable`, then symbol-key inspection) | parser attempts 1/0; established the Deno 2.9 JSON shape (`nodes` object → module `symbols` array). |
| 15 | `deno doc --json packages/sdk/src/{client,ports}/mod.ts` piped to the Deno exported-symbol inventory evaluator | both pipelines 0; prohibited link symbols absent, contribution symbols present. |
| 16 | `rg --files` and focused `rg -n` over SDK contribution internals/tests and the three required docs | 0; enumerated three private adapter files and the focused test corpus. |
| 17 | Focused `rg -n` test/type-declaration expression over the contribution files | 0; returned all relevant named tests/negative fixtures. |
| 18 | Focused `rg`/`sed` reads of RFC 0001, including public contract, internal ports, budgets, Stage 2, conformance, docs, and rejected dependency ordering | 0; RFC says v1 has no ordering fields and Stage 2 owns this leaf. |
| 19 | Focused `sed` reads of `client-contribution-{validation,private-surface,observability,cache-query}_test.ts`, `integration/client-contribution-adapter_test.ts`, and `sdk-client-contributions-rfc_type.ts` | 0; non-empty exact assertions. |
| 20 | `rg -n -C 5` and focused `sed` over `docs/site/services-sdk/sdk.md`, `docs/site/reference/sdk/index.md`, and `packages/sdk/README.md` | 0; README proof present; both site pages lack contributions. |
| 21 | Structured focused test wrapper over six contribution/README modules | 0; 34 passed, 0 failed/ignored, 12,420 ms. |
| 22 | `deno check --unstable-kv packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` | 0; emitted `Check packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`. |
| 23 | `deno task check` | 0; structured result selected 3,015 files in 26 batches, 0 failed batches/diagnostics. |
| 24 | `deno task test` | 0; structured result 4,869 passed, 0 failed, 19 ignored, 4,888 total, 260,324 ms. |
| 25 | `deno task publish:dry-run` | 0; non-empty workspace check/pack output, terminal `Success Dry run complete`. |
| 26 | `rg` for construction error codes/messages in focused tests | 0; showed tests pin codes/phases but not both conflict owners. |
| 27 | `deno doc --filter validateSdkClientContributions`, `createPreparedOutboundHeadersPort`, `createStableV1ClientLink`, and `SdkClientContributionError` | all 0; exact private/public symbol locations returned. |
| 28 | Focused `sed` reads of `prepared-call.ts` validation/error paths and `client/errors.ts` diagnostic type | 0; proved the single optional `contributionId` payload and missing earlier-owner fields. |
| 29 | `deno eval --config packages/sdk/deno.json --unstable-kv <six-case diagnostic probe>` | 0; printed all six JSON diagnostics quoted in row 7. |
| 30 | `rg`/`sed` reads of prior #1349 harness artifacts and `git log --oneline --reverse -- <contribution paths>` | 0; re-baselined prior completion claims; commits `58a4a10eb`, `8f1fcb2bc`, `f9e485f8b`. |
| 31 | `gh pr view {1834,1841,1886} --repo rickylabs/netscript --json ... --jq ...` | all 0; all three merged, with non-empty file inventories and no service-handler files. |
| 32 | Focused `deno doc --filter` for `CreateServiceClientOptions`, `DefineServiceConfig`, `ServiceClient`, `QueryFactory`, `ServiceQueryUtils`, and `SdkClientContributionContext` | all 0; defaults and both deprecated fields present. |
| 33 | Focused `sed` of `prepared-call.ts::CONTRIBUTION_FIELDS` plus `deno doc --filter SdkClientContribution` and `SdkClientPrepareOptions` | 0; exact supply/observe boundaries returned. |
| 34 | Final pre-write ground truth: `git status --short --branch`, `git diff -- packages plugins`, and `git ls-remote origin refs/heads/chore/sdk-client-1349-acceptance-audit` through `deno eval` | all 0; branch clean, product diff empty, remote audit branch absent. |
| 35 | Post-write inspection, `deno fmt --check <audit.md>`, zero-block `rg`, `git status --short`, `git diff -- packages plugins`, and `git diff --check` | inspection 0; format check 1 (Deno proposed realigning the evidence tables, so no mutating formatter was run); zero-block `rg` 1 as expected; all git checks 0, with only the new audit run directory untracked and product diff empty. |
| 36 | Verdict/row inventory, zero-block `rg`, explicit `git add <audit.md>`, `git diff --cached --check`, cached stat, and cached product diff | inventory 0; zero-block `rg` 1 as expected; add/check/stat/product-diff all 0; staged delta was one 130-line audit file and no `packages/`/`plugins/` content. |

No Aspire, Docker, browser, or `e2e:cli` command was run. No issue, PR, label, milestone, checkbox, or
GitHub comment was mutated.

The commit and explicit-refspec push necessarily occur after this committed evidence snapshot; their
real exit codes and resulting commit/remote SHA are part of the supervisor handoff report.
