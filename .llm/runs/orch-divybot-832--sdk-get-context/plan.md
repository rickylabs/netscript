# Plan & Design — READY FOR REVIEW

Source #2610; assignment rickylabs/harness#832. Planning/evidence only.
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

See `research.md`, `red-evidence.json` and `get-context.repro_test.ts`.
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
   the three grouped modes). The adapter supplies the already prepared logical
   call's effective signal, including lower-link top-level signal precedence,
   and also verifies `options.request.method === 'GET'`. Calls with a signal,
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
| S0 (this checkpoint) | Only this run directory: current baseline, public reproducer, exact plan and immutable manifest. | Structured RED evidence, reproducible controls, scoped check/lint/fmt. Parent PLAN review pending. |
| S1 | `packages/sdk/src/internal/transport-policy.ts`, `packages/sdk/tests/transport-policy_test.ts`: typed cache groups and explicit conservative eligibility contract. | Policy tests for each cache mode, signal presence and method; scoped check/lint/fmt; `quality:gate`. |
| S2 | `packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts`, `packages/sdk/src/client/http-client-link.ts`, new `packages/sdk/tests/integration/get-context_test.ts`, existing `packages/sdk/tests/integration/client-contribution-adapter_test.ts`: materialized cache, effective signal, public integration regressions. | All retained semantic assertions GREEN, actual fetch observations, cancellation/cache/identity matrix below, existing SDK/contribution suites, scoped wrappers and `quality:gate`. |
| S3 | `packages/sdk/README.md` plus this run's evidence/context/worklog/drift: document conservative eligible dedupe and unchanged public usage; package qualification and independent review. | Full SDK checks/tests, all-export docs, JSR audit/dry-run, applicable root gates, exact-head independent IMPL-EVAL and required CI. Parent-owned runtime/production gates remain explicit. |

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
| Fewer duplicate requests coalesce when signals exist. | Deliberate bounded performance tradeoff: preserve independent cancellation and retain unsignalled dedupe. No homegrown promise/cancellation layer. |
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
