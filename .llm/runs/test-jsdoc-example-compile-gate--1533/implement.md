use harness

# Leaf brief — #1533 JSDoc `@example` compile gate

You are the implementation author for internals leaf `test-jsdoc-example-compile-gate--1533`.

- Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-1533`
- Branch: `test/jsdoc-example-compile-gate` @ `13878a80a50c55b9662099fed64555f2310ae4a3` (live `main`), **no upstream by design**
- Run dir: `.llm/runs/test-jsdoc-example-compile-gate--1533/`
- Push rule: explicit refspec only — `git push origin HEAD:refs/heads/test/jsdoc-example-compile-gate`
- Closes exactly **#1533**. No other issue.

## The problem, in the issue's own terms

`packages/**` JSDoc `@example` blocks are the reference documentation rendered on JSR — what a
consumer or agent reads for every published package. **Nothing compiles them, and nothing checks
their import specifiers against the shipped module layout.**

Three verified facts from the issue: `deno doc --lint` exits 0 on an `@example` importing a module
that does not exist; the scoped type-check wrappers select source files, not comment contents; and
that is exactly how #1425 survived a full golden-path rewrite with a dead import.

## Research the supervisor already did — inherit it, then re-verify before relying on it

This lane's ledger claimed #1533 was blocked because four `packages/contracts` examples "import from
a non-exporting root". **That claim is false and you must not propagate it.** The recorded
measurement asked `packages/contracts/mod.ts` for symbols the examples never claimed were on the
root. The examples import from `@netscript/contracts/query` and `/transform`, which are real
published subpaths (`packages/contracts/deno.json` exports `.`, `./crud`, `./query`, `./transform`),
and every symbol resolves from the subpath its example names.

**One genuine defect does survive**, confirmed directly at this base:
`packages/contracts/schemas/pagination.ts`'s `@example` imports only `PaginationInputSchema` and
`createPaginatedOutput`, then uses **`baseContract` and `UserSchema` with no import for either**. It
cannot compile. That is a real instance of the class this gate exists to catch — evidence the gate is
worth building.

Re-verify both of these yourself before building on them. The lesson that produced them is that
**a ledger entry is a claim with a citation, and the citation must be re-run against the thing it
names.**

## SKILL

Activate the harness workflow per `.agents/skills/netscript-harness` and `.llm/harness/`. Also load:

- `.agents/skills/netscript-doctrine` — this gate reads and reports on `packages/**` public surface,
  so archetype, published-surface, and fitness-gate rules govern what it may assert.
- `.agents/skills/netscript-deno-toolchain` — **`deno doc` is the primary instrument here.** Learn its
  filter/lint surface before hand-rolling any parser over JSDoc; the issue is precisely that
  `deno doc --lint` does not compile examples, so know exactly what it does and does not give you.
- `.agents/skills/netscript-tools` — structured wrappers, gate receipts, `.llm/tools/gates/catalog.ts`
  wiring, and what counts as a trustworthy verdict source.
- `.agents/skills/netscript-pr` — branch, draft PR, closing keyword, label taxonomy, milestone.
- `.agents/skills/jsr-audit` — the published-reference surface this gate ultimately protects.

Follow `AGENTS.md` operating rules: doctrine first for `packages/**`, contract before implementation
before tests, wrap rather than reinvent, research before writing, and record drift explicitly.

## Phase

Bootstrap → research → plan, then **stop at the plan gate**. Do not implement before PLAN-EVAL.

## The decision the plan must settle

Nobody can state how many examples fail until the gate exists. So the plan must state, in advance and
with rationale, the **fix-or-baseline position**: when the gate first runs and reports N failures,
does the leaf repair them, baseline them with an attributable allowance, or split repairs into a
follow-up? Decide the *policy* now; the number is discovered later. A plan that defers this decision
to implementation will fail its gate.

Also settle: which packages are in scope (all `packages/**`, or the published set only), how the gate
selects `@example` blocks, how it compiles them without executing them, how it handles examples that
are deliberately illustrative rather than runnable, and where the gate is wired (`deno.json` task,
`.llm/tools/gates/catalog.ts`, CI).

## Working rules

- Contract first, then implementation, then tests. RED before GREEN, visible in history as its own
  commit.
- Prefer `deno doc` and existing repo wrappers over new abstractions; wrap, do not reinvent.
- Commit at every slice boundary and push, so an interrupted turn never costs more than one slice.
- Copy SHAs from `git log`; never retype them. A prior leaf in this lane failed a gate on a
  fabricated SHA suffix.
- Record drift in `drift.md` rather than silently diverging.

## Host facts (current — do not carry older briefs' claims)

PID 1 is `tini` and **zombie count is 0**; the old ~7.7k-zombie condition is **resolved**, so root
`deno task test` **is** a usable verdict source now. `fs.inotify.max_user_instances` is **1024**.
Docker/DinD is operational (`netscript-dind`, client/server **28.5.2**) — but **do not** run Aspire,
Docker, browser, `e2e:cli`, or `scaffold.runtime`: those need the coordinator's serialized
expensive-gate lease, which this leaf does not hold. `rtk` is not installed; call `git`/`gh`/`grep`
directly. Do not kill any process you did not start.

## Boundaries

Open the PR **draft** with `Closes #1533`, milestone `0.0.7`, labels `type:test` + `area:tooling`
(+ `area:docs`) and exactly one `status:`. Do not merge, mark ready, relabel the issue, close
anything, or change milestone scope. Do not launch or simulate any evaluator — PLAN-EVAL and
IMPL-EVAL are dispatched separately by the supervisor.

Report when `plan.md` is pushed, with the head SHA and your PLAN-EVAL readiness statement.
