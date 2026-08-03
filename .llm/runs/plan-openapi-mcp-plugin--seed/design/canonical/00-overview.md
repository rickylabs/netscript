# OpenAPI→MCP — Overview (canonical design, rev 2)

> **Draft — design document only. No GitHub mutations, no product code.** Produced by
> `plan-openapi-mcp-plugin--seed`. Rev 2: the Codex GPT-5.6 Sol xhigh adversarial pass is
> integrated (25/25 findings accepted — `../../adversarial-sol.md`, dispositions in
> `../../adversarial-triage.md`); pending owner ratification. Mechanisms marked [P1]–[P3] are
> Wave-0 proof gates with **committed verdict artifacts** (`../../plan.md`, S-17) —
> verified-API-unproven-behavior is stated as such, and [P1] now *arbitrates* the discovery
> producer rather than confirming it (S-7).

## The one-paragraph story

Every scaffolded NetScript service already publishes a live, per-request-generated OpenAPI 3.1
document at `/api/openapi.json` (`packages/service/src/presets/define-service.ts:227-228`;
`service-builder-impl.ts:466-472`), and every agent working on a scaffolded app already has the
NetScript MCP server connected (`agent init` writes `.mcp.json` —
`init-agent.ts:127-172`). This design connects the two: **three new read tools on the existing
MCP server** — `list_api_services`, `list_service_operations`, `get_operation_schema` — backed by
a small in-house projection over the spec and a discovery lane that bridges Aspire's dynamic
ports to the out-of-tree MCP process. An agent that is about to `curl` a service blind can
instead ask, in one call, "what operations does `publisher` expose, and what exactly does
`publisher.publish` accept and return?" — and the answer reads like the NetScript contract it
came from, because oRPC already names every operation by its dotted contract path
(`@orpc/openapi` `openapi.BwdtJjDu.mjs:535-549`, verified). Execution of endpoints through MCP is
designed (04) but deliberately deferred and gated. Nothing new is installed, hosted, or
networked; no new package exists — this is a core extension of `packages/mcp`, and
`06-doctrine-fit.md` argues why the plugin shape was evaluated and rejected.

## Why now (the measured failure)

Wave four, three frontier agents, one scaffolded product each: all three debugged their services
with blind `curl`; one lost ~25 minutes to a publish endpoint that hung with no error (#1064) and
wrote afterwards that the Scalar docs "would have explained instantly" the RPC envelope it was
guessing at. The docs MCP was called **zero times** across all three runs (#1072). The routes are
documented (`docs/site/services-sdk/how-to/expose-openapi-scalar.md`) — this is an **activation
gap**, the #1071/#1072 shape: capability exists, documented, absent at the moment of need. So the
design treats "where does the agent encounter this?" (05-activation.md) as a first-class section,
not an afterthought.

## Design principles (locked)

1. **The moment of need is the spec.** Every design choice is scored against one scenario: an
   agent mid-debug, about to hand-roll `curl`. Three calls or fewer from "which services exist"
   to "the exact request/response schema of the failing endpoint", with output that fits the
   registry's truncation budget.
2. **Convention in core, and the residue is a named internal axis.** The projection — operation
   identity, naming, description ladder, schema views, filtering vocabulary — is
   convention-bearing and lives in `packages/mcp` domain (thinness law, ARCHETYPE-5). The
   residue a plugin could own (opt-in, discovery, policy) sits on one **named** axis —
   `EndpointSource` (S-21) — whose variants are all first-party adapters of one core port; no
   external provider exists, so core retains them, and a first external endpoint provider is
   the recorded trigger to re-ask the plugin question. **Extend core; no plugin** (06 §1–2).
3. **Meta-tools, not a tool per operation.** The registry is a closed enum with static schemas
   and central truncation (`tool-registry.ts`, `mcp-server.ts:105-112`) — that constraint is
   load-bearing, not an obstacle: prior-art consensus (Stainless, ivo-toby, Apideck) is that
   per-operation tools blow context beyond ~50–100 operations, and the proven alternative is
   exactly the list / get-schema / invoke triad (research.md §3).
4. **Build the projection, borrow the shapes.** The spec producer is in-repo (oRPC, internal
   refs, dotted operationIds, Zod `.describe()` descriptions), so the compat problem upstream
   libraries solve does not exist here. We write ~200–400 lines of pure projection and credit the
   borrowed shapes (ivo-toby triad, nihal1294 description ladder, awslabs "Returns:" enrichment).
   No runtime dependency; licenses verified anyway (research.md §3).
5. **Read first, execute later, never by surprise.** v1 tools are pure introspection. The
   execution tool is fully designed (04) with a deny-by-default policy vocabulary mirroring
   `command-policy.ts`, and ships only on explicit owner opt-in (fork F2).
6. **Live over cached.** The spec is generated per-request from the running router
   (`openapi.ts:74-93`) — the tools fetch at use time and can never serve a stale contract.
   Liveness failures degrade to actionable structured errors ("configured but not running; start
   the AppHost"), not silence.

## Architecture at a glance

```
Aspire AppHost (running)
  generated run-mode post-allocation callback [P1-arbitrated, S-7 — the helper *body* runs
    before allocation; fallback: aspire-cli query adapter]
    └─ [NEW] writes .netscript/run/endpoints.json
         { projectRoot, runId,                                  ← identity binding (S-8)
           "publisher": { "http": "http://127.0.0.1:61432" }, … }

agent host (Claude Code / VS Code)
  spawns: netscript agent mcp --project-root <root>    ← already configured by agent init
    packages/mcp
      domain/    [NEW] openapi projection (operation index, schema views, description ladder)
                 [NEW] ServiceEndpointDirectoryPort
      application/flows/  [NEW] list-api-services · list-service-operations · get-operation-schema
      infrastructure/     [NEW] run-manifest + appsettings endpoint directory adapters,
                                fetch-spec adapter (localhost only)
      tool-registry: 14 → 17 tools (read×3); v2 [gated]: invoke_service_operation (mutate)

agent, mid-debug:
  list_service_operations {service:"publisher"}
    → publisher.publish   POST /api/publisher/publish   "Publish a document …"
  get_operation_schema {service:"publisher", operation:"publisher.publish", view:"request"}
    → the exact JSON Schema, Zod descriptions included
```

## Document map

| Doc | Contents |
| --- | --- |
| `01-tool-surface.md` | The three tools: names, kinds, input/output JSON Schema, truncation posture |
| `02-discovery.md` | The dynamic-port problem; endpoint manifest design; fallbacks; staleness |
| `03-projection-and-naming.md` | Spec→index projection; identity; description ladder; before/after |
| `04-execution-and-security.md` | The deferred `invoke_service_operation`; policy vocabulary; threat model |
| `05-activation.md` | Where the agent meets this; #1071/#1072 wiring; gate escalation path |
| `06-doctrine-fit.md` | Plugin-vs-core verdict; ARCHETYPE-5 AP/F checklist by name; #1093; debt |
| `../examples/*.md` | Two worked end-to-end stories |

## Out of scope (and where it lives)

- Docs-MCP retrieval quality — #1102's lane; these tools serve *service* legibility, not docs.
- #1093's discovery-hardcoding fix — independent; this design's stance in 06 §4.
- MCP HTTP transport, hosted bridges, third-party spec sources — rejected in #1117 and here.
- A third-party MCP-tool contribution axis — named future work (06 §4), designed only when a
  second contributor exists.
