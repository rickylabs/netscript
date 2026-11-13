# Plan R2 — corrective checkpoint for independent review

Source #2610; assignment rickylabs/harness#832; same draft PR #2611.
Coordinator-authorized R2 planning/evidence only. No independent PASS is claimed.

R1 remains FAIL and immutable. Full verdict: plan-R1-verdict.md, SHA-256
`731003f7a6101fa00b594d6578f6232533ac68b2b775427e977bc7a4521d3cb1`.
The R1 plan, manifest, reproducer and actual RED evidence retain their exact bytes.
This adjacent R2 plan supersedes R1 for the next review only; it does not overwrite
history or reset evaluation rounds. See dispositions-R2.md for B1–B3 and A1–A5.
Parent supplies independent review; no builder evaluator/design-agent launch.
Baseline: `12c981104c1d13812d7119798911a0937e74348c` (observed current `main`).

The smallest proposed correction belongs in the SDK's existing stable oRPC adapter
and transport policy. Keep the released public client/contribution APIs, real GET
codec and upstream deduplication plugin. No dependency upgrade is required by the
proposed design: installed oRPC 1.15.5 already exposes the required public filter
and group options. This is a source proposal, not a working or released fix.

## Mandatory continuation gate

Parent must obtain independent **exact-plan PASS**, bound to this file's SHA-256,
the immutable manifest and baseline, then explicitly authorize **product
continuation**. Both are required before source or existing tests change.
This builder must not dispatch evaluator/design agents, self-certify, merge,
publish, edit consumer cohorts, or run application/database/shared services.
After the plan/evidence checkpoint, stop. A draft PR is the review surface only.

## Research and architecture

See sealed R1 `research.md`, `red-evidence.json` and `get-context.repro_test.ts`,
plus `research-R2.md`, `api-path-evidence-R2.json`,
`api-path-controls-R2_test.ts` and `upstream-comparison-R2.json`.
The unchanged SDK yields five semantic failures and five positive controls.
Installed oRPC replaces context with static `group.context`; the SDK supplies
an empty default context and then reads cache/signal from it. Upstream retains
a Request signal, so single-call effective cancellation already works. Its
dedupe signal waits for all callers, and becomes absent with an unsignalled
peer; it cannot independently settle an aborted caller.

Archetype 2 integration; doctrine verdict **Keep** for `packages/sdk`.
Preserve discovery/client/cache boundaries. Apply the docs overlay to this
checkpoint. Axioms A1/A5/A6/A7/A10/A14 require package-owned policy, composition,
platform cancellation, minimal seams and meaningful regression controls.
Do not introduce a second dedupe engine, mutable shared caller context, DI,
private upstream access, new public options, root exports, or consumer shims.

Relevant existing debt: `db-doc-baseline-2039` and `desktop-doc-baseline-2041`
record SDK/Fresh documentation residue. They are baseline observations, not
blanket waivers. Compare each export's diagnostics before accepting any debt;
no new diagnostic, suppression, slow type or architecture violation is allowed.
No new architectural debt is proposed.

## Locked behavior

1. **One effective cache decision per transport attempt.** Preserve explicit
   public `context.cache` for every Fetch `RequestCache` value. If omitted,
   materialize the existing resolved contract policy (`no-store`, `default`, or
   `force-cache`) in the attempt context before the HTTP link. Keep existing
   supported override precedence. In particular, do not reinterpret the existing
   policy resolver's tests for `reload`; raw Fetch modes travel on the direct
   path without becoming a new contract-policy vocabulary.
2. **Separate immutable cache groups.** Generalize the existing package-private
   group descriptor to the three policy cache literals. Keep force-cache,
   introduce no-store, and make default match default exactly. Each group has
   explicit immutable `{ cache: <its mode> }`; no catch-all empty context. Map
   all descriptors through the existing HTTP adapter. No caller context is
   installed on a shared group and no first-caller signal is copied to peers.
