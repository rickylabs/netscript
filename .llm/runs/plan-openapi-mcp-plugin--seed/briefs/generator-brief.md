use harness

# Seed design — OpenAPI→MCP: making a service's own API legible to the agent building it

You are the **generator** (Claude Fable 5, effort medium) for the seed run
`.llm/runs/plan-openapi-mcp-plugin--seed/` on branch `plan/openapi-mcp-plugin`.

Produce a **design and an RFC**, not an implementation. A stage-2 adversarial reviewer (Codex
GPT-5.6 Sol, effort **xhigh**) will attack it afterwards and you will integrate its legitimate
findings. Follow the pattern already established by the open RFCs **#890** (frontend contribution
layer), **#891** (deploy plugin family) and **#822** (single deployment) — read at least #890's
branch `plan/frontend-contrib` run record before you start, and match its shape.

## SKILL

Read, in order:

1. `.agents/skills/netscript-harness/SKILL.md` — run mechanics for a seed run.
2. `.agents/skills/netscript-doctrine/SKILL.md` and
   `docs/architecture/doctrine/07-composition-and-extension.md` — the layering and extension laws
   your design must honour.
3. `.agents/skills/netscript-cli/SKILL.md` — plugin install/scaffold surface.
4. `.agents/skills/netscript-pr/SKILL.md` — RFC PR shape, labels, tracking lines.

## The problem, and it is measured rather than assumed

Every scaffolded NetScript service already serves a machine-readable description of itself.
`packages/service/src/presets/define-service.ts:227-228` calls `.withOpenAPI().withDocs()` on the
standard preset, so **`/api/openapi.json` and `/api/docs` exist on every service by default**, and
`docs/site/services-sdk/how-to/expose-openapi-scalar.md` documents them.

We also ship an MCP server for agents: `packages/mcp`. Its entire agent-facing tool surface is
`read` / `mutate` / `meta`, and it has **zero OpenAPI awareness** — grep returns nothing.

**The two have never been connected.** In wave four, three frontier agents each built a product
against their own scaffolded services and **all three debugged those services with blind `curl`**.
One lost roughly 25 minutes to a publish endpoint that hung with no error and wrote afterwards:

> *"the free Scalar docs I never opened even while debugging the RPC envelope they would have
> explained instantly."*

This is **not** a documentation gap — the routes are documented and cross-linked. It is an
**activation** gap of the same shape as #1071/#1072: the capability exists, is documented, and is
absent at the moment of need. Design for that, not for a docs fix.

Tracking: **#1117** (0.0.5). Related: **#1102** intent-aware capability discovery · **#1072** harness
must gate not suggest · **#1071** app-scoped conventions · **#1093** core must not hardcode plugin
names.

## The central design question — and doctrine already constrains it

The owner asked whether this should be a **NetScript plugin**. Read
`.llm/harness/archetypes/ARCHETYPE-5-plugin.md` **first**, because its thinness law reframes the
question:

> *"Convention-bearing primitives — contracts, base services, schema/runtime conventions, event/kind
> vocabularies — live in `@netscript/*` **core**. A first-party `plugins/*` package is **thin
> userland glue**: it wires and composes core-owned primitives into a concrete integration… it does
> **not** redefine contracts, re-implement a core convention, or own what core should own."*
>
> *"A plugin that 'owns' a contribution axis is a smell, not the target."*

So the question is **not** "plugin or core" as a binary. It is:

1. **What is the convention here, and does it belong in core?** The projection from an OpenAPI
   document to MCP tool definitions — naming, schema mapping, filtering, the agent-facing vocabulary
   — looks like a convention-bearing primitive. On the thinness law that argues for core ownership,
   most plausibly inside or beside `packages/mcp`.
2. **What is left for a plugin to wire?** Per-service opt-in, Aspire resource registration, spec-URL
   discovery, execution policy. That is composition, and it is what a thin plugin legitimately owns.
3. **Is the split worth two packages at all?** State the case for a single core extension honestly.

The archetype also names its doctrine anchors — `05-folder-structure.md`,
`06-archetypes.md#archetype-5--plugin-package`, `07-composition-and-extension.md#plugin-discovery-and-loading`,
`08-runtime-state-failure.md`, `09-anti-patterns-and-fitness-functions.md` — plus specific
anti-patterns (AP-1, AP-3, AP-8…) and fitness functions (F-1, F-3, F-5…). **Check the design against
those explicitly**; the reference shape it points to is `auth-core` plus its thin adapters.

