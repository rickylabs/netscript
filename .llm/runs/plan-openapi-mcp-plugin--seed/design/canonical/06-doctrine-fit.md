# Doctrine Fit — the plugin question, archetypes, gates, debt (canonical design, rev 2)

> Draft — design document only. Rev 2 integrates Sol stage-2 findings S-20 (archetype
> reclassification) and S-21 (the residue argument re-based on a named axis). This is the
> section the brief centers: the plugin-versus-core ruling with doctrine citations, ARCHETYPE-5
> anti-patterns and fitness functions **by name**, and a straight answer on #1093.

## 1. The verdict: extend core; no plugin

The owner asked whether this should be a NetScript plugin. Under the ARCHETYPE-5 thinness law
(`ARCHETYPE-5-plugin.md:3-10`) the question decomposes into the archetype's own three-part test:

**(i) What is the convention, and does it belong in core?** The projection — operation identity
(dotted contract paths), the description ladder, schema views, filtering vocabulary, failure
envelopes — is exactly a "schema/runtime convention… agent-facing vocabulary": convention-bearing
by the law's own enumeration, therefore `@netscript/*` core. Its natural home is `packages/mcp`,
which already owns the agent-facing tool vocabulary (14 tools, closed registry,
`tool-registry.ts`), the receipts convention, and the truncation contract. Putting the
projection anywhere else would make a second home for MCP tool conventions.

**(ii) What is left for a plugin to wire?** Candidates from the brief: per-service opt-in
(the validated `.netscript/agent-mcp.json` carrier, 04), spec-URL discovery (a port + adapters
reading artifacts the scaffold already owns, 02), Aspire resource registration (**rejected on
its merits** in 02 — option (c) — not deferred to a plugin), execution policy (04). Each is
composition of *core things into core's own composition root* (`run-agent-mcp.ts:22`), not the
binding of a core convention to an external provider.

**The S-21 correction — argue the axis, not "no variance."** Rev 1 claimed "one discovery
mechanism, no provider variance"; the reviewer rightly pointed out that 02 itself defines four
endpoint-source variants (`run-manifest` / `appsettings` / `override` / `aspire-cli`) with
materially different availability and failure semantics, and doctrine 07's axis table already
names runtime kind (`aspire`, `bare-deno`, `ci-runner`). That claim is withdrawn. The axis is
now **named** per doctrine 07 (`:101-112`): typed identifier `EndpointSource`, adapters mapped
by a factory at the composition edge, contract in `ServiceEndpointDirectoryPort` (02 §port).
The verdict is then re-argued *on* the axis: every variant is a **first-party adapter of one
core-owned port**, distinguished by where endpoint facts are read from — none binds NetScript
to an external vendor or product, which is what the `auth-core` + adapters split exists for
(three real vendor backends behind one port). A named internal axis with first-party variants
is the normal shape of a core package's infrastructure layer, not a plugin boundary. **The
honest trigger that would reopen the plugin question is an external endpoint provider** — e.g.
a third-party orchestrator publishing endpoints — at which point the named axis is exactly the
seam a thin adapter (or plugin) would implement. Until then, core retains all variants.

**(iii) Is the split worth two packages?** A `plugins/openapi-mcp` would either (a) own the
projection — a **fat plugin owning what core should own**, the profile's first named
anti-pattern and its "false-done" case (`ARCHETYPE-5-plugin.md:84-88,105-111`); or (b) be a
shell re-exporting core and holding one config file — a package whose entire content is what
AP-22 (useless re-export barrel) and AP-9 (premature abstraction) describe, with JSR publish
surface, verify-plugin, and gate costs attached. It would also need a **new contribution axis**
(plugins contribute services/jobs/streams/schemas today — `plugin-contributions.ts`; there is no
"MCP tools" axis), meaning core must first grow the axis the plugin would use — at which point
core owns the convention anyway and the plugin owns nothing. The archetype names this outcome
explicitly: *"a plugin that 'owns' a contribution axis is a smell, not the target"* — and the
brief blesses the alternative: a well-argued "extend core, no plugin" is a valid outcome. That
is the ruling.

