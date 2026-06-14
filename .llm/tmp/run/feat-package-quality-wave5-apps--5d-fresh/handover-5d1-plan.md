# Handover prompt — 5d1 PLAN phase (copy-paste below this line)

use harness

You are the PLAN-phase generator for **Wave 5d sub-gate 1/6: the
`@netscript/fresh` support spine** — `./error`, `./utils`, `./vite`
(config/), `./interactive`, the curated root `mod.ts`, and the package
doctrine spine (docs/ scaffold, `./testing` entrypoint, task hygiene, single
config). PLAN only: research → design → proposed slice lock. Zero
implementation. PLAN-EVAL is a separate session.

## Where you work

- Worktree: `C:\Dev\repos\netscript\output\test-app\worktrees\repo-genesis\.genesis\netscript\.worktrees\wave5-apps-5d1-support`
- Branch: `feat/package-quality-wave5-apps-5d1-support` · Draft PR: **#34**
  (base: `feat/package-quality-wave5-apps-5d-fresh`)
- Run dir (append-only worklog/commits/drift, already seeded):
  `.llm/tmp/run/feat-package-quality-wave5-apps--5d1-support/`

## Authority — read first, in order

1. The umbrella target architecture (BINDING):
   `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` on branch
   `feat/package-quality-wave5-apps-5d-fresh`. Your plan must derive from it;
   divergence = drift entry escalated to the umbrella, never silent rescope.
2. `.llm/harness/` — activation, run-loop, ARCHETYPE-3 + SCOPE-frontend,
   gate matrix, `lessons/package-quality-archetype.md` (items 6–7: docs
   scaffold + doctests are REQUIRED deliverables of your plan).
   Note: `.claude/skills/netscript-doctrine/SKILL.md` may be absent in the
   worktree — the `.llm/harness/` files are the doctrine source then.
3. `.llm/tmp/run/feat-package-quality-wave5-apps--umbrella/split-strategy.md`
   (the 5d cut rationale) and RFC 12 in `.resources/rfcs/`.

## Skills to activate

`netscript-harness` (default), `netscript-doctrine`, `jsr-audit`,
`deno-fresh`.

## Why this unit matters / deep-dive directives

You set the conventions every later 5d unit inherits. Use your judgment
deeply on:

1. **Error taxonomy** — `error/handler.ts` (11.8K) + `primitives.ts` +
   `components/ErrorDisplay.tsx`. Design the public error model (typed
   errors, boundaries, HTTP mapping) and decide the default position from the
   umbrella plan: ErrorDisplay moves INTO `error/`. Compare how TanStack
   Start and Next.js App Router model route/loader errors.
2. **Telemetry convention** — `defer/telemetry.ts` and `form/telemetry.ts`
   exist as forks. Propose ONE cross-cutting telemetry convention (naming,
   spans/events, OTel alignment with the rest of NetScript) that 5d4/5d5
   adopt. This is the E2E-telemetry keystone of the whole wave.
3. **`./vite`** — `config/vite.ts` wraps the Fresh 2 vite plugin. Research
   Fresh 2's current vite story (`.llm/tmp/docs/fresh2-islands-partials.md`,
   `.resources/deps-docs/`) and define the minimal stable wrapper surface.
4. **`./interactive` and `hooks/`** — today it only re-exports `usePromise`.
   Decide what the package-owned interactive seam IS vs what belongs to
   fresh-ui; default position: `hooks/use-promise.ts` folds into the
   interactive seam's backing module.
5. **Doctrine spine** — single `deno.json` (tasks: check/test/doc-lint/fmt/
   lint/dry-run), `./testing` entrypoint design (what test harnesses do
   consumers of builders/route/form need later? scaffold now, extend per
   unit), `docs/` scaffold + doctest fixture plan, curated root `mod.ts`
   policy (what earns a root export).

## MEASURE-FIRST (do this before locking slices)

Re-measure on YOUR branch (root check excludes `packages/fresh` — measure
directly): `deno doc --lint` over each of your entrypoints (combined, never
root-barrel-only), `deno check --unstable-kv` over entrypoints, file-size
caps, private-type-ref count, `deno publish --dry-run --allow-dirty`.
Record numbers in research.md; they justify the slice count (≤30; expect
this unit to be small-to-mid).

## Concept of done (PLAN phase)

On PR #34, pushed: `research.md` (current-state inventory + market
comparison with sources), `design.md` (target shapes + conventions for
items 1–5 above), `plan.md` (PROPOSED slice lock: numbered slices, each with
gates from the archetype matrix + the doc-lint/dry-run budget it retires),
`drift.md`, `context-pack.md` (review hot-spots for the evaluator). Final PR
comment: **READY FOR PLAN-EVAL** with a summary table. Fable 5 reviews your
plan on the PR before PLAN-EVAL — write for that reviewer.

## Routine (every slice of planning work)

- Commit per artifact milestone (research / design / plan — never amend),
  trailer: `Co-Authored-By: <your model name> <noreply@anthropic.com>`.
- Append-only run docs; hashes recorded in `commits.md`.
- Push after every commit; PR comment per milestone on #34 with a
  Stage / Artifacts / Findings / Drift / Commits table.

## Hard constraints

No implementation. No self-evaluation, no merging. Never touch lock files or
run `deno cache --reload`. Root `deno.lock` may be mutated by dev servers —
`git checkout -- deno.lock` before staging. Surface changes (export
specifiers, public type names, new deps) require an umbrella drift entry in
your plan, flagged for the supervisor.
