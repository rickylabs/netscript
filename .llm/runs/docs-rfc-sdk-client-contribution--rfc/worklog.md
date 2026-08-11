# Worklog: typed SDK client contribution RFC

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `docs-rfc-sdk-client-contribution--rfc`            |
| Branch         | `docs/rfc-sdk-client-contribution`                 |
| Archetype      | `2 + 4 + 5 + 6` described; docs-only PR            |
| Scope overlays | `SCOPE-docs`                                       |
| Draft PR       | `https://github.com/rickylabs/netscript/pull/1390` |

## Design

### Public Surface

This PR adds only `rfcs/0000-sdk-client-contributions.md`. The accepted RFC would authorize these
future surfaces:

- `@netscript/contracts`: `NetScriptProcedureMeta` and `NetScriptAuthenticationRequirement` at the
  root.
- `@netscript/sdk/ports`: upstream-free contribution descriptor/context/cache/error contracts.
- `@netscript/sdk/client` and root: definition helper, errors, context-generic clients and query
  types, re-exported for L2/L3 use.
- `@netscript/plugin/config`: optional `sdkClients` module reference group.
- `@netscript/plugin-auth-core/sdk`: constrained bearer contribution factory.

No new generic transport/plugin/query middleware envelope is authorized. Named new RFC-A protocol
nodes and all generated client declarations are upstream-major-neutral under a non-growing
#1350/#1278 baseline for existing contract leakage. Three internal SDK ports isolate procedure
metadata, prepared outbound headers, and transport policy under
`packages/sdk/src/internal/client-contributions/`; none has a barrel or public export.

### Domain Vocabulary

- **Contribution** — versioned, named request-header preparer with runtime context declaration.
- **Preparation snapshot** — immutable context/procedure/transport/input passed independently to
  each contributor.
- **Header ownership** — exclusive lower-case header reservation; no overwrites.
- **Response-cache effect** — `invariant`, `partitioned`, or `direct-only` safety declaration.
- **Partition** — synchronous, stable, non-secret full-key discriminator visible in cache tools.
- **Transport policy** — SDK-owned discovery/codec/fetch/retry/dedupe/trace/dispatch.
- **Logical call epoch** — one ordinary invocation/stream connection sequence including its
  transport retry attempts; iterator-phase reconnect starts a new epoch.
- **Stream session** — a user-visible iterator that may contain multiple reconnect epochs.
- **Prepared call** — one immutable contributor header/context projection reused across the ordinary
  retry attempts of one epoch.

### Composition Law

1. A literal tuple derives one per-service context intersection.
2. Construction validates family/major, id, limits, required/optional context declaration, headers,
   cache effect, and duplicate ownership.
3. Calls execute contributors sequentially in tuple order with the same snapshot.
4. Contributors never observe accumulated results; valid disjoint patches commute.
5. Tuple order affects only deterministic first-error reporting.
6. The prepared-header port runs exactly once per logical call epoch and creates an immutable
   prepared call.
7. The transport-policy port receives only that prepared call; each ordinary retry reuses
   byte-equivalent contributor headers/context, then transport adds base content type and final
   trace fields.
8. Iterator-phase stream reconnect begins a new epoch and re-runs preparation exactly once, so a
   refreshed credential is visible to every retry in that reconnect sequence.

### Context and Query Law

- Required contributed properties make the request options/context required.
- Context is threaded through direct, server-query, and TanStack paths.
- Context/input/credentials never enter query keys.
- `partitioned` values add an id-sorted suffix to full keys only.
- Server defaults remain exact three-tuples; a partition suffix is exactly
  `['$netscript.sdk-context', serializedPairs]`, producing an exact five-tuple. Action/query
  factories, `CacheKey`/`CacheQuery`, the key bridge, KV persister, collections, and TanStack
  wrappers preserve the same algebra.
- `direct-only` service keys are absent from generated query/query-utils maps.
- No contribution may author query defaults, callbacks, or arbitrary key fragments.
- This law survives upstream majors; official v2 TanStack integration still excludes client context
  from query keys.

### Ports and Boundaries

- Stable v1 supplies the first private adapter; RFC-A does not expose or normatively depend on its
  link/header/context/metadata types.
- Internal `ProcedureMetadataPort`, `PreparedOutboundHeadersPort`, and `ClientTransportPolicyPort`
  responsibilities are normative; upstream wiring is not. They live only in
  `src/internal/client-contributions/{adapter-ports,prepared-call,stable-v1-adapter}.ts` and must be
  absent from root/client/ports/desktop docs and packed imports.