**Future seam, named honestly:** if a third-party plugin one day wants to contribute *its own*
MCP tools, that is a real contribution axis to design — with a registration mechanism,
deterministic order, and duplicate rejection per doctrine 07 (`:135-153`) — when a second
contributor exists. This design neither builds nor forecloses it: the registry accepts tool
definitions at composition (`createMcpServer(options)`), which is precisely the seam such an
axis would feed.

## 2. Package/change map with archetypes

| Surface | Change | Archetype | Gates |
| --- | --- | --- | --- |
| `packages/mcp` | projection domain module, 2 ports, 3 read flows (+1 gated mutate flow later), infrastructure adapters, registry/contract entries | **ARCHETYPE-2 (integration — S-20 reclassification)**: the additions are bounded request flows behind ports/adapters over HTTP + filesystem, not a long-running lifecycle/supervisor/state machine, which is Archetype 3's subject; Archetype 2 is the profile that names exactly this shape | the **full** ARCHETYPE-2 column of `gates/archetype-gate-matrix.md` — no hand-picked subset (rev 1's "F-13 does not apply" waiver is retracted; applicability comes from the matrix, not this doc); plus `quality:scan`, `arch:check` |
| `packages/cli` | Aspire helpers template emits the endpoint manifest [P1]; `agent mcp` composition injects the new adapters; `agent init`/scaffold template AGENTS.md line | ARCHETYPE-6 (CLI/tooling — existing) | static; `scaffold.runtime` at merge-readiness for template slices |
| `packages/contracts` + first-party `*-core` contracts | additive `.route({ summary, tags })` enrichment (D9) | ARCHETYPE-1/2 (existing contract packages) | static; doc-lint; publish dry-run |
| `plugins/*` | **no changes** | — | — |

## 3. ARCHETYPE-5 anti-patterns and fitness functions, by name

The archetype's watch-list, applied to the design even though the outcome is not a plugin —
because the reviewer will (and should) test the core extension against the same failure modes:

- **AP-1 (monolithic file):** projection, ladder, views, and directory are separate domain
  modules; flows stay one-file-per-tool (house shape). No new file should approach the F-1 lint.
- **AP-3 (god interface):** `ServiceEndpointDirectoryPort` has one method; `ServiceSpecPort`
  fetches one document. No `OpenApiManager`.
- **AP-8 (premature DI container) / AP-9 (premature abstraction):** two ports, constructor
  injection, `createX()` composition per doctrine 07 (`:18-39`); no container, no
  registry-of-projections, no pluggable naming strategies — the ladder is a function.
- **AP-10 (defensive try/catch in handlers):** failure envelopes (01) are returned values from
  the flows' explicit error mapping, not blanket catches.
- **AP-11 (hidden globals / load-time side effects):** the manifest path and overrides arrive
  via options; no module-load reads; the fetch adapter is injected. (Doctrine 07 `:174-181`
  env-var rule: env reading stays on the CLI composition edge, `cli.ts:70-79` precedent.)
- **AP-14 (re-exporting upstream) / F-15:** nothing re-exports `@orpc/openapi`; the MCP consumes
  spec *documents* over HTTP, keeping zero dependency on the producer library.
- **AP-16 (generic folders) / F-11 / F-16:** new files land in the existing
  domain/application/infrastructure taxonomy; no `utils/`.
- **AP-19 (permissions assumed silently) / F-9:** the spec fetch means the MCP process needs
  net-to-loopback; the CLI spawn already grants `-A` (`init-agent.ts`), but the design records
  the loopback-only posture (02) so a future permission-tightening pass has the written intent.
