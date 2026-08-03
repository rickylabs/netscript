# Plan — plan-openapi-mcp-plugin--seed (generator draft, rev 2, post-adversarial)

> **Status: generator draft, post-adversarial.** Rev 2 integrates the Sol stage-2 findings
> (`adversarial-sol.md`; per-finding dispositions in `adversarial-triage.md` — 25/25 accepted,
> 10 blockers). Pending: owner ratification. Drafts only; no board mutations; no product code.

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `plan-openapi-mcp-plugin--seed` |
| Branch | `plan/openapi-mcp-plugin` |
| Phase | `plan` (seed design) |
| Target | `packages/mcp` extension + small seams (cli templates, contracts) — **no new package** |
| Archetype | **2 (integration — S-20)**: bounded flows behind ports/adapters over HTTP + filesystem; full ARCHETYPE-2 gate column applies. ARCHETYPE-5 evaluated and **rejected** with reasons (see D1, `design/canonical/06-doctrine-fit.md`) |
| Scope overlays | none (tooling/service surface; no frontend, no docs-only) |
| Tracking | #1117 (milestone 0.0.5) · related #1102 #1072 #1071 #1093 |

## Goal

Make every scaffolded service's live `/api/openapi.json` legible to the agent debugging it,
through the MCP server that agent already has connected — so the wave-four failure mode (blind
`curl`, 25 minutes lost to a silent hang) cannot recur. Read-only introspection first; execution
as a designed, gated follow-up.

## Scope

- New MCP tools (introspection triad) in `packages/mcp`, joining the existing closed registry.
- A projection module (spec JSON → operation index / schema views) owned by `packages/mcp`
  domain — written in-house, no runtime dependency (research.md §3 sourcing verdict).
- A service-endpoint discovery lane bridging Aspire dynamic ports to the out-of-tree MCP process
  (design/canonical/02): generated-helper endpoint manifest + static appsettings fallback.
- Activation wiring per #1071/#1072 precedent (instructions string, app-scoped AGENTS.md line,
  evidence-receipt integration).
- Contract metadata enrichment prerequisite (`summary`/`tags` on first-party `.route()` calls).
- A fully designed but deferred execution tool (`invoke_service_operation`) with its policy
  vocabulary.

## Non-Scope

