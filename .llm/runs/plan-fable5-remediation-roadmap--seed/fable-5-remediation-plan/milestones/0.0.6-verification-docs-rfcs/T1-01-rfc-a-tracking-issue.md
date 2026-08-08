# rfc: SdkClientContribution — one typed chain for client construction, credentials, transport, policy metadata, and query invalidation — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T1-01 · **Proposed milestone:** `0.0.6` · **Labels:** `rfc` `type:feat` `area:sdk`
`area:plugins` `priority:p1` `status:triage` · **Depends on:** none

> Filing note (not part of the issue body): file via the `rfc_proposal.yml` form, which auto-applies
> `rfc` + `status:triage` and prefixes the title with `rfc: `. The RFC text is
> `rfcs/RFC-A-sdk-client-composition.md` in this run; per `research/github-conventions.md` §5.4 the
> live house pattern is an issue-hosted RFC (#1123), not a merged `rfcs/NNNN-*.md` file — zero
> numbered RFC files have ever merged. Paste the RFC's numbered sections into the issue body, or
> open the RFC PR **and** this tracking issue if the owner wants the documented file process
> exercised for the first time. Record which was chosen.

## Summary

`@netscript/sdk` owns a transport nobody can extend. `CreateServiceClientOptions` is a closed
nine-field record with no `headers`, `fetch`, `interceptors`, `plugins`, `link`, or context type
parameter, and `ServiceClientContext` is a closed interface rather than a type parameter — so the
shipped auth plugin cannot ride the typed client, no plugin can contribute to client construction,
and procedure policy metadata does not exist. Every mechanism needed is already present in the
pinned oRPC 1.14.6, so this is an un-hiding problem, not a missing-primitive problem. This RFC
ratifies one versioned `SdkClientContribution` contract that carries client construction, request
context, headers/credentials, transport middleware, `$meta` policy metadata, response/error types,
and query defaults/invalidation through a single typed chain, before #928 defines a second
contribution dialect and before #934 invents its own policy shape.

## Evidence

- RFC text: `rfcs/RFC-A-sdk-client-composition.md` (this run).
- Corpus: `research/repo-audit/services-sdk.md` §2, §3.1–§3.6, gap register S4/S5/S11/S12/S13;
  `research/repo-audit/auth.md` §0, §2, §3.1, gaps G1/G2/G9/G10;
  `research/external/orpc.md` §1, §4 (G1–G4, G6, G7, G11), §5, §6.
- Source at baseline `fac9e339042c` (re-verified for this draft):
  - `packages/sdk/src/ports/service-client.ts:203-222` — the closed nine-field options record;
    `port` and `timeout` documented "Reserved …".
  - `packages/sdk/src/ports/service-client.ts:129-155` — `ServiceClientContext` is a concrete
    interface, not a type parameter.
  - `packages/sdk/src/client/service-client.ts:41-49` — `port`/`timeout` are never destructured.
  - `packages/sdk/src/client/http-client-link.ts:82-126` — `method`, `headers`, and `plugins` are
    literals inside the link.
  - `packages/sdk/src/client/mod.ts:15-36` — `createHttpClientLink` is not exported;
    `packages/sdk/src/ports/mod.ts:7` advertises "the transport seam" while
    `packages/sdk/src/ports/client-link-factory.ts:18-25` is unexported.
  - `packages/service/src/primitives/handlers.ts:41-58` vs
    `packages/service/src/builder/service-rpc.ts:57` — `RPCHandlerConfig.plugins` exists and is never
    populated by the builder path.
  - `packages/plugin/src/config/domain/plugin-contributions.ts:12-39` — twelve contribution groups,
    none client-side; `:16` is a closed literal union naming a first-party plugin.
  - `grep -rnE '\$meta<|\.meta\(' packages plugins` → no oRPC metadata usage.
- Board: #928 (contribution contracts v1, `0.0.7`), #934 (deny-by-default gateway, `0.0.7`), #1093
  (discovery hardcodes official factories, `0.0.6`), #884 (org-aware policy contracts, `0.0.12`),
  #451 (in-process link mode, `Backlog / Triage`).

## Current surface

`createServiceClient(options)` → `createORPCClient(createHttpClientLink(...))`
(`packages/sdk/src/client/service-client.ts:41-66`). The link is constructed once with literal
`headers`, literal `plugins`, hard-coded `fetch`, and `method:
inferRPCMethodFromContractRouter(contract)`. The only per-call seam that works is the retry/dedupe
knob set typed into `ServiceClientContext` (`http-client-link.ts:27`, regression-tested at
`packages/sdk/tests/integration/service-client-runtime_test.ts:113,153`). `defineServices()` forwards
the same nine fields and inherits the gap wholesale
(`packages/sdk/src/presets/define-services.ts:106-116`). There is no plugin-facing client axis
anywhere.

## Target contract

A ratified RFC-A that fixes, at minimum:

- a versioned `SdkClientContribution` envelope (literal `contractVersion`, namespaced `name`,
  `environment`, `requires`, typed `context` marker, `headerKeys` + `headers`, the four oRPC
  interceptor/plugin arrays, `fetch`, `errors`, `query`);
- a composition algebra where the client's per-call context is the intersection of the chain's
  declared contexts and `with` is optional — a host app with no plugins compiles unchanged;
- a failure taxonomy in which absence, version mismatch, and conflict fail at compile time or
  construction time, never as a missing header or a silently dropped plugin;
- `NetScriptProcedureMeta.policy` as the single policy-metadata shape, threaded through
  `baseContract` via `oc.$meta<…>()`;
- server/client environment boundaries that are enforced, not documented;
- the rule that contributions never observe the HTTP method, so oRPC v2's POST-only default lands in
  one owned function.

Ratification means: the owner accepts or amends the shape, the tracking issue receives its
milestone, and T1-02…T1-06 may proceed. This issue closes only when all implementation children are
merged.

## Acceptance

- [ ] RFC-A text is published in the house shape and linked from this issue.
- [ ] The envelope's field list, version rule, and composition algebra are ratified or amended in
      writing by the owner.
- [ ] The failure taxonomy (absence / version mismatch / conflict) is ratified with the detection
      point named for each row.
- [ ] `NetScriptProcedureMeta.policy` is ratified as the single policy shape, and #934 is notified on
      its issue before it reaches implementation.
- [ ] The envelope is reviewed against #928's contribution contract and the divergences are recorded
      on both issues.
- [ ] Q1 (cookie topology) and Q2 (`PluginContributions` group shape) are answered on this issue
      before T1-05 opens.
- [ ] Every implementation child (T1-02…T1-06) references this issue with `Part of #<this>`.
- [ ] This issue is not closed by any implementation PR's closing keyword.

## Boundaries

- Do **not** duplicate **#928** (`[frontend-contrib S6] plugin-frontend-core contracts/v1`) — it owns
  the frontend contribution contract; this RFC only asks that the two envelopes share a version
  field, a conflict key, and a failure taxonomy.
- Do **not** duplicate **#934** (generated deny-by-default procedure gateway) — it owns the gateway;
  this RFC owns only the metadata type it will read.
- Do **not** duplicate **#1093** (plugin discovery hardcodes official factory functions) — it owns
  discovery; this RFC owns the contribution shape.
- Do **not** duplicate **#884** (organization-aware identity and authorization policy contracts) —
  tenancy typing on `Principal`/`AuthSession` stays there; this RFC only keeps the client context
  extensible enough that a tenant field can arrive later.
- Do **not** duplicate **#885** (auth conformance/mocking/scaffold test kit) or **#872**
  (auth capability discovery).
- Do **not** duplicate **#451** (in-process link-mode adapter) — T1-02's public link seam unblocks
  it; it stays its own issue.
- Do **not** duplicate **#1278** (type soundness ratification) — the `safe`/`isDefinedError` repair
  is filed as T1-03 against a specific executed check, not as a soundness sweep.
- Not in scope: implementation. This is a tracking issue; no code lands under it directly.

## Docs/consumer proof

Ratification is proved by documents, not by code: the RFC text, the owner's written disposition, the
cross-links recorded on #928 and #934, and answers to Q1/Q2 on this issue. Adoption proof belongs to
the children — T1-05 and T1-06 must each show a working consumer, and T1-03 must show
`docs/site/services-sdk/sdk.md:199` compiling.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Drafted from the Stage-B
corpus (`research/repo-audit/services-sdk.md`, `research/repo-audit/auth.md`,
`research/external/orpc.md`) and Stage-C synthesis §4 (pack T1) and §5. All source claims re-verified
against worktree baseline `fac9e339042c`. No GitHub mutation was performed.
