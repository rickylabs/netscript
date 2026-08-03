# RFC — OpenAPI→MCP: making a service's own API legible to the agent building it

| | |
| --- | --- |
| **Status** | **Generator draft (rev 1)** — Codex GPT-5.6 Sol·xhigh adversarial pass pending; then owner ratification. No implementation until ratified (#1117 pipeline). |
| **Tracking** | Refs #1117 (0.0.5, tracking — no closing keyword) · #1102 (capability lane, distinct) · #1072/#1078 (gate precedent) · #1071 (conventions surface) · #1093 (addressed §5, not fixed here) |
| **Run record** | `.llm/runs/plan-openapi-mcp-plugin--seed/` — research, plan (D1–D9 / forks F1–F5), canonical design 00–06, 2 worked examples |
| **Evidence base** | Verified in-source: `.withOpenAPI().withDocs()` on every preset (`define-service.ts:227-228`), spec routes (`service-builder-impl.ts:466-484`), per-request spec generation (`openapi.ts:74-93`), `operationId` = dotted contract path (`@orpc/openapi@1.14.13` `openapi.BwdtJjDu.mjs:535-549`), closed MCP registry + central truncation (`tool-registry.ts`, `mcp-server.ts:105-112`), `.mcp.json` spawn (`init-agent.ts:127-172`), `services__*` env convention + `getAllServices()` (`service-url.ts:55-176`); prior art code-read with licenses verified (research.md §3) |

---

## Abstract

Every scaffolded NetScript service already serves a live OpenAPI 3.1 document at
`/api/openapi.json` — generated per request from the running router, so it is never stale — and
every agent working on a scaffolded app already has the NetScript MCP server connected. The two
have never met: in wave four, three frontier agents debugged their own services with blind
`curl`, one losing ~25 minutes to a silently hanging publish endpoint whose envelope the unread
Scalar docs "would have explained instantly."

This RFC connects them with **three read tools on the existing MCP server** — no new package, no
new process, no hosted anything:

```
> list_api_services {}                                   # which services, live base URLs, status
> list_service_operations { service: "publisher" }       # publisher.publish  POST /api/publisher/publish  "Publish a document…"
> get_operation_schema  { service: "publisher",          # exact request/response/error schemas,
                          operation: "publisher.publish" }  # + a paste-ready curl example
```

The operation names are the dotted contract paths agents already know, because oRPC defaults
`operationId` to exactly that. A small in-house projection (no runtime dependency) turns the
spec into bounded, NetScript-flavoured output; a designed discovery lane bridges Aspire's
dynamic ports to the out-of-tree MCP process; execution of endpoints through MCP is **fully
designed and deliberately deferred** behind a deny-by-default policy. Activation is engineered,
not hoped for, on the #1071/#1072 pattern — the tools live where the agent already is, and their
summaries name the curl moment itself.

## 1. Motivation

| Today | Consequence |
| --- | --- |
| `/api/openapi.json` + `/api/docs` on every service (`define-service.ts:227-228`), documented and cross-linked | Wave four: zero opens while debugging the exact envelope they document — an **activation** gap (#1071/#1072 shape), not a docs gap |
| `packages/mcp` ships 14 tools (`read`/`mutate`/`meta`); zero OpenAPI awareness (grep: no hits) | The agent's connected diagnostic surface cannot answer "what does this endpoint accept?" |
| Aspire assigns ports at run time; `getServiceUrl()`/`getAllServices()` read env vars that exist **only inside Aspire-launched processes** (`service-url.ts:55-176`) | The MCP server — spawned by the agent host (`init-agent.ts:127-172`) — cannot resolve any service URL today; #1117's "largely solved" holds only inside the AppHost graph |
| First-party contracts set no `summary`/`tags` on `.route()` (e.g. `auth.contract.ts:437-457`) | A generic OpenAPI→MCP generator would emit a nameless REST dump; the metadata seam exists (oRPC emits it) but is unpopulated |

Measured cost: three agents × blind curl; ~25 minutes on one silent hang (#1064); docs-MCP calls
across all three runs: **zero** (#1072).

## 2. The proposed decision and its rationale

**Decisions D1–D9, locked at generator level** (full text `plan.md`, mechanisms 00–06):

1. **Extend `packages/mcp` core; no plugin, no new package (D1).** The projection — operation
   identity, description ladder, schema views, failure envelopes — is convention-bearing
   agent-facing vocabulary: core, by the ARCHETYPE-5 thinness law. What a plugin could wire has
   **no provider variance** (one MCP server, one in-repo spec producer, one discovery
   mechanism); doctrine 07: "If you cannot name the axis cleanly, do not abstract." A
   `plugins/openapi-mcp` would either own the convention (the archetype's named fat-plugin
   smell) or be an AP-22 shell — and would need an MCP-tools contribution axis core would have
   to grow first, reproducing #1093 at birth. Full AP/F-by-name argument:
   `design/canonical/06-doctrine-fit.md`.
2. **Meta-tool triad, not one-tool-per-operation (D2).** The registry is a closed enum with
   static schemas and central truncation — and prior-art consensus (Stainless; ivo-toby's
   `dynamic` mode; Apideck) is that per-operation tools blow context past ~50–100 operations.
   Three static tools; operations are *data* in results. Idle context cost: three summaries.
3. **Discovery: AppHost-published endpoint manifest (D3).** The generated Aspire helpers —
   the only party that authoritatively knows resolved ports — write
   `.netscript/run/endpoints.json` (atomic, idempotent, gitignored, localhost URLs only); the
   MCP reads it via a one-method `ServiceEndpointDirectoryPort`, falling back to the
   `aspire/appsettings.json` static list (`configured (not running)`) and an explicit override.
   Liveness is the spec fetch itself (per-request generation ⇒ success = current truth). The
   write seam is Wave-0 proof **[P1]**; the `aspire` CLI query is the named fallback behind the
   same port.
4. **Projection written in-house (D4).** Our spec producer is in-repo and deterministic —
   internal refs, dotted operationIds, Zod `.describe()` descriptions — so the compat problem
   upstream libraries solve does not exist here. ~200–400 lines of pure domain code; borrowed
   shapes credited (ivo-toby triad, nihal1294 description ladder, awslabs `Returns:`
   enrichment); zero runtime dependencies; all candidate licenses verified anyway (MIT /
   Apache-2.0; beshkenadze unlicensed and untouched).
5. **Introspection v1; execution designed now, shipped later, deny-by-default (D5).** The
   25 minutes were lost to not knowing the envelope, not to being unable to send requests —
   `get_operation_schema` ends with a paste-ready `curl` line, keeping mutations in the agent's
   visible shell. `invoke_service_operation` (mutate) is specified in `04-execution-and-
   security.md`: master switch off, safe-methods-only first rung, per-operation `allowUnsafe` +
   `confirm` echo, deny-wins, receipts, **no credentials held or forwarded, ever**; enabling is
   a human config edit the MCP cannot reach.
6. **All AppHost services by default, per-service opt-out (D6);** auth-guarded spec endpoints
   produce a structured `spec_unavailable (401)` naming the likely authz-matcher cause and the
   fix ([P3] proof).
7. **Activation is a designed surface (D7),** on the #1071/#1072 lineage: (A) zero install —
   the tools join the server `agent init` already wires into `.mcp.json`; (B) tool summaries
   name the counterfactual act ("Use instead of guessing endpoints with curl"); (C) one sentence
   in the server's `initialize` instructions; (D) one behavioural line in the scaffolded
   app-scoped `AGENTS.md`; (E) endpoint-shaped findings in `get_recent_errors`/`doctor` output
   cross-reference `get_operation_schema`; (F) introspection receipts join the #1078 evidence
   machinery — *accepted* now, *required* only after a wave of field use (fork F4).
   Observational acceptance routes to #1090, per the close-gate lesson.
8. **#1093 does not block and is not worsened (D8).** No new code branches on a plugin or
   service name — discovery reads data the app generates about itself. The "first plugin outside
   the big four" evidence question is answered honestly: this is the wrong test case (nothing
   varies), and forcing the plugin shape would manufacture ceremony, not evidence (§5).
9. **Contract enrichment (D9):** additive `summary`/`tags` on first-party `.route()` calls —
   the difference between "Publish a document and enqueue distribution." and the ladder's
   honest-but-mechanical "Invoke publish on publisher."

## 3. Tool surface (implementation-level)

Registry 14 → 17 (→18 with v2). House conventions throughout: snake_case names, hand-written
JSON Schema with `additionalProperties: false`, bounded summaries, `withReceipt` wrapping.

| Tool | Kind | Input (required) | Output essence |
| --- | --- | --- | --- |
| `list_api_services` | read | — | per-service: name, status (`running` / `configured (not running)` / `spec_unavailable`), live base/spec/docs URLs, operation count, discovery source |
| `list_service_operations` | read | `service` (+ `filter`, `limit`) | one flat row per operation: dotted id, method, path, ladder summary, tags; `truncated` flag with filter hint, never a silent cut |
| `get_operation_schema` | read | `service`, `operation` (+ `view`: `request`/`response`/`errors`/`all`) | dereferenced schema **views** with Zod descriptions intact; `Returns: <codes>`; common error envelope rendered once; paste-ready `curlExample` |
| `invoke_service_operation` (v2, fork F2) | mutate | `service`, `operation` (+ `params`, `body`, `confirm`) | policy-checked, schema-validated-before-send, bounded response + receipt; refusals teach the enabling path |

Failure envelopes are uniform and structured: `service_unknown` (with known list),
`service_not_running` (with start hint), `spec_unavailable` (with status + cause guidance),
`operation_unknown` (with three nearest ids). Two ports back the flows —
`ServiceEndpointDirectoryPort` (one method) and `ServiceSpecPort` (loopback-only fetch, size
cap, no redirects, no credentials) — constructor-injected with fakes, composed at the existing
CLI edge (`run-agent-mcp.ts:22`).

**Before/after in one line:** a generic generator loads 40+ path-munged tools
(`PostApiPublisherPublish`, empty descriptions) into every session; this design idles at three
summaries and answers with the contract's own vocabulary. Worked end-to-end in
`design/examples/silent-hang-replay.md` (the wave-four incident replayed: 25 minutes → three
calls) and `design/examples/discovery-and-policy.md` (discovery byte-by-byte, five degraded
modes, the three-rung execution opt-in as the owner experiences it).

## 4. Plan — waves and gates (for the implementing run)

**Wave 0 — proofs before contracts freeze:** **[P1]** the endpoint-manifest write seam (can the
generated helpers observe resolved endpoints? fallback: `aspire` CLI adapter, same port) ·
**[P2]** spec-fidelity + size dry-run against a real scaffolded app (operationIds, schema sizes
vs truncation budget) · **[P3]** auth-guarded spec fixture.

**Wave 1 — introspection spine:** projection domain module + ports + adapters + three read
flows + registry/contract wiring + per-rung ladder fixtures and port-fake tests.
**Wave 2 — activation + enrichment:** instructions sentence, AGENTS.md template line, receipt
acceptance (F4a), the D9 contract slice, docs cross-reference.
**Wave 3 (gated on owner F2):** execution tool + `EndpointPolicy` + receipts; observation in #1090.

Gates: `packages/mcp` Archetype-3 static gates, `deno task quality:scan`, `arch:check` on every
`packages/**` slice; `scaffold.runtime` at merge-readiness for the helpers-template slice; no
new lint-ignores. Archetype map and the full ARCHETYPE-5 AP/F checklist (argued by name even
though the outcome is core): `06-doctrine-fit.md §2–3`.

## 5. The plugin question and #1093 (the brief's central question, answered plainly)

The three-part test from ARCHETYPE-5, applied: **(i)** the projection is convention-bearing →
core, inside `packages/mcp`, which already owns the agent-facing tool vocabulary. **(ii)** the
plugin residue (opt-in, discovery wiring, policy) is composition of core things into core's own
composition root, with no provider variance anywhere — no axis to name. **(iii)** two packages
buy a fat plugin (the archetype's named smell and false-done case) or an empty shell (AP-22 /
AP-9) plus JSR/verify/gate overhead. **Verdict: extend core; no plugin** — the outcome the
archetype itself blesses when the axis isn't real.

**#1093:** not a blocker — this design adds no plugin and no name-branching; its discovery is
data-driven (appsettings + run manifest), so #1093's own acceptance guard would pass over it
unchanged. The plugin shape would have *worsened* #1093 by forcing core to recognize one more
specific plugin. And the honest answer to "first first-party plugin as contribution-model
evidence": wrong test case — nothing here varies; the genuine first test is a capability with
real variance (#891's deploy family) or #1093's own third-party fixture. A future MCP-tools
contribution axis is named as future work, designed only when a second contributor exists
(the `createMcpServer(options)` seam is where it would land).

## 6. Security model (summary)

v1 is read-only against loopback: spec fetches are loopback-only, size-capped, redirect-free,
credential-free; spec text is rendered as bounded data, never into tool definitions. The
deferred execution tool is deny-by-default with three human-edited rungs (off → GET/HEAD →
per-operation allowlist + confirm echo), schema-validates before sending, writes receipts, and
never holds credentials — authenticated invocation is explicitly out of scope rather than
half-shipped. The manifest file contains only localhost URLs and is machine-local run state.
Named residual uncertainties the adversarial pass should attack: loopback enforcement depth in
Deno fetch; whether `confirm` is friction or ceremony; header-parameter validation soundness;
whether excluding auth entirely is the right cut (`04-execution-and-security.md §6`).

## 7. Proposed board (placeholders — NOT filed; filing follows ratification)

Epic under #1117, milestone 0.0.5. Children (`[openapi-mcp S<n>] …`):

| ID | Wave | Slice |
| --- | --- | --- |
| OMB-1 | 0 | [P1] endpoint-manifest seam proof (helpers observe resolved URLs; else CLI-query fallback decision) |
| OMB-2 | 0 | [P2] spec fidelity + size dry-run against a scaffolded app |
| OMB-3 | 0 | [P3] auth-guarded spec fixture + `spec_unavailable` envelope wording |
| OMB-4 | 1 | Projection domain module (index, ladder, views) + fixtures |
| OMB-5 | 1 | `ServiceEndpointDirectoryPort` + manifest/appsettings/override adapters + staleness rules |
| OMB-6 | 1 | Three read tools: contracts, flows, registry wiring, receipts |
| OMB-7 | 1 | Helpers-template emission of the endpoint manifest (+ `scaffold.runtime` evidence) |
| OMB-8 | 2 | Activation surfaces: instructions sentence, app-scoped AGENTS.md line, failure-path cross-references |
| OMB-9 | 2 | Evidence-gate acceptance of introspection receipts (F4a) |
| OMB-10 | 2 | Contract `summary`/`tags` enrichment across first-party contracts (D9/F3) |
| OMB-11 | 2 | Docs: agent-facing cross-reference in `expose-openapi-scalar.md` + reference page |
| OMB-12 | 3 (gated F2) | `EndpointPolicy` + `invoke_service_operation` + receipts + refusal texts |
| OMB-13 | 3 | Wave-observation handoff to #1090 (tool-calls vs curl count) |

## 8. Review trail

Stage 1 (this document): generator Claude Fable 5 · medium, seed run
`plan-openapi-mcp-plugin--seed`, research via 3-way fan-out with load-bearing claims re-verified
in-session (research.md marks ✔). Stage 2: Codex GPT-5.6 Sol · xhigh adversarial pass,
findings-only; the generator integrates legitimate findings and records dispositions
(`adversarial-triage.md`, to be added). Generator ≠ reviewer sessions throughout, per the
harness invariant.

## 9. Open forks for owner arbitration

| # | Fork | Options | Seed recommendation |
| --- | --- | --- | --- |
| F1 | Endpoint manifest mechanism | (a) generated helpers write run-state file (b) `aspire` CLI query adapter (c) MCP as Aspire-hosted HTTP resource | **(a)**; (b) is the fallback behind the same port if [P1] fails; (c) rejected (no HTTP transport exists; port chicken-and-egg; `.mcp.json` churn) |
| F2 | Execution timing | (a) introspection v1, execution v2 opt-in (b) GET-only invoke already in v1 | **(a)** — the incident didn't need execution; ship the risk-free 80% |
| F3 | Enrichment scope | (a) all first-party contracts, one slice (b) incremental | **(a)** — mechanical, small surface, one review pass |
| F4 | Activation strength | (a) receipts accepted as evidence (b) receipts required for endpoint-shape drift claims (c) instructions only | **(a) now, (b) after one field wave** — gating on an unproven surface is the #1072 trap inverted |
| F5 | RFC PR labels/milestone | per precedent | `rfc` `type:docs` `status:plan` `priority:p1` `area:tooling` `area:service` `ci:skip-e2e` `ci:skip-scaffold`; PR in Backlog / Triage; work milestoned 0.0.5 |

---

<sub>**Provenance.** Seed run `plan-openapi-mcp-plugin--seed` on `plan/openapi-mcp-plugin`; this
document condenses the run's normative record (`design/canonical/00–06` rev 1, `plan.md`,
`design/examples/`). Where this RFC and the run docs conflict, the run docs win until
ratification, then GitHub wins. Refs #1117 #1102 #1072 #1071 #1093 — no closing keywords; the §7
board is placeholders, filed only after owner ratification.</sub>
