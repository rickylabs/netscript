# Worklog: typed bearer credential contribution (#1352)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-sdk-credential-contribution--1352` |
| Branch | `feat/sdk-credential-contribution` |
| Archetype | 2 Integration + 4 Public DSL/Builder + 5 Plugin Package |
| Scope overlays | service contract/client guidance; runtime gates prohibited locally |

## Design

### Public Surface

- `@netscript/plugin-auth-core/sdk`: `createBearerSdkClientContribution` and
  `CreateBearerSdkClientContributionOptions`.
- `@netscript/plugin/config`, package root, and `@netscript/plugin/sdk`:
  `SdkClientContributionReference`; plugin builder method `withSdkClients(...)`.
- `plugins/auth` manifest: one declarative browser/server reference to the auth-core factory.
- Auth install starter: one emitted contribution module that applications explicitly place in a
  named service contribution tuple.

### Domain Vocabulary

- `CreateBearerSdkClientContributionOptions<TContext>` — typed credential resolver, context
  declaration, cache declaration, unmarked policy, and cleartext opt-in.
- `SdkClientContributionReference` — protocol, stable id, module/export, and target-only manifest
  data; no callbacks or arbitrary metadata.
- `NetScriptAuthenticationRequirement` — existing `none | optional | required` policy.

### Ports

- Public `SdkClientContribution` / `SdkClientPrepareOptions` from `@netscript/sdk/client` — the only
  request-preparation seam consumed.
- Public `AuthenticatorPort` implementation returned by `createStaticCredentialAuthenticator` —
  fake-fetch compatibility check only; no service runtime.
- `ItemScaffolder` / `textArtifact` from `@netscript/plugin/adapter` — starter artifact edge.

### Constants

- Bearer contribution id: `@netscript/plugin-auth:bearer`.
- Owned header: `authorization`.
- Protocol: `netscript.sdk-client` major 1.
- Contribution axis: `sdk-client`; targets: `browser | server`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Auth-core factory, access metadata, runtime/non-disclosure proof | focused auth-core check/test/doc probes | auth-core `deno.json`, `src/sdk/*`, auth contract + test, README |
| 2 | Plugin reference axis, auth manifest, explicit starter resource | focused plugin/auth tests and checks | plugin config/builder/exports/constants/tests; auth public/adapter/resource/tests/README |
| 3 | Consumer guidance and final evidence | docs lint plus complete S5 gate set | three site docs and run artifacts; see recorded export-map drift |

### Deferred Scope

- CLI revoke/list raw-fetch migration — current public SDK transport does not model its explicit
  auth URLs.
- S6 trace-header authority and S7 locale — ordered follow-on slices sharing SDK files.
- Remote `scaffold.runtime` — merge-readiness CI/OpenHands evidence, never local in this run.

### Contributor Path

Define a typed contribution with `createBearerSdkClientContribution`, add its fixed public factory
reference through `withSdkClients`, and explicitly select the resulting descriptor in one service's
`contributions` tuple. Do not add a global registry or ambient credential lookup.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02 | bootstrap | research/design | Re-baselined current main, public docs, doctrine, JSR surface, doc-lint counts, and lock hash before code. |
| 2026-09-02 | plan-gate | decision | `PLAN-EVAL: N/A`; locked owner/cluster plan leaves no material decision open. |
| 2026-09-02 | S5a | implementation | Added the typed bearer contribution factory, tri-state auth metadata, transport/cache controls, packed-consumer proof, and credential non-disclosure assertions. Commit `fde87fe10`. |
| 2026-09-02 | S5b | implementation | Added the declarative `sdk-client` plugin axis, immutable merger/builder support, auth manifest reference, and explicit generated starter. Commit `84ef41e21`. |
| 2026-09-02 | S5c | documentation/evidence | Documented explicit selection, browser-safe resolver ownership, cache partitioning, HTTPS defaults, and the new auth-core SDK entrypoint. Final gate evidence follows. |

## Shared Files

- None. S5 does not touch `packages/sdk/src/client/http-client-link.ts` or another S6/S7 shared SDK
  source file.

## Decisions

See `plan.md` and the locked S5 section in `clustered-plan.md`.

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Historical lock baseline differs from current main | minor | yes |
| `rtk` binary unavailable in this environment | minor | yes |
| Export-map accuracy required the auth-core reference page | design, gate-required | yes |

## Gate Results

All listed commands exited 0 on 2026-09-02 unless a baseline-only diagnostic count is stated.

| Gate | Result |
| --- | --- |
| Structured check — `packages/plugin-auth-core`, `packages/plugin`, `plugins/auth` | PASS: 222 files, 0 findings |
| Structured test — same roots with `--unstable-kv --allow-all` | PASS: 159 passed, 0 failed |
| Structured lint — same roots | PASS: 222 files, 0 findings |
| Structured format check — same roots | PASS: 222 files, 0 findings |
| Focused SDK/service test | PASS: 22 passed, 0 failed; public-surface tripwires and service authenticators included |
| Focused SDK/service check | PASS: 15 files, 0 findings |
| Focused SDK/service lint + format | PASS: 22 files, 0 findings |
| Auth-core bearer integration | PASS: real public `createServiceClient` path, retry resolver reuse, server acceptance, cache partitioning, browser-source scan, npm packed consumer, and non-disclosure assertions |
| Docs snippets / accuracy / links | PASS: 598 snippets scanned, 0 malformed; export accuracy and link/anchor checks clean |
| `deno doc --lint` | PASS: new auth-core SDK entrypoint has 0 private-reference or missing-JSDoc findings; package totals match recorded baselines (auth-core 4, plugin 15, auth plugin 13) |
| JSR audit + package dry-runs | PASS: all three packages pack; only recorded pre-existing plugin module-tag/cardinality and slow-types diagnostics remain |
| `deno task arch:check` | PASS: exit 0; only pre-existing repository warnings |
| `deno task quality:gate` | PASS: exit 0; only pre-existing repository warnings |
| `git diff --check` | PASS |
| Implementation touch ceiling | PASS: exactly 27 product/docs files; run artifacts excluded by the locked plan |
| Lock hygiene | PASS: working tree and `origin/main` hash `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`; no lock diff |

No local runtime, Aspire, Docker, browser, or CLI E2E command was run. The locked plan reserves
`scaffold.runtime` for a remote merge-readiness lane.

## Handoff Notes

- Separate IMPL-EVAL is still required; this implementation session did not self-evaluate.
- Evaluator should inspect credential non-disclosure assertions first, then confirm there are no SDK
  internals/client-link changes, interceptor arrays, forbidden public link symbols, or manifest
  auto-activation.
- Remote merge-readiness should run the single-pass `scaffold.runtime` suite with cleanup, as locked;
  it is intentionally not local evidence.