3. **Conservative dedupe eligibility.** Extend the internal policy predicate
   with an optional package-owned options object carrying the effective signal
   and explicit Fetch cache mode. A call is eligible only for an actual encoded
   GET with no effective signal and a compatible cache mode (omitted or one of
   the three grouped modes). The adapter supplies **options.request.signal from the encoded standard
   request**, and separately verifies `options.request.method === 'GET'` before
   upstream dedupe. This optional signal must correspond to the wrapper's existing
   `callOptions.signal ?? callOptions.context.signal` selection; never consult
   context.signal alone. Perform this check before Web Request conversion, whose
   always-present inert signal would incorrectly exclude unsignalled calls. Calls with a signal,
   including a combined request/deadline signal, use the ordinary SDK/oRPC path
   independently. Additional Fetch modes (`reload`, `no-cache`, `only-if-cached`)
   bypass dedupe and retain their exact cache semantics. Eligible unsignalled
   identical GETs, including no-store calls within their own group, still
   coalesce. Different inputs, methods, headers, cache modes and clients do not.
4. **Effective cancellation at fetch.** The HTTP fetch adapter forwards the
   transport's effective signal from `init.signal ?? request.signal`, rather
   than overwriting it from `context.signal`. The current upstream adapter
   constructs a real Request carrying that signal. Preserve existing init
   fields, contribution headers, tracing and response handling. No synthetic
   replacement signal, new cancellation manager, or swallowed abort errors.
5. **Public context ownership remains intact.** Contribution preparation still
   happens once per logical epoch using its declared context. Retry and tracing
   remain in their existing outer/preparation layers. Group context contains
   only safe equivalent transport values after preparation; independent calls
   keep their original context and signal. Tests must show per-caller auth and
   locale/trace data and retry callbacks stay isolated across concurrent calls.
6. **Wire/API compatibility.** Keep contract-derived methods, paths, input/output
   types, URL-length handling and native fallback unchanged. No caller GET-to-POST
   adaptation, raw-fetch bypass, local SDK copy, package pin change, dependency
   override or assertion weakening.

## Ordered implementation slices, after authorization only

| Slice | Files and purpose | Proving gates |
| --- | --- | --- |
| S0-R2 (this checkpoint) | New adjacent R2 plan, retained R1 FAIL, dispositions, API/upstream evidence and manifest in this run only; all sealed R1 files unchanged. | New API controls 2 semantic RED / 2 GREEN with sanitizers ON, scoped wrappers and LEAK-S0-R2 over indexed run content and added patch. Independent R2 review pending. |
| S1 | `packages/sdk/src/internal/transport-policy.ts`, `packages/sdk/tests/transport-policy_test.ts`: typed cache groups and explicit conservative eligibility contract. | Policy cache truth table, encoded-signal eligibility and deliberately strengthened old catch-all assertions; scoped wrappers, quality:gate and **LEAK-S1**. Deno ops/resources sanitizers ON. |
| S2 | `packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts`, `packages/sdk/src/client/http-client-link.ts`, new `packages/sdk/tests/integration/get-context_test.ts`, existing `packages/sdk/tests/integration/client-contribution-adapter_test.ts`: materialized cache, effective signal, public integration regressions. | All retained assertions GREEN; public API/dialect matrix, real fetch cancellation/cache/identity, compiler-0 assertion-RED/exact-H-restored-GREEN mutations, existing suites, scoped wrappers, quality:gate and **LEAK-S2**. Sanitizers ON. |
| S3 | `packages/sdk/README.md` plus this run's evidence/context/worklog/drift: document transport dedupe ONLY for eligible unsignalled actual GETs, TanStack per-key sharing and queryUtils two-fetch/cancellation impact, plus queries pre-existing no-cancellation. New worklog/context/drift evidence stays adjacent so R1 remains sealed. | Full SDK checks/tests, all-export docs, JSR audit/dry-run, applicable root gates, mutation receipt audit, **LEAK-S3**, sanitizers ON, exact-head independent IMPL-EVAL and required CI. Parent-owned runtime/production gates remain explicit. |

Each product slice needs parent/supervisor substantive review before sign-off,
its own commit/push/evidence, and updated worklog/context. No implementation file
outside this bounded list is pre-authorized. New source requirements are drift
and require parent rescoping. No source mutation, even for a negative control,
is authorized during S0.

## Required behavioral matrix

- Authenticated and public GET: explicit no-store and contract metadata fallback;
  canonical bearer preparation; assert final fetch init cache and effective signal
  as well as unchanged route, method, headers and decoded result.
- No signal; request signal; real elapsed `AbortSignal.timeout`; combined
  `AbortSignal.any`; already aborted; abort while contribution preparation waits;
  lower-link top-level versus context-signal precedence. Assert causality and
  pending-fetch rejection, not just signal object presence. Abort reason must
  propagate without cancelling a surviving caller.
