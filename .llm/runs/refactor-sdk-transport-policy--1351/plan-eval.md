# PLAN-EVAL — refactor-sdk-transport-policy--1351

- Plan evaluator session: separate opposite-family evaluator (Claude Code / GLM 5.3 Flash via
  OpenRouter), 2026-09-01
- Run: `refactor-sdk-transport-policy--1351`
- Surface / archetype: `packages/contracts` metadata + `packages/sdk` transport integration;
  Archetype 2 — Integration
- Scope overlays: none
- Evaluated head: `6ac7d49ab` (plan baseline `82a2527e2`; re-verified identical for all load-bearing
  findings used below)

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                     |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` re-baselines issue #1351 (incl. 2026-08-13 amendment), RFC 0001 Stage 3, and RFC-A §§3.6/3.11 against `82a2527e2` on 2026-09-01; records the `rfcs/` vs `docs/architecture/rfcs/` path correction. Spot-checks below all reproduced. |
| Decisions locked                        | PASS   | `plan.md` "Public contract — LOCKED", "Owned policy function — LOCKED", "Forward-compat enforcement — LOCKED", "`port` and `timeout` disposition — LOCKED"; exact signatures, module home, and consumer wiring are stated, not gestured. |
| Open-decision sweep                     | PASS   | `plan.md` "Open-decision sweep": seven items resolved with reasons; one item (`server method policy`) explicitly marked safe-to-defer with a named future home. Evaluator re-ran the sweep (below) and found nothing new that would force rework if deferred. |
| Commit slices (< 30, gate + files each) | PASS   | 4 ordered contract-first slices, each naming planned files and its proving gate (plan.md "Contract-first implementation slices"); slice 1 proves the contract before any wiring. |
| Risk register                           | PASS   | 11 risks with concrete mitigations, including method/dedupe disagreement, contribution leakage, epoch-lifetime mistakes, header-coalescing, and dependency-scope leakage back into #1351. |
| Gate set selected                       | PASS   | 10-step validation plan using the structured wrappers (`run-deno-check/lint/fmt/test`), `deno doc` boundary probes, `quality:gate` (`quality:scan` + `arch:check`), JSR audit, publish dry-run, and the one-pass scaffold runtime E2E at merge readiness only. Matches the package/integration gate set; no raw-root-fmt-as-verdict trap. |
| Deferred scope explicit                 | PASS   | "Deferred / forbidden scope" enumerates oRPC v2, server method policy, #1349/#1320/#451 interactions, public plugin/fetch/link exposure, `port`/`timeout` semantics, dependency/lock work (#1879), and unrelated doc-lint debt repair. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | "JSR-audit planned-surface assessment" names the five planned-surface risks (new public option, metadata declaration change, internal-resolver leakage, honest doc-lint baseline, no manifest edit) and each is addressed by a named slice/gate. Baseline diagnostics disclosed (3 SDK / 9 contracts private-type-ref), not claimed green. |

## Load-bearing claim verification (evaluator spot-checks)

Real captured exits; all commands run at `6ac7d49ab`.

| Claim | Verified |
| ----- | -------- |
| HTTP policy is three inline decisions; dedupe re-derives from the wire | `packages/sdk/src/client/http-client-link.ts:115` (`method: inferRPCMethodFromContractRouter(contract)`), `:144` (`filter: ({ request }) => request.method === 'GET'`), `:145-159` (inline `force-cache`/default groups). Exactly as research finding 1 states. |
| Stable-v1 adapter owns logical-call epochs usable for one decision per epoch | `stable-v1-adapter.ts:224-241` (`startEpoch` prepares once), `:193-204` (unary retry loop reuses the prepared call), `:262` (iterator reconnect calls `startEpoch(lastEventId)` fresh). |
| Metadata adapter currently normalizes only `access.authentication` | `stable-v1-adapter.ts:74-102`; adding `policy.cache` indeed requires the deliberate normalization path the plan specifies. |
| `SdkClientPrepareOptions` is exactly the five secrecy-layer fields | `ports/sdk-client-contribution.ts:42-55`. `CONTRIBUTION_FIELDS` exact-field validation exists at `prepared-call.ts:22,208`. |
| `port`/`timeout` are source-deprecated, accepted, unconsumed | `ports/service-client.ts:278-290` (`@deprecated`, "#1351 owns the transport disposition"); `ServiceClientContext.cache?: RequestCache` at `:143`. |
| Contracts metadata exposes only `access` today | `packages/contracts/src/domain/procedure-meta.ts:28-41`. |
| Desktop is a MessagePort transport that rejects contributions | `desktop/application/desktop-rpc-client.ts:15-39`. |
| **Pinned graph provides every seam the plan needs (no #1879 prerequisite)** | `deno.lock` resolves `npm:@orpc/client@1.14.6` / `@orpc/contract@1.14.6`; manifests pin `^1.14.6`/`^1.14.7`. `deno doc --filter StandardRPCLinkCodecOptions npm:@orpc/client@1.14.6/standard` shows `method`, `fallbackMethod` (default `POST`), `maxUrlLength` (default `2083`); `deno doc --filter DedupeRequestsPluginOptions npm:@orpc/client@1.14.6/plugins` shows `filter` (upstream default is precisely the wire-derived `request.method === 'GET'`) plus `groups`; `deno doc --filter inferRPCMethodFromContractRouter npm:@orpc/contract@1.14.6` shows the contract-derived `(options, path) => Exclude<HTTPMethod, 'HEAD'>` resolver. The plan's "implementable today" premise is real, not assumed. |
| Existing test seams the plan extends (not replaces) | `client-contribution-adapter_test.ts` (341 lines), `client-contribution-private-surface_test.ts` (173), `client-contribution-validation_test.ts` (327), `procedure-meta-independence_test.ts`, `contracts/tests/procedure-meta-inference_test.ts` all present. |
| Governing authorities | Issue #1351 body carries the verbatim 2026-08-13 amendment ("RFC 0001 Stage 3 supersedes the pinned `1.14.15` acceptance row"; dependency move is a separate whole-family lock-only decision; no v2). RFC 0001 Stage 3 row assigns #1351 transport consolidation with the family move "decided separately". Issue #1879 is open (`status:impl`): "move the @orpc/* family to stable v1.15.0 and collapse duplicate @orpc/shared". |

## Judgment against the issue-specific criteria

1. **Split honoured in substance — yes.** Beyond wording, the plan's test matrix, gate list, and
   slices contain no version/lock/manifest step and no `deno why @orpc/shared` proof (that is #1879's
   acceptance evidence, correctly absent here). There is no "after #1879" sequencing anywhere; the
   plan explicitly runs on the current pinned graph, and I independently confirmed the installed
   1.14.6 seams exist, so the plan is implementable today. The changed-file audit and the
   stop-and-report rule ("if implementation disproves that finding, report a blocker and stop")
   close the leakage path.
2. **Owned policy function specified — yes.** Exact module home
   (`packages/sdk/src/internal/transport-policy.ts`, exported-internal, absent from every
   barrel/export map), exact generic signature, and a fully typed `ResolvedTransportPolicy` /
   `ResolvedCallTransportPolicy` / `ResolvedTransportCacheGroup` shape. Both consumers are concrete:
   HTTP (`createHttpClientLink` receives the resolved policy and wires method/fallback/maxUrlLength/
   dedupe/groups — no raw override, no policy literals) and Desktop (policy-aware `ClientLinkPort`
   wrapper calling the same `resolveCall` before the unchanged MessagePort dispatch). Not
   aspirational prose; the per-call `resolveCall`/`method(call)` factoring is a sound refinement
   forced by the per-call override.
3. **Contract-derived, not wire-derived — yes.** Resolution law step 7 derives dedupe solely as
   `call.method === 'GET'` from the resolved decision; the plan states `dedupePredicate` never
   receives or reads `request.method`, forbids link-local raw metadata reads, and makes
   `policy.cache` an input through the one normalized descriptor (step 5) — no second mechanism.
   Slice 2's gate includes a source-boundary check for `request.method` policy, and the POST row of
   the test matrix asserts the predicate stays false even against a synthetic wire request claiming
   GET.
4. **Forward-compat enforced by design — yes.** Five layers, each independently verified to exist
   or concretely planned: closed five-field `SdkClientPrepareOptions` (verified), closed
   `CONTRIBUTION_FIELDS` with exact validation rejecting injected policy fields (verified), exact
   snapshot construction instead of spreads, private-symbol storage on the logical epoch (the
   established `stableV1PreparedCall` pattern), and executable boundary proofs (type fixtures,
   runtime own-key assertions, negative `deno doc`/packed-import probes). A contribution cannot
   reach the method through any typed input it receives; the POST-only simulation proves the
   override changes the wire without widening what contributions observe. Within the typed SDK
   contract this is enforcement, not intention.
5. **`port`/`timeout` disposition — yes.** Keep accepted, explicit `@deprecated` migration guidance,
   no new behavior, no removal in 0.0.7, plus a regression proving supplied-vs-omitted clients are
   behaviorally identical (including that `timeout` synthesizes no timer/signal), a README section,
   and a dedicated test-matrix row. Matches the amendment exactly.
6. **Test plan honesty — yes.** Header-safe dedupe is tested with genuinely overlapped pending
   fetches, same vs. distinct prepared headers, so coalescing is observable and the test can fail.
   Unary retry and reconnect tests extend conformance tests that already fail on preparation-count
   violations. The POST-only simulation imports no v2. The plan discloses the doc-lint baseline
   rather than claiming green and forbids absorbing unrelated debt.
7. **Scope realism — yes.** Four slices, named files, explicit no-touch list (manifests, agentic
   tooling, workflows, sibling leaves), explicit stop-and-report triggers, and a drift-watch section
   that requires plan revision / fresh PLAN-EVAL rather than improvisation. Public-surface blast
   radius is bounded by zero-oRPC declaration scans, publish-dry-run subpath checks, and the
   negative packed-import probe.

## Open-decision sweep (evaluator-run)

None beyond the plan's own table. Two observations recorded, neither rework-forcing:

- **Non-policy `RequestCache` passthrough.** `ResolvedCallTransportPolicy.cache` is restricted to
  the three metadata modes, while the traced `fetch` forwards the caller's `context?.cache as
  RequestCache` (`http-client-link.ts:176`). The plan already addresses this ("existing non-policy
  `RequestCache` values retain today's default group behavior; this slice does not silently redefine
  their wire semantics"), and the fetch passthrough reads the unchanged caller context, so no
  behavior change is implied. Implementation must keep the dedupe group selection and the fetch
  cache passthrough on their respective sources exactly as planned.
- **Predicate adapter shape.** oRPC's `filter`/`condition` receive
  `StandardLinkClientInterceptorOptions`, not the plan's `call` object; the plan's "over the private
  prepared decision" wording implies the thin adapter closing over the private symbol. This is
  wiring detail within the locked design, not an open decision.

## Verdict

All Plan-Gate boxes checked; no unchecked item, no unflagged open decision, and every load-bearing
premise survived independent verification against the tree and the pinned dependency graph.

`VERDICT: PASS`
