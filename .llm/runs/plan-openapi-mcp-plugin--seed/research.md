# Research — plan-openapi-mcp-plugin--seed

Stage-B corpus for the OpenAPI→MCP design. Discovery ran as a 3-way fan-out (GitHub issue/RFC
corpus · upstream prior-art code reading · local mechanism exploration) plus generator-session
verification of every load-bearing claim. Claims verified directly in this session are marked ✔;
sub-agent findings used load-bearing are cited with the file:line the sub-agent reported and were
spot-checked where marked.

## Re-baseline

- Carried-in source: issue #1117 body (owner-evolved through 2026-08-03) + generator brief.
- Re-derived against `main` @ `a8a129feb` (2026-08-03). The brief's two anchor citations verified
  unchanged (✔ below). No competing RFC or code exists: `grep -i openapi packages/mcp` returns
  zero hits; the only `mcp` hits under `packages/service` are inside the minified
  `scalar.generated.ts` bundle. **OpenAPI and MCP never co-occur in this repo — the seam is
  genuinely new.**

## 1. The measured problem (from #1117, #1072, #1071)

- Wave four: three frontier agents (Fable 5, Grok 4.5, DeepSeek V4 Flash) each built a product on
  scaffolded services; **all three debugged with blind `curl`**; one lost ~25 min to a publish
  endpoint that hung silently (#1064) and wrote: *"the free Scalar docs I never opened even while
  debugging the RPC envelope they would have explained instantly."*
- The docs MCP was called **zero times across all three runs** (#1072 owner comment). #1072's
  verdict: installed-but-never-loaded surface is indistinguishable from absent surface; the fix
  that shipped (#1078) is a **gate, not a suggestion** — a drift entry requires a doctor/otel
  receipt, with one refusal string shared verbatim by CLI and MCP paths.
- #1071's verdict: signal dilution — the scaffold's first commit is 14,398 lines with nothing
  naming the five canonical files; the app-scoped `AGENTS.md`/`WEB-LAYER.md` that shipped names
  behaviours, not just examples.
- Consequence for this design: **activation is a first-class requirement**, and the shipped
  precedent is (a) put the capability where the agent already is, (b) name it at the moment of
  need, (c) gate evidence on it where a gate exists.

## 2. What already exists (local mechanisms, verified)

### 2.1 Every service serves a live spec

- ✔ `packages/service/src/presets/define-service.ts:227-228` — the standard preset chains
  `.withOpenAPI(options.openapi).withDocs()`; `defineService` at `:216`.
- Routes mounted in `installDeferredRoutes()`: `/api/openapi.json` at
  `packages/service/src/builder/service-builder-impl.ts:466-472`, `/api/docs` (Scalar) at
  `:479-484`. The startup banner advertises both (`service-listener.ts:226-227`).
- Generator is **oRPC**: `packages/service/src/primitives/openapi.ts:20-21` imports
  `OpenAPIGenerator` from `@orpc/openapi` and `ZodToJsonSchemaConverter` from `@orpc/zod/zod4`;
  the spec is generated **per-request from the live router** (`createOpenAPISpec`, `:74-93`) — it
  can never be stale. `servers` defaults to `[{ url: '/api' }]` (`:26`).
- ✔ **Spec fidelity (decisive):** `@orpc/openapi@1.14.13`
  `dist/shared/openapi.BwdtJjDu.mjs:535-549` — `operationId: def.route.operationId ?? stringPath`
  where `stringPath = path.join('.')`, i.e. **every operation's operationId defaults to the
  dotted contract procedure path** (`publisher.publish`); `summary`, `description`, `tags`,
  `deprecated` pass through from `.route()`. NetScript-native operation identity is already in
  every generated spec.
- **But no first-party contract populates route metadata today**: every `.route()` call found
  passes only `{ method, path }` (e.g. `packages/plugin-auth-core/src/contracts/v1/
  auth.contract.ts:437-457`). Zod `.describe()` descriptions DO flow — the helpers in
  `packages/contracts/src/application/zod-helpers.ts:44-101` all apply `.describe()`, and the
  converter carries them into JSON Schema. So schemas are self-describing; operations are not
  (yet) — `summary`/`tags` enrichment is a cheap, additive prerequisite.

### 2.2 The MCP server (`packages/mcp`)

- Composition roots: generic `createMcpServer(options)` at
  `packages/mcp/src/application/runner/mcp-server.ts:40` (JSON-RPC `initialize`/`tools/list`/
  `tools/call`; input validated `:88`, output validated `:105`, **centrally truncated** `:112`;
  agent instructions string at `:13`); batteries-included `createMcpCliServer` at
  `packages/mcp/cli.ts:95` with per-flow map `:114-172` and `withReceipt` (`:175`) writing the
  diagnostic receipts that gate `record_drift` (#1072's gate).
- Tool surface: **14 tools, closed enum** — `TOOL_NAMES` at
  `packages/mcp/src/domain/tool-types.ts:4-19`; kinds `read`/`meta`/`mutate` at
  `tool-registry.ts:11-26`. Input/output schemas are **hand-written JSON Schema** (not Zod) in
  `src/domain/tool-contracts.ts`, all `additionalProperties: false`, wrapped as Standard-Schema.
- Transport: **stdio only** (`src/infrastructure/stdio-transport.ts`); the server core is a pure
  `handle(message) => JsonRpcResponse` object (`mcp-server.ts:32-37`).
- Deployment: `netscript agent init` writes `.mcp.json`/`.vscode/mcp.json` spawning
  `deno run -A jsr:@netscript/cli agent mcp --project-root <root>`
  (`packages/cli/src/public/features/agent/init/init-agent.ts:127-172`) — **the MCP server runs
  beside the project, spawned by the agent host, not under Aspire**.
- Layering: clean domain/application/infrastructure split with ports
  (`command-catalog-port.ts`, `docs-corpus-port.ts`, `telemetry-probe-port.ts`, …); exec policy
  precedent in `domain/command-policy.ts`; outer composition injects adapters
  (`packages/cli/src/public/features/agent/mcp/run-agent-mcp.ts:22`).

### 2.3 Service discovery and the dynamic-port problem

- Aspire injects `services__<name>__<protocol>__<index>` env vars into **service processes**
  (`packages/sdk/src/discovery/service-url.ts:55-61`); ✔ `getServiceUrl` at `:97-129`;
  `getAllServices()` at `:162-176` scans `Deno.env.toObject()` for the prefix.
- **The gap:** those env vars exist only in processes Aspire started with references. The MCP
  server is spawned by the agent host (§2.2), so `getAllServices()`/`getServiceUrl()` return
  nothing there. Discovery needs a designed lane, not just the existing helper.
- The static service **list** (not ports) lives in `aspire/appsettings.json`
  (`NetScript.Services`), generated at
  `packages/cli/src/kernel/templates/aspire/generate-appsettings.ts:341-370`, parsed by
  `parseAppSettings()` from `@netscript/aspire/config`, and consumed by the generated Aspire
  helpers (`helpers-generator-pipeline.ts:68,92` → `.helpers/register-services.mts`,
  `generate-register-services.ts:40-144`) — which wire cross-service refs via
  `getEndpoint('http')` + `withEnvironment()` (the origin of the `services__*` vars).

### 2.4 Plugin machinery and #1093

- First-party plugin shape (`plugins/workers`): top-level contribution folders + `mod.ts` +
  `verify-plugin.ts` + `scaffold.plugin.json`; manifest via `definePlugin` fluent axes
  (`plugins/workers/src/public/mod.ts:54-140`). Hosts list plugins as module specifiers in
  `netscript.config.ts` (`packages/config/src/domain/schemas/netscript-config-schema.ts:158-159`);
  contributions merge generically (`load-plugin-contributions.ts:5-12`).
- #1093 (open, 0.0.5, p2): core hardcodes official plugins — the callee→axis table at
  `packages/plugin/src/sdk/discovery/ast-extractor.ts:6-7` (`defineSaga`→sagas,
  `defineWebhook`→triggers); additionally `OFFICIAL_PLUGIN_DIRS` at
  `packages/cli/src/maintainer/adapters/plugin-import-rewriter.ts:188-193` and
  `OFFICIAL_PLUGIN_RUNTIME_LOCAL_PATHS` at
  `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts:267-294` (already drifting —
  omits streams/auth/ai). Acceptance demands: no core edit to add a plugin's discovery; a
  third-party fixture discovered end-to-end; a guard that fails when core branches on a plugin
  name.
- `auth-core` reference shape: `packages/plugin-auth-core` (contracts/ports/domain only,
  `deno.json:6-16`) + thin vendor adapter packages (`auth-better-auth`, `auth-kv-oauth`,
  `auth-workos`, single `"."` export each) + `plugins/auth` as composition host. The split earns
  itself because the **provider axis genuinely varies** (three backends behind one port).

## 3. Prior art (upstream code read, not READMEs)

| Project | License (verified) | Mode | What we take |
| --- | --- | --- | --- |
| `harsha-iiiv/openapi-mcp-generator` v4.0.1 (629★) | MIT | one tool per op; `getToolsFromOpenApi()` introspection-only library | deterministic hash-suffixed collision naming; `x-mcp` include/exclude precedence; proof that projection-as-library (no server) is viable |
| `ivo-toby/mcp-openapi-server` (283★) | MIT | tri-modal `all`/`dynamic`/`explicit`; **dynamic = 3 meta-tools** `list-api-endpoints` / `get-api-endpoint-schema` / `invoke-api-endpoint` | the meta-tool triad shape; `excludeTags` enforced even in dynamic mode; 64-char abbreviation pipeline (not needed for meta-tools); `extraTools` coexistence |
| `awslabs/mcp` openapi-mcp-server (9.5k★ monorepo) | Apache-2.0 | FastMCP-delegated, executes | description enrichment (`Returns: <codes>` + example); DNS-pinned SSRF-safe spec loader; `--allow-private-networks` gating idea |
| `nihal1294/openapi-to-mcp` | Apache-2.0 | generator | the **description ladder**: summary → first sentence of description → humanized operationId → synthesized verb+resource from method+path |
| `beshkenadze/openapi-mcp-generator` | **no LICENSE file** (GitHub license: null) | generator | cautionary only — do not source |
| `EvilFreelancer/openapi-to-mcp` | MIT | runtime proxy | HTML→Markdown description scrubbing; server-level `instructions` composed from `info.description` |

- Tool-count consensus (Stainless blog, ivo-toby README, Apideck 229-tools writeup): one tool per
  operation is right below ~50–100 operations; beyond that either curation or the
  list/get-schema/invoke triad; the strongest designs ship both plus allowlists, with deny
  filters enforced in dynamic mode too.
- **Sourcing verdict grounded in §2.1:** the general OpenAPI-compat problem these projects solve
  (external `$ref`s, allOf soup, HTML descriptions, missing operationIds, collision naming)
  **largely does not exist for us — the spec producer is in-repo** (oRPC, internal refs, dotted
  operationIds, Zod descriptions). What remains is a small, spec-shape-known projection we can
  write in ~200–400 lines against our own generator. Vendor nothing at runtime; credit the
  designs we borrow shapes from. (All candidate licenses are MIT/Apache-2.0 except beshkenadze,
  which is unlicensed and untouchable anyway.)

## 4. RFC precedent shape (PRs #890, #891, #822)

- PR body **is** the RFC (`rfc.md` in the run dir); metadata table (Status / Tracking /
  Run record / Evidence base); Abstract with a UX code fence; Motivation table; numbered locked
  decisions with adversarial finding IDs; implementation-level API section; waves + gates; board
  as **placeholders, not filed** (#891 variant — filing is a later supervisor-coordinated step);
  migration/supersession map; security summary; review trail; **open forks table** with seed
  recommendations; `<sub>Provenance</sub>` footer with the authority rule and "no closing
  keywords".
- Labels for the eventual PR: `rfc` + `type:docs` + `status:plan` + `priority:p1` + `area:*`
  (`area:tooling`, `area:service`) + `ci:skip-e2e`/`ci:skip-scaffold`; RFC PRs sit in
  `Backlog / Triage` while #1117 itself is milestoned 0.0.5.
- #1117 status section fixes this run's pipeline: Fable 5 medium generator → Codex GPT-5.6 Sol
  xhigh adversarial (findings only, generator integrates) → RFC PR for owner ratification; no
  implementation before ratification.

## jsr-audit surface scan

N/A — design-only run; no package surface changes. The design section records the future public
surface (`@netscript/mcp` additions) for the implementing run to audit.

## Open questions carried into plan.md

1. Exact seam by which the generated Aspire helpers can observe **resolved** endpoint URLs and
   publish them for the out-of-tree MCP process (Aspire lifecycle event vs `getEndpoint()` at
   registration time vs C# `AfterEndpointsAllocated`). Mechanism options analyzed in
   `design/canonical/02-discovery.md`; verification is a Wave-0 proof.
2. Whether `/api/openapi.json` can end up behind user-configured authz matchers (rules are
   arbitrary `match(request)` predicates — `define-service.ts:201-208` example), and what the
   introspection tool should report then.
3. Whether execution (v2) should reuse `domain/command-policy.ts` shape or a new endpoint policy
   vocabulary.