- No new package, no plugin package (D1). No hosted service, no credentials; **no non-loopback
  traffic without an explicit human-written override** (S-4 scoping of the rev-1 "no network
  beyond localhost" claim; per #1117's rejection of hosted Scalar).
- No fix for #1093 (independent issue; this design neither blocks on it nor worsens it — D8).
- No docs-MCP retrieval capability work (#1102's lane).
- No HTTP transport for the MCP server (stdio remains; the discovery design deliberately avoids
  needing one).

## Hidden Scope (a naive read would miss)

- The MCP process has **no** `services__*` env vars (research.md §2.3) — the "largely solved"
  note in #1117 (`getServiceUrl` exists) is true only inside Aspire-launched processes. The
  discovery lane is real design work, not wiring.
- First-party contracts carry no `summary`/`tags` today; without the enrichment slice the tool
  output degrades to method+path+schema-descriptions (still useful, not "reads like NetScript").
- The tool registry is a closed enum with static output schemas and central truncation — dynamic
  per-operation tool registration would be an architectural change to `packages/mcp`, not an
  addition (this constraint helps: it forces the meta-tool shape, D2).

## Locked Decisions

| ID | Decision | Rationale (full text in design/canonical/) |
| --- | --- | --- |
| D1 | **Extend `packages/mcp` core; no plugin, no new package.** | Thinness law: the projection (naming, schema mapping, filtering, agent-facing vocabulary) is convention-bearing → core. What a plugin could own (opt-in, discovery wiring, policy) has **no provider variance** — one MCP server, one spec producer, one discovery mechanism. Doctrine 07: "If you cannot name the axis cleanly, do not abstract." A plugin here would own a contribution axis (the archetype's named smell) or be an empty shell around core exports. 06-doctrine-fit.md argues this against AP/F by name. |
| D2 | **Meta-tool triad, not one-tool-per-operation:** `list_api_services` (read), `list_service_operations` (read), `get_operation_schema` (read); v2 adds gated `invoke_service_operation` (mutate). | Fits the closed static registry (research §2.2); avoids tool-count/context explosion (prior-art consensus, research §3); scaffolded apps have few services but unbounded operations; ivo-toby's dynamic mode is the proven reference shape. |
| D3 | **Discovery lane: AppHost-published endpoint manifest, read by the MCP — mechanism P1-arbitrated, not locked (S-7).** The rev-1 producer (helper body) provably runs before endpoint allocation; [P1] must demonstrate a run-mode post-allocation callback, else F1(b) (`aspire` CLI adapter) activates inside the same port contract. Manifest carries identity binding `projectRoot` + `runId` (S-8); `ServiceEndpointDirectoryPort` reports per-source outcomes (S-9), deterministic precedence override > manifest > appsettings with visible conflicts (S-10); bounded, identity-cross-checked spec fetches (S-11, S-8); one status mapping (S-12). | Works offline, no new processes/transports, no hosted deps; the AppHost is the only party that authoritatively knows resolved ports; the MCP already receives `--project-root`. |
| D4 | **Projection written in-house in `packages/mcp` domain** (pure functions over fetched spec JSON). Operation identity = `operationId` (oRPC defaults it to the dotted contract path — verified, research §2.1). Description ladder per nihal1294: summary → first description sentence → humanized operationId → synthesized from method+path. Vendor nothing at runtime. | The producer is in-repo: internal refs only, deterministic shape, dotted operationIds for free. The generic compat problem the upstream libraries solve does not exist here; a dependency would import their problem surface (Node coupling, eval-based validation in harsha's server path) without need. |
| D5 | **v1 is introspection-only. Execution is designed now, shipped later, opt-in, deny-by-default.** Exact fail-closed carrier `.netscript/agent-mcp.json` (S-1: absent/malformed/empty/partial all deny, with fixtures); canonical-identity policy evaluation with ambiguity refusal (S-2); `confirm` demoted to friction — no security credit (S-3); a real OpenAPI-subset validator with location-aware inputs (S-5); safe-method default (GET/HEAD), no credential forwarding ever, receipts after output validation (S-15). | #1117's own risk analysis; read-only kills blind curl at near-zero risk; execution against a live dev DB is a deliberate second decision (fork F2 offers the owner the timing choice). |
| D6 | **All AppHost services by default; per-service opt-out** in config; auth-guarded spec endpoints produce a structured `spec_unavailable` result naming the authz rule symptom and the fix, never a silent failure. | The value is fleet-wide legibility (brief question 3); opt-out covers the rare sensitive service; the auth edge is open question → P3 proof. |
| D7 | **Activation is designed, not assumed** (#1071/#1072 pattern): (a) tools live in the server agents already have configured — zero install; (b) the `initialize` instructions string names the moment ("before curl-ing a service, `list_service_operations`"); (c) scaffolded app-scoped `AGENTS.md` gains one behavioural line; (d) introspection receipts join the #1078 evidence-gate machinery (strength: fork F4); (e) endpoint-shaped failures in existing tool output cross-reference `get_operation_schema`. Observational acceptance routes to #1090. | Wave four proves capability without activation is worth zero (docs MCP: 0 calls). |
| D8 | **#1093 does not block this design and this design does not worsen it.** No core code branches on a plugin/service name: discovery reads data (appsettings + run-state manifest); the projection reads specs. Had we chosen the plugin shape, we'd have needed a *new* MCP-tool contribution axis in core — reproducing the #1093 failure at birth. The honest answer to "first plugin evidence": this is not the case that tests the contribution model; forcing it would be ceremony. A future third-party MCP-tool contribution axis is named as future work, to be designed with a registration mechanism per doctrine 07 when a second contributor exists. | Brief's direct question; `06-doctrine-fit.md §4`. |
| D9 | **Contract enrichment slice:** populate `summary` (+ `tags` where natural) on first-party contract `.route()` calls; additive, no behavior change; the projection works without it (ladder, D4) but reads like NetScript with it. | research §2.1: oRPC emits them; nothing sets them. Scope: fork F3. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Endpoint manifest exact seam + file location | **must resolve via [P1] before Wave-1 discovery slices** (S-7 upgraded this from safe-to-defer: the rev-1 seam is provably wrong, not merely unverified) | options analyzed in 02-discovery.md; F1 records the recommendation |
| Execution timing | must resolve at ratification | F2 — v1-vs-v2 is an owner risk call |
| Evidence-gate strength for introspection | must resolve at ratification | F4 — gate-vs-suggest is an owner policy call (#1072 lineage) |
| Enrichment scope | safe to defer | F3 |
| Tool names bikeshed | resolved | snake_case matching existing 14; names in D2 |

## Owner forks (F#)

| # | Fork | Options | Seed recommendation |
| --- | --- | --- | --- |
| F1 | Endpoint manifest mechanism | (a) generated Aspire helpers write a run-state endpoints file (b) MCP shells out to `aspire` CLI to query resources (c) host the MCP inside the AppHost as an Aspire resource with HTTP transport | **(a)** — offline, no transport work, no version coupling to aspire CLI output; (b) is fallback if the helper seam proof fails; (c) rejected: chicken-and-egg on ports, new transport, agent-host config churn |
| F2 | Execution timing | (a) introspection v1, execution v2 behind opt-in (b) GET-only `invoke_service_operation` already in v1 | **(a)** — ship the risk-free 80% now; (b) only if the owner wants one-release delivery, and then still deny-by-default with GET/HEAD-only |
| F3 | Contract enrichment scope | (a) all first-party contracts in one slice (b) only services touched by the examples, rest incremental | **(a)** — mechanical, additive, reviewable in one pass; the surface is small (auth 5 routes, workers/sagas/triggers/streams each a handful) |
| F4 | Activation strength | (a) introspection receipts *accepted* as evidence alongside doctor/otel (b) endpoint-shape claims in drift entries *require* an introspection receipt (c) instructions-only | **(a) now, (b) once the tools have one wave of field use** — (b) immediately risks gating on an unproven surface, the exact #1072 trap in reverse. **True costs (S-15/S-16):** (a) requires the receipt-after-validation fix first; (b) is new machinery — per-evidence-class receipt keys (resource, evidenceKind, operation), not configuration on the current single-receipt store |
| F5 | Milestone/labels for the RFC PR | per precedent | `rfc` + `type:docs` + `status:plan` + `priority:p1` + `area:tooling` + `area:service` + `ci:skip-e2e` + `ci:skip-scaffold`; PR in Backlog / Triage; work milestoned 0.0.5 per #1117 |

## Phasing (proposed for the implementing run — this run implements nothing)

**Wave 0 — proofs before contracts freeze, each with a committed positive artifact (S-17):**
every proof writes `proofs/P<n>-verdict.md` into the implementing run's dir — measured result +
explicit PASS/FAIL verdict — and **the first dependent Wave-1 slice carries a hard prerequisite
that fails when its proof artifact is missing, stale, or negative** (a skipped proof cannot be
distinguished from a passed one otherwise; the orchestrator's absence-of-red lesson).

- P1 endpoint-manifest seam: demonstrate a generated run-mode **post-allocation** callback
  resolving host-perspective URLs (the helper body provably runs pre-allocation, S-7); FAIL ⇒
  F1(b) activates. Artifact gates OMB-5/OMB-7.
- P2 spec-fidelity + size dry-run against a real scaffolded app (operationIds, schema sizes vs
  truncation budget, error-envelope presence incl. the no-database template, S-19); artifact
  gates OMB-4/OMB-6 and feeds the S-5 validator subset.
- P3 auth-guarded spec fixture; artifact gates the failure-envelope wording in OMB-6.

**Wave 1 — introspection spine:** projection domain module + `ServiceEndpointDirectoryPort`
(source outcomes, precedence, conflicts) + manifest/appsettings/override adapters + three read
tools + registry/contract wiring + unit and fixture tests. **Includes the named
existing-machinery slices (S-13/S-15):** central-truncation metadata recomputation + whole-result
byte bound, and receipt-commit-after-validation. **Wave 2 — activation + enrichment:**
instructions string, AGENTS.md template line, the S-18 existing-project migration path
(`agent init` re-run fixture from prior-release host files), receipt acceptance (F4a, post
S-15), contract `summary`/`tags` slice, docs page. **Wave 3 (gated on owner F2):** execution
tool + endpoint policy (S-1 carrier + fixtures, S-2 canonicalization, S-5 validator) + receipts;
observational follow-up in #1090.

Gates: `packages/mcp` **Archetype-2** column in full (S-20) + `deno task quality:scan` +
`arch:check`; scaffold-touching slices (helpers template) additionally `scaffold.runtime` at
merge-readiness; no new lint-ignores.

## Risk register

| Risk | Exposure | Mitigation |
| --- | --- | --- |
| Helper seam cannot see resolved endpoints | discovery design | P1 proof first; F1(b) `aspire` CLI fallback named |
| Spec bodies exceed truncation budget | tool usefulness | `get_operation_schema` returns *views* (request / response / errors selectable), not whole specs; P2 measures real sizes |
| Introspection tools also go uncalled (wave-four repeat) | activation | D7 is multi-surface by design; F4 escalation path to a hard gate |
| Enrichment drifts (new contracts omit summaries) | description quality | doc-lint/review rule recorded as debt candidate in 06-doctrine-fit.md |
| Execution shipped carelessly later | security | the v2 design is written now with its policy vocabulary; implementing it without the policy is a review-blocking finding |

## Debt candidates

See `design/canonical/06-doctrine-fit.md §5`.
