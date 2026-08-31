# Worklog: #1349 typed SDK client-contribution seam

## Run Metadata

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Run ID         | `feat-sdk-client-contribution-seam--1349`                     |
| Branch         | `feat/sdk-client-contribution-seam`                           |
| Archetype      | `2 — Integration`                                             |
| Scope overlays | none                                                          |
| Phase          | Plan & Design — cycle-2 revision; implementation hard-stopped |

## Design

This checkpoint is re-derived from Accepted RFC 0001 and its committed type fixture. It records the
future implementation design; no product code is created during this revision.

### Public Surface

- Existing SDK root, `./client`, and `./ports` entrypoints expose the RFC contribution protocol,
  descriptor/helper, tuple/context validation algebra, client/query context generics, server-key
  suffix types, and stable contribution error/diagnostic contract.
- `CreateServiceClientOptions` and `DefineServiceConfig` add `contributions?`; neither adds `with?`
  nor `link?`.
- `ServiceClientContext` remains canonical. `ServiceClientMethod` keeps `TError` third and appends
  `TContext` fourth. Query-only context defaults remain empty-record; key suffix defaults remain
  empty tuple.
- `CreateDesktopServiceClientOptions` exposes no contribution field.
- No internal adapter type, link type, or upstream oRPC identity becomes public.

### Domain Vocabulary

- `SdkClientContributionProtocol` / `SdkClientContributionId` — closed versioned identity.
- `SdkClientContribution<TId, TContext, TDeclaration, THeaderKeys>` — public v1 descriptor with
  context/header/cache/prepare capability only.
- `SdkClientPrepareOptions<TContext>` — immutable per-call projection: context, signal, procedure,
  transport, and input.
- `SdkClientResponseCache<TContext>` — `invariant | partitioned | direct-only` safety declaration.
- `SdkClientContributionContext<T>` / `ValidateSdkClientContributions<T>` — intersection,
  duplicate/conflict, and 16-element tuple algebra.
- `SdkClientServerKeySuffix` / `ActionQueryKey<TAction, TSuffix>` — exact empty three-tuple or
  partitioned five-tuple server-key contract.
- `SdkClientContributionError` / code / diagnostic — stable redacted local failure taxonomy.
- `PreparedSdkClientCall<TContext>` — private immutable channel between preparation and transport.

### Ports

- `PreparedOutboundHeadersPort` — validates/composes contributors exactly once per logical epoch.
- `ProcedureMetadataPort` — sole upstream procedure-node interpreter, returning NetScript metadata.
- `ClientTransportPolicyPort` — owns encoding, retry, dedupe, tracing, fetch, streaming recovery,
  decoding, and dispatch; consumes prepared output and never invokes contributors.

All three live only under `src/internal/client-contributions/`; there is no internal barrel/export.

### Constants

- Protocol family/major — `netscript.sdk-client` / `1`.
- Limits — 16 contributions/service, 8 context keys/contribution, 16 header keys/contribution,
  128-character id, and 64-character printable-ASCII partition.
- Reserved SDK context keys — signal, cache, retry fields, and trace headers, represented by one
  audited internal set.
- Reserved header policy — SDK-owned trace/content headers, audited Fetch forbidden names,
  `proxy-`/`sec-` prefixes, and `set-cookie`.
- Server/TanStack suffix tag — `$netscript.sdk-context`.
- Failure codes — the RFC-fixed ten-code union; no free-form or source-error diagnostic channel.

### Commit Slices

| # | Slice                                                                                                                                | Proving gates                                                                                                                                                                                                                                                            | Files                                                                                                                                                                                                                                                                                       |
| - | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Public descriptor/helper/error contract; client/query generic propagation; tuple and server-key algebra                              | Re-pointed RFC fixture `deno check --unstable-kv`; structured SDK check/test/lint/fmt; `quality:scan`; `arch:check`; doc lint; publish dry-run; JSR audit                                                                                                                | `src/ports/sdk-client-contribution.ts`, `src/client/sdk-client-contribution.ts`, `src/client/errors.ts`, `src/ports/{service-client,query-factory,service-query-utils,query-key,mod}.ts`, `src/presets/{define-services,mod}.ts`, `src/client/mod.ts`, root `mod.ts`, focused type fixtures |
| 2 | Three private ports + stable-v1 adapter; outer logical epochs; omission/unary/reconnect behavior; private-surface absence            | Unary count-1 and A→B reconnect count-2 conformance; callback observation; four-entrypoint `deno doc --json` absence; packed negative imports; scoped zero-oRPC; structured/quality/arch/doc/publish/JSR gates                                                           | `src/internal/client-contributions/{adapter-ports,prepared-call,stable-v1-adapter}.ts`, `src/client/{service-client,http-client-link}.ts`, internal-only typing in `src/ports/client-link-factory.ts`, focused integration/packed fixtures                                                  |
| 3 | Closed-shape/error/header validation; cache/query wrapping; direct-only omission; Desktop runtime rejection; docs and consumer proof | Unknown/JS runtime failures; cache non-observation; Desktop unsupported transport; README doctest; combined contributed-header + CLIENT-span test; repeated absence/zero-oRPC; final structured/quality/arch/doc/publish/JSR gates; merge-readiness scaffold runtime E2E | prepared-call/helper/error/client/query/query-client/preset/Desktop files listed in `plan.md`; SDK README, `ports/mod.ts`, public JSDoc, focused tests                                                                                                                                      |