- Contributors see only the declared-context projection plus a separate abort signal. SDK
  retry/cache/trace/dedupe context and the private prepared-call symbol/object are not visible.
- Prepare-once is above ordinary retries. An outer wrapper is preferred; immutable per-epoch
  memoization is conforming. Direct unmemoized link-header preparation is not. Stream reconnect
  starts a fresh epoch rather than replaying indefinitely with an old credential.
- The internal `ClientLinkPort` is evidence for #451; it is not exposed by this RFC.
- `RPCHandlerConfig.plugins` remains the separate server plugin axis.
- `RequestHeadersHandlerPlugin` is only an optional incoming server companion; direct calls may have
  no request headers.
- RFC-A v1 is HTTP-only. Desktop MessagePort options do not gain contributions; type, runtime, and
  generator paths reject attempted HTTP contribution selection with a stable unsupported-transport
  error rather than silently omitting auth.
- Trace propagation is transport-owned; `traceparent`/`tracestate` are reserved.
- oRPC v2 beta, typed-error/status, coordinated protocol migration, and OTel topology are separate
  RFC/spike scope. Stable v1 already infers GET; the v2 spike must either reimplement inference and
  configure `allowMethods`/CSRF or retire GET and replace the GET-only dedupe policy.

### Security and Failure

- All contributed header values are sensitive by default.
- Stable diagnostics allow only code/phase/id/path/header-name/service/duration.
- Input, context, values, source messages, and source causes are forbidden; resolver failures are
  discarded rather than attached to the exported error.
- Bearer resolution is per call, respects metadata, defaults unmarked routes to `none`, rejects
  missing required credentials, and refuses cleartext non-local use absent explicit unsafe choice.
- Contribution failures happen before dispatch and are not server-defined errors.
- Fetch-forbidden, SDK-owned, undeclared, mixed-case, non-string, and CR/LF headers fail.

### Constants and Budgets

- RFC number: `0000` until maintainer acceptance.
- Protocol: `netscript.sdk-client`, major `1`.
- Maximum: 16 contributions/service, 8 context keys/contributor, 16 header keys/contributor.
- Id: lower-case `<owner>:<name>`, 3–128 ASCII characters.
- Cache partition: 1–64 printable ASCII, explicitly non-secret.

### Package Placement

| Concept                                  | Owner                             |
| ---------------------------------------- | --------------------------------- |
| Metadata vocabulary                      | `@netscript/contracts`            |
| Descriptor/type algebra/runtime composer | `@netscript/sdk`                  |
| Plugin module reference                  | `@netscript/plugin/config`        |
| Bearer convention                        | `@netscript/plugin-auth-core/sdk` |
| Auth delivery declaration                | thin `plugins/auth`               |
| Static import/tuple generation           | CLI/scaffold tooling              |

### Rejected Surface

`fetch`, raw links, client/adapter interceptors, oRPC link/server plugins, serializers, retries,
transport error maps, arbitrary query policy, dependency/priority ordering, runtime auto-discovery,
fluent builders, and global registries.

### Commit Slices

| # | Slice                                        | Gate                                                  | Files                                              |
| - | -------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| 1 | Activate run identity and evidence skeleton  | identity/path review + git status                     | run bootstrap artifacts                            |
| 2 | Lock research and author the RFC             | source/API citations + type proof + formatting        | RFC plus research/design artifacts                 |
| 3 | Prove docs/JSR/GitHub readiness and hand off | docs/RFC/doctrine gates + live PR reconciliation      | final artifact updates and `final-handoff.md`      |
| 4 | Reconcile root oRPC v2 audit amendment       | primary-source audit + repeated docs/PR gates         | RFC and every mandatory handoff artifact           |
| 5 | Resolve formal PLAN-EVAL cycle-1 findings    | real-surface type fixture + docs/type/link/diff gates | RFC, fixture, and every mandatory handoff artifact |

### Deferred Scope

- Framework implementation and migrations: post-acceptance issues/PRs.
- RFC number and lifecycle beyond Draft: maintainer-owned.
- Formal cross-RFC evaluator execution: root orchestrator owns existing Fable/Qwen sessions.
- Custom transport: #451.

### Contributor Path

Implement contracts/types first, then runtime composition/cache safety, then auth and locale proofs,
then discovery/generated/docs. Each slice must meet the RFC conformance gates before it can be
considered complete.

