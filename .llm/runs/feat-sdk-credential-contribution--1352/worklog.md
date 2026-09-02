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
| 3 | Consumer guidance and final evidence | docs lint plus complete S5 gate set | two planned site docs and run artifacts |

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

## Gate Results

Baseline evidence is in `research.md`; implementation gates are not yet run.

## Handoff Notes

- Evaluator should inspect credential non-disclosure assertions first, then confirm there are no SDK
  internals/client-link changes and no manifest auto-activation.
