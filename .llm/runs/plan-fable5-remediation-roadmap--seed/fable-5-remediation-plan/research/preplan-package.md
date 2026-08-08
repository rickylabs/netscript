# Codex pre-plan package — supervisor distillation

Source (read in full by the Tier-A supervisor, 2026-08-08):
`/mnt/g/My Drive/DEV/Devocracy/Vault/Devocracy/website/blog/Netscript/agent-posts/codex-sol-last-runs-remediation-plan/`
(`README.md` 347 ln, `ISSUE-DEDUP-MATRIX.md` 97 ln, `EVIDENCE-REGISTER.md` 90 ln, all dated
2026-08-08, based on a read-only audit of 265 open issues / 11 open milestones).

Charter status: **evidence and a deduplicated starting point — not the outline**. The roadmap must
be substantially broader.

## Executive claims (README.md §Executive conclusion)

- Wave-6 Billing passes 3 (Codex Sol high, eval Opus 5 medium) and 4 (Opus 5 high, eval Sol
  medium; 61/100, experiment GO / merge NO-GO) prove the harness can produce substantial work; the
  earlier catastrophic run was model/run-specific.
- Consistent ceiling: agents build credible backends and attractive screens but drift away from
  NetScript's differentiated frontend composition model and production command/security boundaries
  **unless generation makes the idiomatic path the easiest path**.
- Direction: **generation over prose, types over convention-only guidance, composable seams over
  one-off escape hatches**.

## Dedup constraints the roadmap must honor (ISSUE-DEDUP-MATRIX.md)

Existing owners — never duplicate: #1325 (trigger Redis), #1326 (stream reconnect), #1327
(db migrate false success), #1329 (SSE envelope + consumer), #1332 (DB-schema-first), #979
(fixed ports), #1210 (page-builder deep dives), #1208 (contract-first routes), #1260 (MCP SDK
prose), #1278/#1276 (type soundness), #1328→PR #1342 landed + #1343 (installed-consumer proof,
0.0.6), #1280 (backing health, blocked upstream), #1245 (query cache/dehydration defect), #1249
(withForm defect), #922/#928/#934/#942/#946 (frontend-plugin gateway doctrine), #884/#885
(tenancy), #1090/#1102/#1197/#1201 (agent discovery/measured adoption), #1093 (third-party
contribution doctrine), #1184 (saga Redis glue, closed).

Expand instead of new: **#1333** (canonical scaffolded frontend — add contract-first route,
cache-first SDK path, withResource, typed params, route-local `(_components)/(_islands)/
(_shared)/(_lib)`, no-`any` consumer gate, four-seam distinction DB/API/route/view-model, states,
`/design` links); **#1335** (generated-surface conformance umbrella — add focused children);
**#1210** (add cross-capability golden recipes).

## New issues/RFCs proposed by the pre-plan (high confidence)

- **A (p0 RFC)**: plugin-extensible end-to-end type-safe SDK/client composition
  (`SdkClientContribution`), auth as first dogfood + second non-auth plugin proof; review oRPC
  middleware/context/interceptors first; align #1093, #922/#934, keep host-app composition
  independently usable.
- **B (p1 CLI)**: generate contract-derived SDK/query/invalidation module (idempotent, manifest-
  derived, drift-detecting, includes installed contributions; depends on RFC A).
- **C (p1 CLI)**: idiomatic resource/route-slice generator extending `ui:add page` (typed route
  contract, definePage root, route-local groups, cache-first loader, withResource, optional
  form/partial/stream, state stubs, tests that reject `any`/raw-fetch/manual parsing).
- **D (p0 runtime)**: saga publication discoverable/checked/causally authoritative (no silent
  fixed-port fallback, non-ignorable publish receipts, correlation proof, compensation consumed
  durably, OOM investigation row).
- **E (p1)**: plugin runtime liveness — wrapper state must reflect child readiness (distinct from
  #1280).
- **F (p1)**: streams durable-storage semantics explicit and safe by default (persistence mode,
  restart proof, retention; coordinate #1326/#1329).
- **G (p2, repro-first)**: plugin doctor vs generated installed-consumer layout (post-#1342 canary
  repro required before filing).
- **H (p1 RFC/research)**: production command composition kit (transaction/UoW, optimistic
  version, idempotency receipt, audit+outbox same-commit, injected-failure tests) — DB-adapter-
  neutral, must not become billing-specific.
- Service-layout child under #1335: collapsible `domain/application/ports/adapters/routers/auth`
  slice vocabulary + `service add-handler` placement + decision table.

## Verify-before-filing list

Theme-island CORS failure; saga OOM; plugin doctor behavior; mobile action loss (→ #1333
acceptance unless a Fresh UI defect); webhook dispatch (recipe vs worker template vs plugin —
decide before calling it a defect).

## Wave-7 rules carried forward (README §Harness implications)

proved/simulated/absent/rejected capability rows with one evidence pointer each; causal claims
need remove-the-seam-and-it-fails traces; config/registry/green-wrapper/screenshot ≠ proof; every
gate enumerated separately; mechanical article fidelity check; runtime truth wins; generated
slice commands used or rejection recorded; `any`/`as unknown as`/raw parsing/raw fetch are review
blockers.

## Owner review constraints (EVIDENCE-REGISTER §Owner review)

Dedicated Wave-7 for frontend quality (don't bloat Wave 6); types are a hard invariant; canonical
folders + CLI-generated vertical slices to cut drift/tokens; plugin composition extends seams
(typed SDK/client), auth dogfoods the generic contract; generation covers client/query/
invalidation boilerplate + normal app route groups; roadmap must be much broader than the
pre-plan and establish NetScript as a credible meta-framework, with RFCs where architecture is
unsettled.

## Milestone observations (dedup matrix §Milestone observations)

#1333 sits in 0.0.5 while related canonical-surface work is 0.0.6 and #1335 is Backlog/Triage —
normalize ownership. SDK-extension starts as RFC before binding contracts to an implementation
milestone. Future plugin/auth milestones shift only as part of a coherent dependency graph — never
silently absorbed into the frontend epic; every issue retained and moved.