One further consideration: whichever shape you choose would be the **first first-party plugin outside
workers/sagas/streams/triggers**, so it is real evidence about whether the contribution model works
for something new. **#1093** records that plugin discovery currently hardcodes official plugins'
factory functions in the core SDK. Say plainly whether that blocks this design and what must change.

A well-argued "extend core, no plugin" is a perfectly good outcome — and on the thinness law it may
be the right one.

## Prior art to study — read the code, do not summarise the READMEs

None of these is Deno, and none is a drop-in. Read them for **projection strategy, tool naming,
schema handling and filtering**, then decide what we source, what we vendor, and what we write.

| Project | Why it matters |
| --- | --- |
| `harsha-iiiv/openapi-mcp-generator` | Exposes `getToolsFromOpenApi(spec, opts)` — a **programmatic projection function** returning MCP tool definitions with `baseUrl`, `dereference`, `excludeOperationIds`, `filterFn`. The most surgical option: we may need only the projection, not another server. |
| `ivo-toby/mcp-openapi-server` (`@ivotoby/openapi-mcp-server`) | Usable as a **library**: takes the spec **by URL** (`specInputMethod: 'url'`) — exactly our case — with `apiBaseUrl`, `toolsMode`, and `extraTools` so NetScript tools can sit beside generated ones. |
| `awslabs/openapi-mcp-server` | **Python**, so a behavioural reference only. Notable for `--spec-path`, `--allow-private-networks`, container deployment, and that it **executes** calls rather than only introspecting. |
| `nihal1294/openapi-to-mcp`, `beshkenadze/openapi-mcp-generator`, `EvilFreelancer/openapi-to-mcp` | Secondary references for naming, description quality, filtering. |

**Check the licence of anything you propose sourcing**, and say so in the design. Prefer vendoring a
small projection over a runtime dependency on a whole server.

## What the design must settle

1. **Plugin or core extension.** With doctrine citations, and a straight answer on #1093.
2. **Introspection versus execution.** Read-only — *list endpoints, fetch a schema* — removes blind
   `curl` on its own at almost no risk. Execution (an agent invoking endpoints through MCP) is more
   useful and considerably more dangerous against a live database. Propose the safe default and the
   opt-in path, with the security argument written out.
3. **Discovery across dynamic ports.** Aspire assigns ports at run time.
   `getServiceUrl(serviceName, protocol)` already exists at
   `packages/sdk/src/discovery/service-url.ts:97` and the generated telemetry example uses it. Show
   how every service in the AppHost is discovered, not one configured base URL.
4. **Tool naming and description quality.** A generic generator produces a REST dump. We hold
   contract metadata — the agent-facing surface should read like NetScript. This is where a tailored
   package earns its existence; make the case concretely, with before/after tool definitions.
5. **Scope.** All services, or opt-in per service? What happens with auth-protected endpoints?
6. **The activation question.** Where does an agent *encounter* this at the moment it would otherwise
   reach for `curl`? A tool nobody invokes is worth nothing — wave four called the docs MCP **zero
   times**. Tie this to #1071/#1072 rather than assuming discovery.

## Deliverables

Match #890's run record shape:

Use the harness templates in `.llm/harness/templates/` for the standard artifacts — `context-pack.md`,
`research.md`, `plan.md`, `worklog.md`, `drift.md`, `supervisor.md` — and #890's seed-run extension
for the design itself:

```
.llm/runs/plan-openapi-mcp-plugin--seed/
  context-pack.md          per template
  research.md              upstream + prior-art verification, cited
  plan.md                  decisions D1..Dn, and open forks for the owner
  worklog.md / drift.md    per template
  design/canonical/00-overview.md .. NN-doctrine-fit.md
  design/examples/*.md     at least two worked examples end to end
  rfc.md                   the canonical RFC text — becomes the PR body
```

The final canonical design file must be the **doctrine-fit** section, as in #890, and it must address
the ARCHETYPE-5 anti-patterns and fitness functions by name.

Every load-bearing claim must cite a file path and line, or a verified upstream source. Where you
infer, say so. Where you are uncertain, write it into `plan.md` as an open fork for the owner rather
than resolving it silently.

**Do not open the PR.** Do not implement the plugin. Do not modify anything outside your run
directory. The machine is shared — a release orchestrator and a docs agent are running; no AppHost,
no docker, no scaffold.

When the design is complete, stop and report. The adversarial pass follows.
