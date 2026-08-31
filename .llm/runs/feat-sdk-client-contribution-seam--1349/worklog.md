# Worklog: #1349 typed SDK client-contribution seam

## Run Metadata

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Run ID         | `feat-sdk-client-contribution-seam--1349`                     |
| Branch         | `feat/sdk-client-contribution-adapter`                        |
| Archetype      | `2 — Integration`                                             |
| Scope overlays | none                                                          |
| Phase          | Slice 2 — implementation and gates complete; draft PR handoff |

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

| Time       | Slice        | Step                  | Notes                                                                                                                                                                                                              |
| ---------- | ------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-31 | Plan cycle 1 | PLAN-EVAL             | Separate evaluator committed `FAIL_PLAN` at plan head `4b520ea44`; implementation remained stopped.                                                                                                                |
| 2026-08-31 | Plan cycle 2 | Authority re-baseline | Read Accepted RFC 0001 and the committed RFC type fixture first; mapped F-1…F-8 to a plan-text-only correction with no scope movement.                                                                             |
| 2026-08-31 | Plan cycle 2 | Design checkpoint     | Rewrote `plan.md` and created missing `supervisor.md`/`worklog.md`; no product or lock file touched.                                                                                                               |
| 2026-08-31 | Slice 1      | Public contract       | Added only the RFC-fixed public descriptor/helper/error contract, tuple/key algebra, compatibility defaults, export wiring, and real-surface fixture imports. No adapter or runtime behavior was started.          |
| 2026-08-31 | Slice 1      | Assertion budget fix  | Kept every RFC fixture assertion and added explicit negative proofs for forbidden ordering/environment/transport fields, exact three/five keys, preserved `TError`, and Desktop rejection.                         |
| 2026-08-31 | Slice 1      | Final gate recut      | Re-ran the full scoped SDK test wrapper after the assertion-budget fix and re-cut every amended Slice-1 gate at the final product content.                                                                         |
| 2026-08-31 | Slice 1      | Slice review          | Substantive review found no scope creep, internal/link export, upstream identity, unsafe cast/allowance, or compatibility-default drift. The Slice-1-only types-accepted-but-unconsumed window remains draft-only. |
| 2026-08-31 | Slice 1      | Reconcile             | Merging this partial slice leaves #1349 open. The draft PR uses `Refs #1349`; readiness labels, acceptance-box changes, evaluator dispatch, and merge remain supervisor-owned.                                     |
| 2026-08-31 | Slice 2      | Private adapter       | Added exactly the RFC's three internal port responsibilities, immutable preparation, and the stable-v1 outer epoch wrapper; no internal barrel, package export, or public adapter identity was added.              |
| 2026-08-31 | Slice 2      | Retry conformance     | Forced unary retry prepares once and reuses one prepared identity across two attempts while each HTTP dispatch materializes a fresh header container and preserves the terminal transport error identity.        |
| 2026-08-31 | Slice 2      | Reconnect conformance | Iterator failure rotates credential A to B with exactly two preparation epochs and byte-equivalent attempts inside each epoch; an aborted iterator starts neither preparation nor transport for a reconnect.     |
| 2026-08-31 | Slice 2      | Surface conformance   | Four-entrypoint documentation scans omit all private identities; the packed SDK rejects all three forbidden subpaths; the public contribution declarations contain no oRPC/npm identity.                         |
| 2026-08-31 | Slice 2      | Final gates           | Re-cut structured SDK check/test/lint/fmt receipts with non-empty stdout, plus quality, architecture, RFC fixture, doc baseline, SDK dry-run, JSR audit, lock, and ceiling evidence.                               |
| 2026-08-31 | Slice 2      | Slice review          | Substantive source/test review found the prepared value is the sole contributor-to-transport channel, upstream retry is disabled only for non-empty tuples, omission retains the existing transport retry path, and Slice 3 files remain untouched. |

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

Slice 1 is green under the owner-amended gate set. Structured receipts/reports are stored under
`.llm/tmp/gate-receipts/sdk-1349/` and are intentionally not committed. The accidental broad
check/lint/fmt task invocations were not used as evidence; the wrappers were rerun directly with
`--root packages/sdk --ext ts,tsx`.

### Static Gates

