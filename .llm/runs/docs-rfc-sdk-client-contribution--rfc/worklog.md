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

No new generic transport/plugin/query middleware envelope is authorized. All public and generated
declarations are upstream-major-neutral. Three internal SDK ports isolate procedure metadata,
prepared outbound headers, and transport policy; none is a public export.

### Domain Vocabulary

- **Contribution** — versioned, named request-header preparer with runtime context declaration.
- **Preparation snapshot** — immutable context/procedure/transport/input passed independently to
  each contributor.
- **Header ownership** — exclusive lower-case header reservation; no overwrites.
- **Response-cache effect** — `invariant`, `partitioned`, or `direct-only` safety declaration.
- **Partition** — synchronous, stable, non-secret full-key discriminator visible in cache tools.
- **Transport policy** — SDK-owned discovery/codec/fetch/retry/dedupe/trace/dispatch.
- **Logical call** — one user invocation including all transport retry attempts.
- **Prepared call** — one immutable contributor header/context snapshot reused across those
  attempts.

### Composition Law

1. A literal tuple derives one per-service context intersection.
2. Construction validates family/major, id, limits, required/optional context declaration, headers,
   cache effect, and duplicate ownership.
3. Calls execute contributors sequentially in tuple order with the same snapshot.
4. Contributors never observe accumulated results; valid disjoint patches commute.
5. Tuple order affects only deterministic first-error reporting.
6. The prepared-header port runs exactly once per logical call and creates an immutable prepared
   call.
7. The transport-policy port receives only that prepared call; each retry reuses byte-equivalent
   contributor headers/context, then transport adds base content type and final trace fields.

### Context and Query Law

- Required contributed properties make the request options/context required.
- Context is threaded through direct, server-query, and TanStack paths.
- Context/input/credentials never enter query keys.
- `partitioned` values add an id-sorted suffix to full keys only.
- `direct-only` service keys are absent from generated query/query-utils maps.
- No contribution may author query defaults, callbacks, or arbitrary key fragments.
- This law survives upstream majors; official v2 TanStack integration still excludes client context
  from query keys.

### Ports and Boundaries

- Stable v1 supplies the first private adapter; RFC-A does not expose or normatively depend on its
  link/header/context/metadata types.
- Internal `ProcedureMetadataPort`, `PreparedOutboundHeadersPort`, and `ClientTransportPolicyPort`
  responsibilities are normative; upstream wiring is not.
- Prepare-once is above retries. An outer wrapper is preferred; immutable per-logical-call
  memoization is conforming. Direct unmemoized link-header preparation is not.
- The internal `ClientLinkPort` is evidence for #451; it is not exposed by this RFC.
- `RPCHandlerConfig.plugins` remains the separate server plugin axis.
- `RequestHeadersHandlerPlugin` is only an optional incoming server companion; direct calls may have
  no request headers.
- Trace propagation is transport-owned; `traceparent`/`tracestate` are reserved.
- oRPC v2 beta, typed-error/status, GET/CSRF, OpenTelemetry, and coordinated protocol migration are
  separately owned RFC/spike scope.

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

| # | Slice                                        | Gate                                             | Files                                         |
| - | -------------------------------------------- | ------------------------------------------------ | --------------------------------------------- |
| 1 | Activate run identity and evidence skeleton  | identity/path review + git status                | run bootstrap artifacts                       |
| 2 | Lock research and author the RFC             | source/API citations + type proof + formatting   | RFC plus research/design artifacts            |
| 3 | Prove docs/JSR/GitHub readiness and hand off | docs/RFC/doctrine gates + live PR reconciliation | final artifact updates and `final-handoff.md` |
| 4 | Reconcile root oRPC v2 audit amendment       | primary-source audit + repeated docs/PR gates    | RFC and every mandatory handoff artifact      |

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

## Decisions

| Decision                                   | Reason                                                                                 | Source                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------- |
| Treat RFC authorship as Plan & Design.     | Deliverable is ratifiable architecture; product code is forbidden.                     | RFC process, brief, harness run loop        |
| Use Archetypes 2/4/5/6 plus `SCOPE-docs`.  | Current assigned profiles of described implementation surfaces.                        | doctrine 06/11, harness profiles            |
| Do not launch/repair a session.            | Existing thread is proven; owner forbids rival authorship.                             | `codex-thread-ids.md`, WSL skill            |
| Narrow to header preparation.              | Existing native async seam covers both consumers; other fields have different owners.  | SDK source, oRPC declarations/docs, A11/A14 |
| Make valid composition order-independent.  | Doctrine forbids semantic plugin-order dependence; exclusive keys make it enforceable. | doctrine extension-axis law                 |
| Add mandatory cache effect.                | Context/header variants can otherwise collide in current query keys.                   | query source and upstream query types       |
| Keep trace transport-owned.                | Client span is created at fetch dispatch; earlier trace header is wrong/overwritten.   | `http-client-link.ts`, W3C Trace Context    |
| Put bearer factory in auth core.           | Convention-bearing primitive belongs in core; plugin stays thin.                       | doctrine 11                                 |
| Keep errors separate from contract errors. | Preparation precedes any server response.                                              | failure taxonomy, #1350 boundary            |
| Keep RFC-A upstream-major-neutral.         | v1/v2 wire and metadata/retry facilities differ; public seam must survive both.        | official v2 migration, doctrine A14         |
| Implement against stable v1 only.          | v2 beta is pre-release and coordinated migration spans at least 60 production files.   | releases, repo scan, root audit             |
| Prepare once above retries.                | Direct link headers can resolve per downstream retry and rotate credentials mid-call.  | beta.25 codec/retry source                  |
| Classify incoming headers separately.      | Server request-header plugin is optional and absent for direct calls.                  | official request-header plugin docs         |

