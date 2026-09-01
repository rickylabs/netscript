# Worklog: #1351 SDK transport policy

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `refactor-sdk-transport-policy--1351` |
| Branch | `refactor/sdk-transport-policy` |
| Archetype | `2 — Integration` |
| Scope overlays | none |

## Design

The approved `plan.md` supplied this checkpoint before source work began. PLAN-EVAL independently
verified it and returned `PASS` in `plan-eval.md`; this section is its implementation ledger.

### Public Surface

- `NetScriptProcedureMeta.policy.cache` — additive contract-owned cache intent.
- `SdkClientHttpMethod`, `SdkClientTransportPolicyMethodOptions`, and
  `SdkClientTransportPolicy` — upstream-neutral override vocabulary.
- `CreateServiceClientOptions.transportPolicy?` and
  `CreateDesktopServiceClientOptions.transportPolicy?` — the single v2 adaptation point.
- Existing `port` and `timeout` fields remain accepted deprecated no-ops.
- `resolveTransportPolicy` is exported-internal only and absent from every package export map.

### Domain Vocabulary

- `ResolvedTransportPolicy` — one contract-scoped method/cache/dedupe policy.
- `ResolvedCallTransportPolicy` — one frozen decision per logical call epoch.
- `ResolvedTransportCacheGroup` — stable cache-group projection for the oRPC v1 plugin.
- `SdkClientProcedureDescriptor` — the only contract path/metadata view shared by policy and
  contributions; it never contains an HTTP method.

### Ports

- `ProcedureMetadataPort` — the existing stable-v1 boundary that normalizes one descriptor for
  both policy and contributions.
- `ClientLinkPort` — the existing structural dispatch seam used by HTTP and Desktop wrappers.
- `PreparedOutboundHeadersPort` — the existing contribution preparation boundary; no new
  contribution extension mechanism is opened.

### Constants