### Deferred Scope

- #1350 contract error repair; #1351 transport consolidation/version change; #1352 auth factory;
  #1353 trace proof; #451 custom links; #1093/CLI discovery and generator rejection; service-preset
  incoming header behavior; shipped locale contribution; and any oRPC v2 migration.
- Edits outside `packages/sdk`, any `deno.lock` change, or any public/internal-link export are
  rescope tripwires and require stopping/reporting.

### Contributor Path

A contribution author imports `defineSdkClientContribution` from the public SDK client surface,
declares a literal id/context/header/cache contract, and explicitly attaches the literal tuple as
`contributions` on one service. A future adapter contributor starts at the private three-port
contract and must pass the same epoch, absence, and zero-upstream-identity conformance suite; public
descriptors never gain transport controls.

## Progress Log

| Time       | Slice        | Step                  | Notes                                                                                                                                  |
| ---------- | ------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-31 | Plan cycle 1 | PLAN-EVAL             | Separate evaluator committed `FAIL_PLAN` at plan head `4b520ea44`; implementation remained stopped.                                    |
| 2026-08-31 | Plan cycle 2 | Authority re-baseline | Read Accepted RFC 0001 and the committed RFC type fixture first; mapped F-1…F-8 to a plan-text-only correction with no scope movement. |
| 2026-08-31 | Plan cycle 2 | Design checkpoint     | Rewrote `plan.md` and created missing `supervisor.md`/`worklog.md`; no product or lock file touched.                                   |

## Decisions

| Decision                                                       | Reason                                                                   | Source                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| `contributions?`; no `with?`/`link?`                           | Accepted Stage-2 shape; #451 retains custom-link ownership               | RFC 0001 public contract/transport ownership; plan LD-3 |
| Canonical `ServiceClientContext`; preserve `TError` third slot | Compatibility defaults plus #1350 error-channel boundary                 | RFC defaults table, committed fixture, plan LD-3        |
| No dependency/order/environment fields                         | Valid contributions commute; extras are invalid closed shape             | RFC ordering law/rejected alternatives; plan LD-6       |
| Desktop field absent + runtime unsupported error               | HTTP header axis cannot apply to MessagePort                             | RFC Desktop boundary and committed fixture; plan LD-7   |
| Three private ports, outer epoch wrapper                       | Prepare once, transport owns all attempts/observability                  | RFC internal ports/async retry law; plan LD-5           |
| Server/contracts/plugin/CLI expansion excluded                 | Metadata prerequisite already satisfied; sibling issues retain ownership | RFC staging; plan LD-9/deferred scope                   |

## Drift

| Drift                                                                                     | Severity                                                                   | Logged in drift.md                                                                                                                           |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Cycle-1 plan followed issue prose instead of the Accepted RFC for five contradictory rows | significant planning correction; no implementation drift or scope movement | no — authoritative finding and correction are committed in `plan-eval.md` and revised `plan.md`; no separate implementation drift exists yet |

## Gate Results

This turn is plan text only. Implementation gates are selected in `plan.md` but intentionally not
run; PLAN-EVAL is the next gate and must be dispatched by the supervisor in another session.

### Static Gates

| Gate                 | Command or check                                             | Result | Notes                                               |
| -------------------- | ------------------------------------------------------------ | ------ | --------------------------------------------------- |
| Plan artifact scope  | raw git diff/status verification                             | PASS   | Only the three cycle-2 run artifacts are changed.   |
| Product/lock absence | verify no diff under `packages/`, `plugins/`, or `deno.lock` | PASS   | Product trees and `deno.lock` have no diff.         |
| Plan-text formatting | `deno fmt --check` on the three owned Markdown artifacts     | PASS   | Focused plan-text check; no product files selected. |

### Fitness Gates

| Gate                | Result  | Evidence                               | Notes                                         |
| ------------------- | ------- | -------------------------------------- | --------------------------------------------- |
| Plan-Gate cycle 2   | NOT_RUN | supervisor-dispatched separate session | Generator must not self-evaluate or dispatch. |
| F-1…F-12, F-14…F-19 | NOT_RUN | selected in `plan.md`                  | Future implementation only.                   |

### Runtime Gates

| Gate                     | Result  | Evidence                | Notes                    |
| ------------------------ | ------- | ----------------------- | ------------------------ |
| Contribution conformance | NOT_RUN | selected per Slices 2–3 | No product code changed. |

### Consumer Gates

| Consumer                                            | Result  | Evidence                | Notes                    |
| --------------------------------------------------- | ------- | ----------------------- | ------------------------ |
| Type fixture / packed import / README / header+span | NOT_RUN | selected per Slices 1–3 | No product code changed. |

## Handoff Notes

- Read `rfcs/0001-sdk-client-contributions.md` and
  `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` before the cycle-2 plan.
- Evaluate the finding-traceability table, LD-3/LD-6/LD-7, all three slice ceilings, gate set, risk
  register, JSR scan, and this Design checkpoint.
- Confirm the diff is run-artifact-only and that implementation remains hard-stopped pending `PASS`.