## Progress Log

| Date       | Slice | Step               | Evidence/result                                                                                                                                                                                                                         |
| ---------- | ----- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-08 | 1     | authority/identity | Read all requested skills, full harness/RFC/doctrine/profile authorities, relevant debt, and full proposal; verified exact base/session/path/auth.                                                                                      |
| 2026-08-08 | 1     | bootstrap          | Created mandatory artifacts, committed `158849031bba78025d0ec16c8361628211fbc4ed`, pushed explicit refspec, opened draft PR #1390.                                                                                                      |
| 2026-08-08 | 1     | PR metadata        | Applied required labels plus sole `status:research`; no milestone; body references #1348 without closing keyword; posted slice S1 comment.                                                                                              |
| 2026-08-08 | 2     | live board         | Re-read #1347–#1353 and #1093/#451/#928/#934/#922/#884, including milestone mapping; no mutation.                                                                                                                                       |
| 2026-08-08 | 2     | public API         | Used `deno doc` for SDK/service/plugin/contracts and focused source reads for link/query/metadata/auth/telemetry paths.                                                                                                                 |
| 2026-08-08 | 2     | dependency         | `deps:why` proves live oRPC client; stable report says coherent family is behind to 1.15.0 as of research date.                                                                                                                         |
| 2026-08-08 | 2     | upstream           | Verified official oRPC headers/context/metadata docs and Fetch/W3C/RFC/OWASP primary security sources.                                                                                                                                  |
| 2026-08-08 | 2     | type proof         | Scratch Deno proof passes required/optional intersection, named conflicts, 16 accepted, 17 rejected.                                                                                                                                    |
| 2026-08-08 | 2     | design correction  | Rejected trace as second consumer; chose locale. Added mandatory cache-effect law after finding query context/key erasure.                                                                                                              |
| 2026-08-08 | 2     | RFC                | Authored and formatted 1,000+ line decision-complete `rfcs/0000-sdk-client-contributions.md`.                                                                                                                                           |
| 2026-08-08 | 2     | JSR baseline       | Four package dry-runs OK; structured doc-lint/private-type baselines and existing plugin audit failure recorded.                                                                                                                        |
| 2026-08-08 | 3     | doctrine           | `deno task arch:check` exits 0; warning-only package debt is pre-existing and remains unwaived.                                                                                                                                         |
| 2026-08-08 | 3     | plan gate          | Self-audit covers current state/gap, alternatives, exact surface, laws, failures, migration, slices/issues, and gates; no evaluator verdict claimed.                                                                                    |
| 2026-08-08 | 3     | final docs/type    | Re-ran exact-shape type proof, eight-file format check, 102-document links, docs accuracy, focused RFC links, and diff hygiene; all pass.                                                                                               |
| 2026-08-08 | 3     | RFC commit         | Committed/pushed `89ae608ea935ba8b2776d55e7cb5a09cc29e2520`; posted structured research and plan summaries.                                                                                                                             |
| 2026-08-08 | 3     | PR reconciliation  | Draft PR has all required labels, sole `status:plan-eval`, no milestone/closing keyword; review-thread gate passes 0/0.                                                                                                                 |
| 2026-08-08 | 4     | audit intake       | Read `.llm/tmp/orpc-v2-audit-followup.md` in full (59 lines; recorded SHA-256); no evaluator or rival session launched.                                                                                                                 |
| 2026-08-08 | 4     | upstream recheck   | Official releases/migration/plugin/TanStack/error docs plus beta.25 codec/retry source confirm prerelease v2, protocol incompatibility, changed metadata, incoming-only plugin, excluded context keys, and per-retry header resolution. |
| 2026-08-08 | 4     | repository scope   | Focused scan: 91 `@orpc/*` files, 74 excluding test patterns; stable tool reports all seven workspace oRPC dependencies behind to v1.15.0.                                                                                              |
| 2026-08-08 | 4     | design amendment   | Locked zero-oRPC public declarations, three internal ports, prepare-once retry law, stable-v1 implementation, and separate v2 RFC/spike gates.                                                                                          |
| 2026-08-08 | 4     | focused validation | Re-ran eight-file format, RFC/repository links, docs accuracy, type proof, doctrine, and diff hygiene; all verdict commands exit 0.                                                                                                     |
| 2026-08-08 | 4     | amendment commit   | Committed the reviewable RFC/research amendment as `7a0d398087a6608ff1a55bb9fe4c47158edb72a7`; handoff-only commit and explicit-refspec push remain.                                                                                    |
| 2026-08-08 | 5     | verdict intake     | Read authoritative 159-line `plan-eval.md` completely; verified SHA-256 `0690af2a2914ad0a9118be04ccebb933af33b2bac8f3f743bc7990f8f5f38cdd`; accepted F-A1–F-A10 without claiming PASS.                                                  |
| 2026-08-08 | 5     | source re-baseline | Rechecked current client/query/cache/Desktop surfaces plus locked stable-v1 retry/dedupe behavior; confirmed each Fable evidence claim and the six hidden decisions.                                                                    |
| 2026-08-08 | 5     | type fixture       | Added the in-tree compile-only real-surface fixture covering current defaults, contract recursion, contribution-aware results, exact 3/5 server keys, conflicts, and 16/17 limits.                                                      |
| 2026-08-08 | 5     | design remediation | Scoped the zero-upstream gate; completed key/default/reconnect/Desktop/private-port/context laws; corrected v2 GET/OTel/lock gates; reconciled #1350 Stage 1a versus metadata Stage 1b.                                                 |
| 2026-08-08 | 5     | focused validation | Targeted Markdown/TypeScript format, fixture lint/check, focused and 102-document links, docs accuracy, doctrine, and diff hygiene all exit 0; warning-only doctrine/dependency baseline is unchanged.                                  |
| 2026-08-08 | 5     | remediation commit | Committed the RFC, in-tree type fixture, and author-owned harness correction as `78a7cecd1d5eaafa7a65bc25a21af497567128dc`.                                                                                                             |
| 2026-08-08 | 5     | handoff push       | Committed handoff evidence as `bc955459046c19a31fe00195b32f37f25a04e24f` and pushed only with `HEAD:refs/heads/docs/rfc-sdk-client-contribution`; remote advanced from `f1a29fe1a` to `bc9554590`.                                      |
| 2026-08-08 | 5     | PR reconciliation  | Replaced the stale body with cycle-1 corrections/evidence; preserved draft/main and #1348 reference-only; restored all required labels with exactly one lifecycle `status:plan-eval`; milestone remains null.                           |
| 2026-08-08 | 5     | aggregate hygiene  | Base-to-HEAD `git diff --check` exposed one trailing blank line in the original run `implement.md`; removed it so the complete RFC branch diff, not only this slice, passes.                                                            |