- SDK HTTP method set — `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `TRACE`, `CONNECT`.
- Stable-v1 codec defaults — fallback `POST`, maximum URL length `2083`.
- Procedure cache modes — `no-store`, `default`, `force-cache`.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Contract metadata, public override types, exact validation, and internal resolver | scoped check/lint/fmt; focused metadata/policy tests; doc boundary; quality gate | contracts metadata/tests/README; SDK ports/barrels/internal resolver/tests; run artifacts |
| 2 | HTTP logical-epoch wiring and contract-derived dedupe/cache groups | focused SDK integration tests with real overlapping fetches; scoped static gates; quality gate | stable-v1 adapter/prepared-call ports; service and HTTP clients; focused tests; run artifacts |
| 3 | Desktop policy consumption and contribution method secrecy | Desktop/validation/private-surface/type tests; packed/doc boundary; quality gate | Desktop application/types/tests; contribution boundary tests; run artifacts |
| 4 | `port`/`timeout` compatibility docs and final 10-step gate set | full approved validation plan after one final `main` integration | SDK README/compatibility tests; run artifacts |

### Deferred Scope

- Every oRPC dependency/version/lock/catalog change — #1879.
- oRPC v2 and server handler method policy.
- #1349 construction seam, #1320 Zod graph, and #451 in-process link adapter.
- Public retry/dedupe/fetch/link/plugin extension points.

### Contributor Path

Add future method adaptation through `SdkClientTransportPolicy` and
`src/internal/transport-policy.ts`; keep link construction policy-free, add contract-derived cases
to `transport-policy_test.ts`, and extend the existing epoch/contribution conformance tests without
adding a second transport path.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-01 | plan-gate | complete | Separate evaluator committed `VERDICT: PASS` at `871caac96`. |
| 2026-09-01 | 1 | contract implemented | Added metadata, public option vocabulary, exact resolver validation, and direct policy tests without wiring HTTP or Desktop dispatch. |
| 2026-09-01 | 1 | reconcile | No new issue/PR scope or comment changed the approved decisions; #1879 remains excluded. |
| 2026-09-01 | 2 | HTTP adapter implemented | Stored one frozen decision on each existing logical epoch and projected it into the sole RPC codec/dedupe stack. |
| 2026-09-01 | 2 | hard semantics proved | Pending same-header GETs coalesced once; differing authorization/locale headers dispatched twice; unary/reconnect decision counts were 1/2. |
| 2026-09-01 | 2 | reconcile | Draft PR #1889 remains `status:impl`; no new scope or dependency change was admitted. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Resolve policy before contributions | Prevent method observation structurally and temporally | locked plan + PLAN-EVAL |
| Normalize `policy.cache` in the existing metadata port | One descriptor, not a second raw metadata mechanism | locked plan |
| Keep resolver internal to the package export map | Future upstream adaptation stays one internal function change | locked plan |
| Build and test on the current pinned oRPC graph | Coordinator excluded dependency work and evaluator proved the v1 seams exist | #1879 ruling + PLAN-EVAL |
| Bridge stable-v1's narrower method declaration only at the codec edge | Fetch accepts the locked public method vocabulary; policy validation remains authoritative and no upstream type leaks publicly | locked public contract + pinned-v1 adapter |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| none through Slice 1 | — | n/a |

## Gate Results

### Slice 1 Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Contracts check | `run-deno-check.ts --root packages/contracts --ext ts,tsx` | PASS (`rc=0`) | 27 files, zero findings |
| SDK check | `run-deno-check.ts --root packages/sdk --ext ts,tsx` | PASS (`rc=0`) | 101 files, zero findings after correcting initial type-shape failures |
| Contracts lint | `run-deno-lint.ts --root packages/contracts --ext ts,tsx` | PASS (`rc=0`) | 27/27 processed |
| SDK lint | `run-deno-lint.ts --root packages/sdk --ext ts,tsx` | PASS (`rc=0`) | 101/101 processed |
| Contracts format | `run-deno-fmt.ts --root packages/contracts --ext ts,tsx` | PASS (`rc=0`) | 27 files |
| SDK format | `run-deno-fmt.ts --root packages/sdk --ext ts,tsx` | PASS (`rc=0`) | 101 files after formatting four owned files |

### Slice 1 Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Code quality + doctrine | PASS (`rc=0`) | `deno task quality:gate` | No scanner findings; existing repository warnings unchanged |
| Public/private declaration boundary | PASS (`rc=0`) | focused structured test invokes `deno doc --json` | New public types contain no oRPC/npm identity; internal resolver absent |

### Slice 1 Runtime and Consumer Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Metadata/policy behavior | PASS (`rc=0`) | structured test wrapper, 7/7 tests | GET/POST/HEAD, cache precedence, override, and invalid-runtime cases |
| Export neutrality | PASS (`rc=0`) | `procedure-meta-independence_test.ts` | contracts/client/desktop/ports surfaces checked |

### Slice 2 Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| SDK check/lint/fmt | PASS (`rc=0`) | structured wrappers | 101 files, zero findings |
| Focused HTTP/epoch suite | PASS (`rc=0`) | structured test wrapper, 26/26 | Includes wire baseline, trace ownership, unary retry, reconnect, abort, and dedupe overlap |
| Header-safe dedupe | PASS (`rc=0`) | two pending-fetch tests | Same auth+locale produced one pending fetch; distinct auth+locale produced two |
| Contract-derived source boundary | PASS | no-match `rg` returned `rc=1` | HTTP link contains no `request.method`, upstream infer helper, or fallback/max literals |
| Code quality + doctrine | PASS (`rc=0`) | `deno task quality:gate` | No scanner findings; existing repository warnings unchanged |

## Handoff Notes

- Inspect `src/internal/transport-policy.ts` first: all later wiring must project this decision and
  must not recreate method/cache policy in either link.
- Slice 2 must retain one logical decision across unary attempts and create a fresh decision for an
  iterator reconnect. This is now proved; Slice 3 should inspect the private projection and Desktop
  wrapper rather than changing the epoch lifetime.
