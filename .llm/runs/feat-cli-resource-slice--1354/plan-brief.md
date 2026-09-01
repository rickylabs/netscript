use harness

# PLAN — a re-runnable verb that generates the canonical resource slice (#1354)

## SKILL

- `netscript-harness` — plan artifact shape, slice ceilings, gate evidence.
- `netscript-cli` — the generate/scaffold command surface and template conventions.
- `netscript-doctrine` — `packages/cli` (Archetype 6) boundaries.
- `deno-fresh` — route/island/partial conventions the emitted slice must satisfy.

**Produce a plan only. Write no product code.** Deliverables: `research.md`, `plan.md`,
`context-pack.md` under `.llm/runs/feat-cli-resource-slice--1354/`.

## The problem, stated precisely

Every element of the canonical resource slice already exists in `packages/fresh` and is demonstrated
**once**, as a frozen `init` template for the single scaffolded example service. **No re-runnable verb
emits it.** A user adding a second resource must hand-transcribe: the typed route contract, the
`definePage` root, the route-local `(_components)`/`(_islands)`/`(_shared)` layout, the cache-first
loader, the `QueryIsland`, and the deferred partial.

The measured consequence is the justification: in the Wave-6 `rickylabs/loom` run, an agent given the
registry, `/design`, `AGENTS.md` and `WEB-LAYER.md` **still** hand-rolled tables, direct service calls
and a 676-line island. **Generation, not more prose, is the lever.** Verify this claim yourself against
`research/repo-audit/mcp-cli.md` §4.2 and `research/repo-audit/web-layer.md` §2.1 before planning —
those cite an element-by-element framework-✅ / generated-❌ table.

## Establish the baseline from code, not from the issue text

`generate-group.ts` currently registers only three commands, and exactly one generated app asset
references `withResource`/`withRouteContract` (the frozen `examples/service/index.tsx.template`).
Confirm both, and inventory precisely which elements a verb must emit.

## Decisions the plan must lock

1. **Verb shape and placement** — a new `generate` subcommand vs an extension of an existing verb.
   Say which, and why it does not collide with `ui:add`.
2. **Re-runnability semantics.** This is the crux: what happens on a second run over an existing
   resource — overwrite, skip, merge, or fail? Hand-edited user code must never be silently
   destroyed. State the guarantee and how a test proves it.
3. **Template source of truth.** The frozen example template and the new generator must not drift
   into two divergent copies of the same canonical slice. Say which is authoritative.
4. **Registration side effects** — `router.ts` / `appRoutes` / `State` extension are shared files.
   Say exactly how the verb edits them idempotently, and what happens when the user has customised
   them.
5. **Multi-client interaction.** #1664 (in flight) adds an explicit `--client <service>` selector with
   a **fail-closed** ambiguity default for data-bound scaffolds. Any resource verb that binds a query
   client must adopt that same selector and default — **do not invent a second selection mechanism and
   do not silently auto-pick a client.**
6. **Slice decomposition** with per-slice file ceilings, expected touch sets, and gates, in the style
   of `.llm/runs/feat-workers-runtime--1592-1451/plan.md` on `main` — read it as the shape reference.
7. **Partial semantics** — each slice references `#1354` with **no closing keyword**.

## Coordination constraints, binding

- **#1664 is unmerged and owns `packages/cli` scaffold production files** (`web-scaffold.ts`,
  `add-ui-command.ts`, the `service-query` template). Plan around them: prefer additive files, and
  name explicitly any shared file a slice must touch so the supervisor can serialise it.
- **Do not run any local runtime, Aspire, Docker, browser, or `e2e:cli` gate.** A prior lane worker
  leaked three containers doing this out of brief. The hosted lane owns runtime proof.
- Prefer `deno doc` over broad source reads for published surfaces.
- Do not modify `.llm/runs` content authored by other runs.