- Two independently signalled callers (first aborts, second completes); same
  signal on two calls (both cancel); mixed signalled/unsignalled; reverse enqueue
  order; both abort; different deadlines. Assert per-caller settlement and
  transport cancellation. Clean up listeners, timers and pending promises.
- Positive dedupe: identical unsignalled default, force-cache and no-store calls
  each yield one actual fetch per group and correct data to every caller.
  Negative controls: different cache modes including overrides of force-cache
  metadata; all additional Fetch modes; different identity/locale/trace headers,
  input, procedure, method or client. Mixed cache modes must never share a fetch.
- Native POST and long-URL fallback preserve current behavior; only an actual
  GET enters dedupe. Retry disabled/enabled with and without contributions,
  once-per-epoch preparation, retry callbacks and tracing must retain existing
  semantics. Retain existing type/contribution conformance and URL resolver tests.
- Save compiling assertion RED / restored GREEN controls for missing no-store,
  lost effective signal, unsafe group merging and signalled dedupe eligibility.
  A compile error, timeout or skipped test is not a semantic RED. Preserve the
  original baseline reproducer; never weaken the consumer's unchanged regression.

## Gate and release boundary

Use the repository's structured check/test/lint/fmt wrappers, with `--unstable-kv`
and source TypeScript scopes, and the durable gate runner for allowlisted commands.
Framework slices require `deno task quality:gate` (quality scan plus architecture),
not only scoped wrappers. Archetype-2 fitness gates F-1 through F-12 and F-14
through F-19 need automated or explicit manual evidence.

Implementation qualification must include the full `packages/sdk/tests` suite,
canonical bearer tests in `packages/plugin-auth-core/src/sdk`, all SDK entrypoints,
`deno task doc:lint --root packages/sdk`, the repo JSR audit helper, SDK native
publish dry-run, dependency provenance/audit, and required current-head CI. Honor
the repository's pre-merge full CLI E2E bar. The single command
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` and production
E2E require a parent-authorized resource-capable lane: this builder's explicit
runtime fence prohibits running them here. Mark them **unproven** until real
receipts exist; do not substitute a static scan or local unit count.

JSR planned-surface scan: the manifest is scoped, has description/license and
explicit export/publish rules. No new exported symbols, dependency ranges,
entrypoints, CommonJS, runtime file reads, import attributes or slow-type
carve-outs are proposed. Publish filtering continues to exclude tests. Doc-lint
baseline and native dry-run remain necessary; they are not publication proof.

Source qualification cannot fulfill #2610's published-surface acceptance. Eric
chooses and cuts a coherent supported release; parent links the exact source,
published version/cohort and unchanged consumer-regression result through the
existing downstream notification path. This builder cannot publish or alter the
consumer. Use `Refs #2610` until the source issue's full acceptance is proven;
do not auto-close it with this plan-only PR.

## Risks, mitigations and open-decision sweep

| Risk | Mitigation |
| --- | --- |
| queryUtils always supplies a signal, so separate query executions lose transport coalescing. | Explicit per-API decision/tests: two keys/QueryClients mean two independently cancellable wire requests. TanStack same-key sharing remains; unsignalled queries/direct GETs still coalesce. Document the cost, never promise global dedupe. |
| Metadata cache is lost on a direct non-dedupe path. | Materialize cache before dispatch; test metadata-only and explicit overrides on both paths. |
| Unsupported grouping modes silently inherit another cache policy. | Bypass dedupe for the additional public Fetch modes and forward the explicit value. |
| Retry or tracing loses caller-specific values. | Keep preparation/retry order and compare existing conformance; explicit multi-caller/header/callback controls. |
| Repository lock differs from consumer oRPC resolution. | Record actual 1.15.5 graph; never equate it with consumer 1.16.1. Exact released consumer qualification belongs to the parent release step. |
| Source-only green is reported as release acceptance. | Separate source gates, authorized runtime CI, published cohort, and unchanged consumer proof. |

No open implementation-design decision is intentionally deferred. Parent exact-plan
review is **must resolve now** before S1. Exact release version, release timing,
resource-capable runtime executor and downstream qualification timing are **safe
to defer** to the authorized parent/owner because they do not alter this source
design. If the independent review requires shared signalled dedupe rather than
the conservative policy, or an upstream fix, rescope and reseal the plan before
any implementation. No upstream dependency repair is assumed necessary or opened
by this builder.