- **AP-23 (inline bodies in composition) / AP-24 (switch-over-kind):** flow map entries reference
  flow functions (`cli.ts:114-172` precedent); views dispatch via a typed record, not switch
  accretion.
- **AP-25 (side effects in non-edge files):** `fetch` lives only in the infrastructure adapter;
  domain projection is pure and fixture-tested.
- **Fitness columns (S-20):** the governing set is the **complete ARCHETYPE-2 column** of
  `gates/archetype-gate-matrix.md` — this document no longer enumerates a subset, because a
  hand-picked list is exactly how a required gate gets silently waived. Illustrative mapping
  (not the authority): F-1 (file size), F-3 (layering: domain imports nothing from
  infrastructure), F-5 (public surface audit — `packages/mcp` exports stay `.` and `./cli`),
  F-10 (per-rung ladder fixtures, port fakes, the S-1 fail-closed fixture set, the S-5
  validator corpus), F-19 (scoped gate runners as the verdict source).

## 4. #1093 — the straight answer

**Does it block this design? No.** #1093 is about core *hardcoding plugin identities*
(`ast-extractor.ts:6-7` callee→axis table; `plugin-import-rewriter.ts:188-193`;
`workspace-mutator.ts:267-294`). This design adds no plugin and touches no discovery table. Its
own discovery is **data-driven by construction**: the service list comes from
`aspire/appsettings.json` and the run manifest — artifacts the app generates about itself — and
the projection reads whatever spec a service serves. No new code branches on a service or plugin
name; the #1093 acceptance guard ("a doctrine check fails if a core package gains a branch on a
specific plugin name") would pass over this design unchanged.

**Does the design worsen it? The plugin shape would have.** An `openapi-mcp` plugin would have
required core to recognize one more specific plugin (no MCP-tools axis exists), reproducing the
#1093 failure at birth. Choosing core extension is partly *because* of #1093's lesson.

**The "first plugin outside workers/sagas/streams/triggers" evidence question:** answered
honestly — this is the wrong test case for the contribution model, because nothing here varies
by provider and nothing needs an axis. Forcing the plugin shape to generate evidence would
manufacture ceremony, not evidence. The genuine first test remains a capability with real
variance (the deploy family, #891) or a true third-party factory (#1093's own fixture).

## 5. Debt candidates (recorded on implementation, not filed now)

| Candidate | Why deferred |
| --- | --- |
| Contract `summary` presence lint (new routes without summaries drift the ladder back to rung 4) | needs a lint/doc-score hook; v1 is review + the D9 slice |
| Loopback enforcement depth (URL-parse vs socket-level) | adversarial question 04 §6(a); v1 documents the parse-level check and its limits |
| MCP-tool contribution axis for third-party plugins | §1 future seam — design only on a second contributor |
| Endpoint manifest teardown integration with `agentic:leak-check`/`teardown` ownership proofs | run-state file ownership semantics belong to the resource-hygiene tooling wave |
| `getAllServices()` doc note ("returns [] outside Aspire-launched processes") | one-line doc fix in `packages/sdk`; bundled with the implementing wave, not worth its own slice |

## 6. Precedence honored (reused, not invented)

| Reused | Source |
| --- | --- |
| Closed tool registry, kinds, summaries, truncation | `packages/mcp/src/application/tool-registry.ts`, `runner/mcp-server.ts` |
| Ports + injected adapters + CLI composition edge | `packages/mcp/src/domain/*-port.ts`, `run-agent-mcp.ts` |
| Receipts / evidence gate | `withReceipt` (`packages/mcp/cli.ts:175`), #1078 |
| Policy-checked mutate flows | `domain/command-policy.ts`, `execute_command` |
| Generated-artifact idempotency | `generate-runtime-schemas.ts:107-176` |
| appsettings as the service source of truth | `generate-appsettings.ts:341-370`, helpers pipeline |
| Meta-tool triad / ladder / enrichment shapes | ivo-toby, nihal1294, awslabs (research.md §3, licenses verified) |
