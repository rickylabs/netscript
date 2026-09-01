use harness

# Leaf brief — #1616 dynamic-route scaffold gate coverage

- Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-1616`
- Branch: `test/scaffold-dynamic-route-gate` @ `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` (live `main`), **no upstream**
- Run dir: `.llm/runs/test-scaffold-dynamic-route-gate--1616/`
- Push: explicit refspec only — `git push origin HEAD:refs/heads/test/scaffold-dynamic-route-gate`
- Closes exactly **#1616**

## SKILL

Activate the harness workflow per `.agents/skills/netscript-harness` and `.llm/harness/`. Also load
`.agents/skills/netscript-doctrine` (this touches `packages/cli` framework code — archetype, public
surface, fitness gates govern it), `.agents/skills/netscript-cli` (the E2E surface: `packages/cli/e2e`
gate classes, `capability-suites.ts` ordering, `runtime/` gate modules), `.agents/skills/netscript-tools`
(structured wrappers, gate receipts, lock hygiene), `.agents/skills/deno-fresh` (Fresh routing, dynamic
segments, `definePage().withRoute(...)`), and `.agents/skills/netscript-pr`.

Follow `AGENTS.md`: doctrine first for `packages/`, contract before implementation before tests, wrap
rather than reinvent, research before writing, record drift explicitly.

## The problem, in the issue's own terms

**The NetScript scaffold emits no dynamic page route, so no gate anywhere exercises dynamic route
binding end to end.**

```
grep -rnE "createRouteReference\('/[^']*\[" packages/cli/src
```

returns nothing. Every emitted reference is a static path. Dynamic references only ever appear in a
*consumer's* generated `.generated/routes.ts`, produced by scanning that consumer's own route files —
so `scaffold.runtime` type-checks and runs a generated workspace containing no dynamic route at all.

**This is how #1576 reached a consumer undetected**: a generated dynamic Form-C reference passed to
`definePage().withRoute(...)` inferred `{project, channel}` at compile time and resolved `ctx.path` to
`{}` at runtime; the partial request then returned **500** when `makeHref` threw
`missing path param project`. Every gate was green throughout, because no gate had a dynamic route to
bind.

**Re-derive all of this yourself at this base before building on it.** Run the grep, read the emission
sites the issue names, and confirm #1576's mechanism from the code rather than from this brief. A
prior leaf in this lane spent two cycles because a carried claim was re-run against the wrong
entrypoint — the citation must be re-executed against the thing it names.

## Phase

Bootstrap → research → plan, then **stop at the plan gate**. Do not implement before PLAN-EVAL.

## What the plan must settle

- **Where the dynamic route is emitted**: the scaffold's own route seeds, or a fixture the E2E gate
  injects. Emitting it into every scaffolded project changes what every consumer receives — a public
  surface decision, not a test-only one. Decide it, with rationale, and say which surfaces move.
- **What "exercises dynamic route binding end to end" means concretely** — compile-time param
  inference, runtime `ctx.path` population, and `makeHref` round-trip are three different assertions;
  #1576 passed the first and failed the others. Name the assertions.
- Whether the gate belongs in `scaffold.runtime` (needs the expensive-gate lease at merge-readiness)
  or a narrower suite, and what runs without a lease.
- Whether a RED reproduction of #1576's exact failure is achievable without a runtime lease.

## Working rules

RED before GREEN, visible in history as its own commit. Commit and push at every slice boundary so an
interrupted turn costs at most one slice. Copy SHAs from `git log`, never retype. Record drift in
`drift.md` as you go.

## Host facts (current)

PID 1 is `tini`, **0 zombies** — root `deno task test` **is** a usable verdict source and is currently
**fully green** at this base (4291 passed / 0 failed). `fs.inotify.max_user_instances` is **1024**.
Docker/DinD is operational (client/server **28.5.2**) — but **do not** run Aspire, Docker, browser,
`e2e:cli`, or `scaffold.runtime`: those need the coordinator's serialized expensive-gate lease, which
this leaf does **not** hold. `rtk` is not installed; call `git`/`gh`/`grep` directly. Do not kill any
process you did not start.

**Credential boundary you must plan around:** the current PAT carries `repo` scope only. **Any commit
touching `.github/workflows/**` cannot be pushed** — a sibling leaf is currently blocked on exactly
this. If your plan needs CI wiring, isolate it into its own final commit and say so, so the rest of
the branch remains pushable.

## Boundaries

Open the PR **draft** with `Closes #1616`, milestone `0.0.7`, labels `type:test` + `area:cli` +
`area:fresh` and exactly one `status:`. Do not merge, mark ready, relabel the issue, close anything,
or change milestone scope. Do not launch or simulate any evaluator — PLAN-EVAL and IMPL-EVAL are
dispatched separately by the supervisor.

Report when `plan.md` is pushed, with the head SHA and your PLAN-EVAL readiness statement.