Deferred: framework-wide redesign, upstream dedupe engine changes, new SDK
transport options, changes to auth/query-cache semantics, unrelated debt cleanup,
consumer adoption, release or runtime operations. Contributor starting point:
`packages/sdk/src/internal/transport-policy.ts`, then its existing HTTP adapter.

## B1: per-API impact and mandatory documentation

| Public API/execution | Signal reaching SDK | Planned transport and cancellation outcome |
| --- | --- | --- |
| clients.* without signal | None on encoded standard request. | Equivalent actual GETs in the same safe cache group still coalesce. |
| clients.* with public context signal or lower-link top-level signal | Existing top-level-over-context selection. | Each invocation uses its own normal SDK/oRPC request; correct pending Fetch abort/deadline, no peer cancellation. |
| queryUtils.* via real TanStack query execution | **Always supplied by TanStack** and forwarded as top-level signal by oRPC; context.signal may be absent. | Every separately executed query bypasses transport dedupe. Different keys in one QueryClient, or the same key in different QueryClients: **two executions, two actual GET fetches**, independent wire cancellation. This is a deliberate performance/semantics change, not exceptional user opt-in. |
| queryUtils.*: two observers, one key, one QueryClient | One shared TanStack query execution supplies one signal. | One fetch because TanStack shares the query by key within that client, not because transport has global dedupe. Observer removal/cancellation follows TanStack ownership; do not independently abort another observer's shared query. |
| queries.* direct factory action, no explicit context signal | No signal manufactured by the factory. | Existing server CacheProvider path remains separate; on cache misses/equivalent SDK requests, unsignalled GET transport coalescing remains. |
| queries.*.queryOptions under TanStack, no explicit context signal | Current generated queryFn ignores TanStack's supplied signal. | Existing unsignalled SDK calls can coalesce across different keys. **No new TanStack-to-transport cancellation is promised**. The pre-existing missing cancellation bridge is deferred (A5), not silently fixed here. |
| Either dialect with an explicit context signal where supported | Respect current effective signal precedence. | Only calls whose actual encoded signal is absent are eligible. QueryUtils top-level TanStack signal wins over a distinct context signal under the existing wrapper contract. |

The S2 matrix must run the two real-observer queryUtils variants (different keys,
different QueryClients) and assert two preparations/signals, two GET fetches,
one aborted wire request when A is cancelled, B still pending until separately
completed, and correct result for B. Add a positive same-key/same-client observer
case and the unsignalled queries queryOptions coalescing case. Adjacent R2 controls
already execute these real public paths: **2 semantic RED / 2 GREEN** on unchanged
source; the failing transport count prevents claiming the later causal
cancellation assertions have passed. No raw-fetch caller, alternate SDK or local
query implementation substitutes for these controls.

S3 **must edit packages/sdk/README.md's Transport policy and Two query dialects
sections** to explain these distinctions and the two-fetch cost. State that
transport dedupe is only for eligible **unsignalled actual GETs**. TanStack shares
work by query key within one QueryClient; separate keys/clients are independent.
Do not promise global dedupe across query clients or observers. State queries'
pre-existing cancellation limitation separately. No query-factory or queryUtils
implementation change is added to this plan.

## A2/A3/A4: exact policy and assertion contracts

Required-auth metadata `{ policy: { cache: 'no-store' } }` is a default for this
transport resolver, not a newly introduced mandatory security/cache restriction.
Explicit caller cache wins, including with required-auth metadata:

| Caller cache with required-auth metadata no-store | Fetch cache | Dedupe without encoded signal |
| --- | --- | --- |
| omitted | no-store | Eligible in no-store group. |
| no-store | no-store | Eligible in no-store group. |
| default | default | Eligible in default group. |
| force-cache | force-cache | Eligible in force-cache group. |
| reload / no-cache | Exact requested mode. | Independent SDK path; no grouped-mode reinterpretation. |
| only-if-cached | only-if-cached, unchanged. | Independent SDK path. Preserve Fetch's same-origin-mode requirement and its native error for incompatible mode; never turn it into no-store success or change the SDK's Request mode as a workaround. |

All signalled versions bypass transport dedupe. Assert wire init values with
canonical required-auth contribution preparation, and separately validate native
Request/Fetch compatibility. A boundary stub does not test browser cache policy.
Existing auth and response-cache policies are not redesigned.