## Decisions

| Decision                                   | Reason                                                                                                                                         | Source                                      |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Treat RFC authorship as Plan & Design.     | Deliverable is ratifiable architecture; product code is forbidden.                                                                             | RFC process, brief, harness run loop        |
| Use Archetypes 2/4/5/6 plus `SCOPE-docs`.  | Current assigned profiles of described implementation surfaces.                                                                                | doctrine 06/11, harness profiles            |
| Do not launch/repair a session.            | Existing thread is proven; owner forbids rival authorship.                                                                                     | `codex-thread-ids.md`, WSL skill            |
| Narrow to header preparation.              | Existing native async seam covers both consumers; other fields have different owners.                                                          | SDK source, oRPC declarations/docs, A11/A14 |
| Make valid composition order-independent.  | Doctrine forbids semantic plugin-order dependence; exclusive keys make it enforceable.                                                         | doctrine extension-axis law                 |
| Add mandatory cache effect.                | Context/header variants can otherwise collide in current query keys.                                                                           | query source and upstream query types       |
| Keep trace transport-owned.                | Client span is created at fetch dispatch; earlier trace header is wrong/overwritten.                                                           | `http-client-link.ts`, W3C Trace Context    |
| Put bearer factory in auth core.           | Convention-bearing primitive belongs in core; plugin stays thin.                                                                               | doctrine 11                                 |
| Keep errors separate from contract errors. | Preparation precedes any server response.                                                                                                      | failure taxonomy, #1350 boundary            |
| Keep RFC-A upstream-major-neutral.         | v1/v2 wire and metadata/retry facilities differ; public seam must survive both.                                                                | official v2 migration, doctrine A14         |
| Implement against stable v1 only.          | v2 beta is pre-release and coordinated migration spans at least 60 production files.                                                           | releases, repo scan, root audit             |
| Prepare once above retries.                | Direct link headers can resolve per downstream retry and rotate credentials mid-call.                                                          | beta.25 codec/retry source                  |
| Classify incoming headers separately.      | Server request-header plugin is optional and absent for direct calls.                                                                          | official request-header plugin docs         |
| Scope the zero-upstream gate.              | Existing `ContractLike`/contracts deliberately contain `~orpc`; only new protocol nodes and generated client declarations can pass zero today. | F-A1, doctrine 02, #1350/#1278              |
| Make server keys exact and compatible.     | Current public factory keys are fixed three-tuples; safe partitioning requires a canonical two-slot suffix through every storage path.         | F-A2, SDK query/cache source                |
| Default every widened public generic.      | Omitted contributions must remain source-assignable to the current client/query types.                                                         | F-A3, real-surface fixture                  |
| Refresh credentials on stream reconnect.   | Iterator retry occurs after the initial call returns; reusing its preparation can freeze a bearer indefinitely.                                | F-A4, stable-v1 retry source                |
| Reject Desktop contributions.              | MessagePort has no HTTP header channel; silent acceptance would falsely imply auth delivery.                                                   | F-A5, Desktop source                        |
| Hide ports at one exact internal path.     | `src/ports/` is public; doc and packed-import negative gates must prove the seam stays private.                                                | F-A6, JSR audit                             |
| Project contributor-visible context.       | Retry/cache/trace fields and dedupe replacement are transport semantics, not extension-axis vocabulary.                                        | F-A7, stable-v1 source                      |
| Correct the v2 GET direction.              | v1 enables GET today; v2 rejects it by default and removes the inference helper, potentially making dedupe inert.                              | F-A8, migration/source audit                |