## Drift

| Drift                                                                          | Severity                 | Logged in drift.md |
| ------------------------------------------------------------------------------ | ------------------------ | ------------------ |
| Runtime controller did not match the launch-generated active thread.           | minor                    | yes                |
| Owner-directed external review route differs from default evaluator lane.      | significant, authorized  | yes                |
| Proposal's trace second consumer conflicts with current client-span injection. | significant design drift | yes                |
| Proposal omitted cache identity risk of typed auth/locale context.             | significant design drift | yes                |
| Current package doc-lint/JSR baselines contain pre-existing findings.          | baseline                 | yes                |
| Original RFC prose treated stable-v1 link headers as the normative lifecycle.  | significant design drift | yes                |

## Gate Results

| Gate                  | Command                                                                             | Result                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| RFC format            | `deno fmt --check rfcs/0000-sdk-client-contributions.md`                            | PASS after format                                                                                                  |
| Focused RFC links     | link checker with `--root rfcs/0000-sdk-client-contributions.md`                    | PASS, 0 broken links/anchors                                                                                       |
| Repository docs links | `deno task docs:links`                                                              | PASS, 102 docs, 0 broken links/anchors                                                                             |
| Docs accuracy         | `deno task docs:accuracy`                                                           | PASS                                                                                                               |
| Type proof            | `deno check --config .llm/tmp/deno.json .llm/tmp/sdk-client-contribution-probe.ts`  | PASS                                                                                                               |
| Package audit         | four `audit-jsr-package.ts --text` runs                                             | contracts/sdk/auth-core exit 0; plugin exit 1 on pre-existing 4 module-tag + cardinality findings; all dry-runs OK |
| Structured doc lint   | four `run-deno-doc-lint.ts` runs                                                    | baseline private refs: contracts 9, SDK 3, plugin 15, auth-core 4; report command exits 0                          |
| Doctrine              | `deno task arch:check`                                                              | PASS, exit 0; existing warning-only package debt recorded and not waived                                           |
| Plan Gate self-audit  | checklist against `plan-gate.md` and RFC required sections                          | PASS for evaluator entry; not a PLAN-EVAL verdict                                                                  |
| Diff hygiene          | `git diff --check`                                                                  | PASS                                                                                                               |
| PR metadata           | live `gh pr view`                                                                   | PASS: draft/main, required labels, exactly one `status:plan-eval`, milestone null, #1348 reference only            |
| Review threads        | `deno task agentic:review-threads -- --repo rickylabs/netscript --pr 1390 --pretty` | PASS, 0 threads / 0 unanswered                                                                                     |
| Audit input           | `wc -l` and `sha256sum .llm/tmp/orpc-v2-audit-followup.md`                          | PASS, 59 lines; SHA-256 `fa8b0ab5cd1afd57b8f6c20036a265fa7c8fb48764f88f97f289c44c0737d3d0`                         |
| oRPC stable channel   | `deno task deps:latest --filter '@orpc/*'`                                          | Seven v1.14.x workspace dependencies behind to stable v1.15.0; evidence only, no dependency mutation               |
| oRPC impact scan      | focused `rg -l '@orpc/' packages plugins`                                           | 91 reference files; 74 after excluding test paths/name patterns                                                    |
| Amendment format      | `deno fmt --check` on RFC plus seven mandatory handoff artifacts                    | PASS, eight files                                                                                                  |
| Amendment RFC links   | focused internal-doc link checker                                                   | PASS, 1 document, 0 broken links/anchors                                                                           |
| Amendment docs        | `deno task docs:links`; `deno task docs:accuracy`                                   | PASS, 102 docs/0 broken; accuracy PASS                                                                             |
| Amendment type proof  | ignored exact-shape Deno probe                                                      | PASS                                                                                                               |
| Amendment doctrine    | `deno task arch:check`                                                              | PASS, exit 0; warning-only baseline unchanged                                                                      |

The root-requested amendment content gates are complete. Its commit, explicit-refspec push, final PR
reconciliation, and external Fable/Qwen verdicts remain pending at this checkpoint.

## Handoff Notes

External reviewers should attack:

1. whether the cache-effect law fully closes cross-principal/context query reuse;
2. whether any rejected transport field is actually required for the two consumers;
3. whether context declaration/static/runtime diagnostics are implementable within the stated
   inference budget;
4. whether redaction permits any indirect token/partition leakage or source-error reappearance; and
5. whether plugin availability versus explicit activation is sufficiently concrete for #1093 and
   generators;
6. whether the internal outer wrapper or memoized realization best proves prepare-once;
7. whether auth metadata sits inside RFC-A acceptance or a dependent ratification;
8. whether stable-v1.15.0 should precede the seam and incoming request headers should be preset
   default; and
9. whether the separate v2 RFC gates GET/CSRF, mixed endpoints, and OTel ownership strongly enough.