| Gate                     | Command or check                                                                                                                  | Result | Evidence                                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| RFC real-surface fixture | `deno check --unstable-kv packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`                                  | PASS   | Exit 0; exact command emitted a non-empty `Check ...` line.                                                                     |
| Compatibility fixtures   | `deno check --unstable-kv` for `sdk-assignability_type.ts`, `define-services_type.ts`, and `service-query-utils-upstream_type.ts` | PASS   | All three exit 0 with non-empty check output.                                                                                   |
| Scoped SDK check         | `.llm/tools/run-deno-check.ts --root packages/sdk --ext ts,tsx`                                                                   | PASS   | 91 files, 1 batch, 0 failures/occurrences; stdout 160 bytes and report 386 bytes.                                               |
| Full scoped SDK test     | `.llm/tools/run-deno-test.ts -- --allow-all packages/sdk`                                                                         | PASS   | 79 passed, 0 failed/ignored; receipt stdout 284 bytes. This is the required post-assertion-fix rerun.                           |
| Scoped SDK lint          | `.llm/tools/run-deno-lint.ts --root packages/sdk --ext ts,tsx`                                                                    | PASS   | 91/91 processed, 0 findings/refusals; stdout 159 bytes and report 469 bytes.                                                    |
| Scoped SDK format        | `.llm/tools/run-deno-fmt.ts --root packages/sdk --ext ts,tsx`                                                                     | PASS   | 91/91 processed, 0 findings/refusals; stdout 165 bytes and report 386 bytes.                                                    |
| Diff/ceiling             | `git diff --check`, status/name sweep, and forbidden-export scan                                                                  | PASS   | Only Slice-1 product files plus this run's `worklog.md`/`context-pack.md`; no `internal`, link, or out-of-ceiling product edit. |
| Lock hygiene             | `git diff --exit-code -- deno.lock`                                                                                               | PASS   | `deno.lock` remains byte-identical.                                                                                             |

### Fitness Gates

| Gate                     | Result | Evidence                                                  | Notes                                                                                                                                                       |
| ------------------------ | ------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate cycle 2        | PASS   | Separate evaluator verdict at `a4535578e`                 | Implementation began only after the committed PASS.                                                                                                         |
| `deno task quality:scan` | PASS   | Exit 0; no findings, allowance budget remains 7           | Receipt stdout 4,092 bytes.                                                                                                                                 |
| `deno task arch:check`   | PASS   | Exit 0, `FAIL=0` for SDK and repository                   | Existing SDK `src/` cardinality/doc-architecture warnings remain non-failing baseline; Slice 1 adds no new top-level `src` child.                           |
| JSR audit                | PASS   | `audit-jsr-package.ts --root packages/sdk --text`, exit 0 | SDK dry-run is `OK`; the audit's banner-derived `slow-types` warning is not an actual dry-run diagnostic. Existing `src/` cardinality warning is unchanged. |

### Gate 4 amendment — measured baseline

Measured verdict on the three `private-type-ref` findings:

| Tree                                   | `totalErrors` |
| -------------------------------------- | ------------- |
| clean `main`                           | **3**         |
| this leaf, with all of Slice 1 present | **3**         |

Same three files in both — `packages/sdk/src/ports/query-client.ts`,
`packages/sdk/src/query-client/query-client-factory.ts`, and
`packages/plugin-streams-core/src/application/create-durable-stream.ts`. **Slice 1 introduces zero
new doc-lint findings.** The third file is not even in `packages/sdk`, so it could never have been
fixed inside this leaf's package boundary.

The final `deno task doc:lint --root packages/sdk --pretty` rerun reproduces exactly that amended
baseline: exit 1, `totalErrors=3`, `totalPrivateTypeRef=3`, `totalMissingJSDoc=0`, and those same
three files. This is PASS under the owner-amended no-new-findings gate.

The SDK publish dry-run passes from `packages/sdk`: exit 0, no real slow-type or portability
failure, `stderr.bytes=8129`. Its `stdout.bytes=0` is expected because `deno publish --dry-run`
writes this evidence to stderr; it is not the cache-replay trap.

### Runtime Gates

| Gate                                     | Result  | Evidence        | Notes                                                  |
| ---------------------------------------- | ------- | --------------- | ------------------------------------------------------ |
| Contribution adapter/runtime conformance | NOT_RUN | Slices 2–3 only | Slice 1 intentionally adds types/public contract only. |

### Consumer Gates

| Consumer                       | Result | Evidence                                                                                                        | Notes                                                        |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| RFC public-import fixture      | PASS   | Exact fixture check plus full SDK test wrapper                                                                  | Local stand-ins were removed without removing an assertion.  |
| Forbidden descriptor fields    | PASS   | `@ts-expect-error` for `before`, `after`, `requires`, `priority`, `environment`, `link`, `fetch`, and `retry`   | Closed v1 shape remains narrow.                              |
| Compatibility defaults         | PASS   | Existing three compatibility fixtures plus default client/query-utils assertions                                | Existing call sites compile unchanged.                       |
| Tuple/key/error/Desktop proofs | PASS   | 16 accepted/17 rejected; exact three/five keys; `TError` third/context fourth; Desktop excess property rejected | All Slice-1 compile-negative/shape assertions remain active. |