## Drift

| Drift                                                                          | Severity                 | Logged in drift.md |
| ------------------------------------------------------------------------------ | ------------------------ | ------------------ |
| Runtime controller did not match the launch-generated active thread.           | minor                    | yes                |
| Owner-directed external review route differs from default evaluator lane.      | significant, authorized  | yes                |
| Proposal's trace second consumer conflicts with current client-span injection. | significant design drift | yes                |
| Proposal omitted cache identity risk of typed auth/locale context.             | significant design drift | yes                |
| Current package doc-lint/JSR baselines contain pre-existing findings.          | baseline                 | yes                |
| Original RFC prose treated stable-v1 link headers as the normative lifecycle.  | significant design drift | yes                |
| Formal PLAN-EVAL cycle 1 found ten decision/gate completeness defects.         | authoritative FAIL_PLAN  | yes                |

## Gate Results

| Gate                    | Command                                                                                          | Result                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| RFC format              | `deno fmt --check rfcs/0000-sdk-client-contributions.md`                                         | PASS after format                                                                                                  |
| Focused RFC links       | link checker with `--root rfcs/0000-sdk-client-contributions.md`                                 | PASS, 0 broken links/anchors                                                                                       |
| Repository docs links   | `deno task docs:links`                                                                           | PASS, 102 docs, 0 broken links/anchors                                                                             |
| Docs accuracy           | `deno task docs:accuracy`                                                                        | PASS                                                                                                               |
| Original type proof     | `deno check --config .llm/tmp/deno.json .llm/tmp/sdk-client-contribution-probe.ts`               | Historical PASS; superseded by the committed real-surface fixture                                                  |
| Package audit           | four `audit-jsr-package.ts --text` runs                                                          | contracts/sdk/auth-core exit 0; plugin exit 1 on pre-existing 4 module-tag + cardinality findings; all dry-runs OK |
| Structured doc lint     | four `run-deno-doc-lint.ts` runs                                                                 | baseline private refs: contracts 9, SDK 3, plugin 15, auth-core 4; report command exits 0                          |
| Doctrine                | `deno task arch:check`                                                                           | PASS, exit 0; existing warning-only package debt recorded and not waived                                           |
| Plan Gate self-audit    | checklist against `plan-gate.md` and RFC required sections                                       | PASS for evaluator entry; not a PLAN-EVAL verdict                                                                  |
| Diff hygiene            | `git diff --check`                                                                               | PASS                                                                                                               |
| PR metadata             | live `gh pr view`                                                                                | PASS: draft/main, required labels, exactly one `status:plan-eval`, milestone null, #1348 reference only            |
| Review threads          | `deno task agentic:review-threads -- --repo rickylabs/netscript --pr 1390 --pretty`              | PASS, 0 threads / 0 unanswered                                                                                     |
| Audit input             | `wc -l` and `sha256sum .llm/tmp/orpc-v2-audit-followup.md`                                       | PASS, 59 lines; SHA-256 `fa8b0ab5cd1afd57b8f6c20036a265fa7c8fb48764f88f97f289c44c0737d3d0`                         |
| oRPC stable channel     | `deno task deps:latest --filter '@orpc/*'`                                                       | Seven v1.14.x workspace dependencies behind to stable v1.15.0; evidence only, no dependency mutation               |
| oRPC impact scan        | focused `rg -l '@orpc/' packages plugins`                                                        | 91 reference files; 74 after excluding test paths/name patterns                                                    |
| Amendment format        | `deno fmt --check` on RFC plus seven mandatory handoff artifacts                                 | PASS, eight files                                                                                                  |
| Amendment RFC links     | focused internal-doc link checker                                                                | PASS, 1 document, 0 broken links/anchors                                                                           |
| Amendment docs          | `deno task docs:links`; `deno task docs:accuracy`                                                | PASS, 102 docs/0 broken; accuracy PASS                                                                             |
| Amendment type proof    | ignored exact-shape Deno probe                                                                   | Historical PASS; superseded by cycle-1 remediation fixture                                                         |
| Amendment doctrine      | `deno task arch:check`                                                                           | PASS, exit 0; warning-only baseline unchanged                                                                      |
| Cycle-1 type fixture    | `deno check --unstable-kv packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` | PASS, exit 0; current defaults/contract recursion/3-and-5-key shapes/16-and-17 budget checked                      |
| Cycle-1 format          | `deno fmt --check` on RFC, fixture, and seven author-owned mandatory artifacts                   | PASS, 9 files checked                                                                                              |
| Cycle-1 fixture lint    | scoped `run-deno-lint.ts --file ...sdk-client-contributions-rfc_type.ts`                         | PASS, 1 file, 0 occurrences                                                                                        |
| Cycle-1 RFC links       | focused internal-doc link checker                                                                | PASS, 1 document, 0 broken links/anchors                                                                           |
| Cycle-1 repository docs | `deno task docs:links`; `deno task docs:accuracy`                                                | PASS, 102 docs/0 broken; accuracy PASS                                                                             |
| Cycle-1 doctrine        | `deno task arch:check`                                                                           | PASS, exit 0; warning-only dependency/doctrine baseline unchanged                                                  |
| Cycle-1 diff hygiene    | `git diff --check`                                                                               | PASS                                                                                                               |
| Cycle-1 aggregate diff  | `git diff --check origin/main...HEAD` after bootstrap-artifact whitespace correction             | PASS                                                                                                               |
| Cycle-1 review threads  | `deno task agentic:review-threads -- --repo rickylabs/netscript --pr 1390 --pretty`              | PASS, 0 total / 0 unanswered                                                                                       |
| Cycle-1 PR metadata     | live `gh pr view 1390`                                                                           | PASS, draft/main, required labels, exactly one `status:plan-eval`, milestone null, #1348 reference only            |
| Cycle-1 explicit push   | `git push origin HEAD:refs/heads/docs/rfc-sdk-client-contribution`                               | PASS, `f1a29fe1a..bc9554590`                                                                                       |