Eligibility consumes the **actual standard request.signal** seen by the dedupe
filter, not context.signal and not the later Web Request's always-present signal.
Test context-only, top-level-only, both distinct signals, abort during asynchronous
preparation, and TanStack forwarding. The selected signal must correspond to
what cancels Fetch; M-SIGNAL-SOURCE must kill a context-only predicate regression.

Future S1 deliberately strengthens these existing transport-policy_test.ts
assertions; R2 does not edit the old test file:

- Replace `cacheGroups[1].condition(cached) === true`, the old catch-all claim,
  with exact-membership negatives. Lock order **force-cache / no-store / default**.
- Force-cache call: only group 0 true. No-store: only group 1 true. Default: only
  group 2 true. Explicitly require the default group rejects force-cache and
  no-store. Each context explicitly carries its own immutable cache literal.
- Keep method inference (including HEAD's current inferred GET), method override
  validation, invalid-path guards, max URL/native fallback and explicit supported
  cache override assertions. Keep reload's existing normalized-policy assertion
  while separately testing its exact raw Fetch mode on the independent path.
- Add encoded-signal/actual-method eligibility controls; do not delete, skip or
  weaken acceptance regressions. M-DEFAULT-CATCHALL must fail the strengthened
  semantic group contract with compiler exit 0.

## B2: publication-content gates and Deno sanitizers

Each product slice has a **content LEAK gate distinct from resource hygiene**:
LEAK-S1 (policy/test patch and committed run), LEAK-S2 (adapter/integration/mutation
patch and committed run), LEAK-S3 (README/final evidence patch and committed run).
LEAK-S0-R2 scans this planning correction. scan-leaks-R2.ts reads only git views
and content; it reads no secret store and touches no runtime resource. Findings
contain category/file/line only, never a matched secret/address value.

```text
deno run --allow-read --allow-write --allow-run=git .llm/runs/orch-divybot-832--sdk-get-context/scan-leaks-R2.ts --slice <LEAK-Sn> --base <R2-checkpoint-sha> --head <exact-slice-sha-or-STAGED> --output <new-evidence-path>
```

For every slice, scan the full committed run directory plus the added source
patch from the R2 checkpoint; save hashes, exact candidate identity, non-empty
selection and content findings. Reconcile staged versus committed content and
rerun at exact committed head. Check secrets/credential strings, operator paths,
network addresses, session identities and usage metrics. Allow only explicitly
listed non-operational documentation/reserved fixture hosts; never exempt an
entire test/run file or print an offending payload. Reject tracked raw local
reports. Follow the pattern scan with substantive manual review of every added
run/source hunk for values the regex cannot classify. A pattern scan alone is
not proof that all sensitive content is absent. No blanket suppression or owner
resource scan can discharge a content finding.

**maint:leak-check reports runtime resources and ownership; it is not a content
leak scanner and is never LEAK-S1/S2/S3 evidence.** No resource starts or cleanup
are authorized here. Deno **sanitizeOps and sanitizeResources stay true** for all
new regression/mutation tests, and enabled for existing suite runs. Never use
false sanitizer options, leaked pending fetches, skipped tests, ignored promises,
disabled checks or blanket flags to green the matrix. Clean listeners, timers,
observers and pending operations in finally; sanitizer failure is a failed gate.

## B3: mandatory mutation qualification and receipts

**mutation-protocol-R2.md is normative for S2/S3**, including exact committed H,
unchanged test identities, compiler-0 requirement, semantic-only RED classification,
finally restoration with git blob/SHA equality, actual restored GREEN, explicit
receipt paths and the complete named negative/positive matrix. It includes
M-CACHE, M-METADATA, M-INIT-SIGNAL, M-EFFECTIVE-SIGNAL, M-SIGNAL-ELIGIBILITY,
M-SIGNAL-SOURCE, M-CACHE-ISOLATION, **M-ACTUAL-GET** (removed actual-method guard,
POST fallback incorrectly coalesces), **M-DEFAULT-CATCHALL**, M-EXPLICIT-OVERRIDE,
and **P-INNOCUOUS** (inert source edit must stay GREEN).

No mutation experiment is executed during R2 planning. Source/package,
mutation-restored-GREEN, independent exact-head IMPL-EVAL, CI/runtime, publication
and unchanged consumer acceptance remain unproven. The coordinator reviews this
exact R2 manifest/plan; no builder self-PASS or evaluation count reset occurs.