## Slice 2 Gate Results

Final durable receipts are under `.llm/tmp/gate-receipts/sdk-1349-s2/` and are intentionally not
committed. The first format check found two owned files and was followed by formatting only the eight
Slice-2 TypeScript files; `fmt-final.json` is the final evidence.

### Slice gates 1–6

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Forced unary retry | PASS | `context.retry: 1` produced exactly one preparation and two transport attempts. Both attempts received the same frozen prepared-call identity and byte-equivalent contributor header values; the HTTP integration used distinct header containers. Omitted and explicit-empty calls each match the fixed pre-adapter wire snapshot byte for byte. |
| Iterator reconnect | PASS | Initial/open retry used credential A, reconnect/open retry used B, preparation count was exactly 2, attempts projected `[A, A, B, B]`, and identities were equal within but different across epochs. |
| Abort and callback observation | PASS | Abort after the initial item left preparation/transport counts at 1. Contribution callbacks observed only their declared `credential` context plus the RFC snapshot fields—never retry, cache, or trace state. The terminal transport error retained identity. |
| Private documentation surface | PASS | `deno doc --json` over SDK root, `./client`, `./ports`, and `./desktop` contains none of the three ports, prepared-call types, or `stableV1PreparedCall`. |
| Packed negative imports | PASS | A real `deno pack` + temporary npm consumer accepted `@netscript/sdk/client` and rejected `@netscript/sdk/internal/client-contributions`, its `adapter-ports` child, and `@netscript/sdk/client-contributions`. |
| Zero-oRPC declaration scan | PASS | Every new public contribution symbol in the SDK root documentation graph contains neither `@orpc` nor `npm:`; no #1350/#1278 allowance changed. |

### Slice gate 7 and repository fitness

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Scoped SDK check | PASS | Structured wrapper selected 96 TS/TSX files, one batch, zero occurrences; receipt stdout 305 bytes. |
| Full scoped SDK test | PASS | Structured wrapper: 95 passed, 0 failed, 0 ignored; receipt stdout 287 bytes. This includes all epoch, absence, packed-consumer, and zero-oRPC tests. |
| Scoped SDK lint | PASS | 96/96 files processed, zero findings/refusals; receipt stdout 355 bytes. |
| Scoped SDK format | PASS | Final receipt processed 96/96 files with zero findings/refusals; stdout 304 bytes. |
| `quality:scan` | PASS | Exit 0, no findings or allowance failures; stdout 4,092 bytes and allowance budget remains 7. |
| `arch:check` | PASS | Exit 0; SDK `FAIL=0`, with only the pre-existing `src/` cardinality warning and architecture-doc info. |
| RFC fixture | PASS | Exact `deno check --unstable-kv packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` emitted its check line and exited 0. |
| Doc lint | PASS under baseline gate | Required `--root packages/sdk --pretty` invocation reproduced exactly 3 `private-type-ref` findings in the same out-of-ceiling files, with 0 new findings; receipt stdout 4,359 bytes. |
| SDK publish dry-run | PASS | Run from `packages/sdk`; exit 0, stderr 8,426 bytes, and normal zero stdout. The three private runtime implementation files are packaged as reachable source but no importable subpath is exported. |
| JSR audit | PASS | Exit 0; dry-run `OK`; only the existing SDK `src/` cardinality warning and banner-derived slow-types warning remain. |
| Diff, ceiling, lock | PASS | `git diff --check` passes; product changes are exactly the Slice-2 file list; no internal barrel or export exists; `deno.lock` is byte-identical. |

## Handoff Notes

- Slice 2 now consumes the Slice-1 contribution surface for direct HTTP service-client calls and is
  complete under its seven gates. Slice 3 still owns construction/error validation, cache/query and
  Desktop behavior, docs, and combined contribution/trace proof. Do not publish this intermediate.
- The owner-amended doc-lint gate is satisfied as 3 baseline / 0 new; do not repair the three
  foreign/pre-existing findings in this leaf.
- The pushed commit and draft PR are the Slice-2 commit trail. Merging leaves #1349 open; the PR
  must contain `Refs #1349` and must remain draft.
- Do not apply readiness labels, tick acceptance boxes, dispatch IMPL-EVAL, or merge. Those actions
  remain with the supervisor.