Cycle-1 remediation validation, commits, explicit-refspec push, and live PR reconciliation are
complete. External Fable cycle 2 and later Qwen verdicts remain pending by owner instruction; this
author does not self-approve or launch them.

## Handoff Notes

External reviewers should attack:

1. whether the cache-effect law fully closes cross-principal/context query reuse;
2. whether any rejected transport field is actually required for the two consumers;
3. whether context declaration/static/runtime diagnostics are implementable within the stated
   inference budget;
4. whether redaction permits any indirect token/partition leakage or source-error reappearance; and
5. whether plugin availability versus explicit activation is sufficiently concrete for #1093 and
   generators;
6. whether the internal outer wrapper or memoized realization best proves unary prepare-once while a
   stream reconnect necessarily starts a fresh preparation epoch;
7. whether auth metadata sits inside RFC-A acceptance or a dependent ratification;
8. whether stable-v1.15.0 should precede the seam and incoming request headers should be preset
   default; and
9. whether the separate v2 RFC completely gates replacement method inference, `allowMethods`/CSRF,
   dedupe effectiveness, mixed endpoints, OTel ownership, Desktop serializers, SSE credential
   refresh, cache partitioning, runtime matrices, E2E, docs, and publish proof; and
10. whether each of F-A1 through F-A10 is now resolved without changing the contribution axis.
