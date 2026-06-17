# Handover prompt — 5d2 PLAN phase (copy-paste below this line)

use harness

You are the PLAN-phase generator for **Wave 5d sub-gate 2/6: `./builders`** —
the `definePage` DSL and page pipeline of `@netscript/fresh`. This is the
heaviest cluster of the wave (over-cap files: `builders/mod.ts` 41.5K,
`define-page/builder.tsx` 38.6K, `define-page/types.ts` 22.6K,
`navigation.tsx` 20.7K, `runtime.tsx` 18.6K; `define-page.test.tsx` 46K).
PLAN only: research → design → proposed slice lock. Zero implementation.
PLAN-EVAL is a separate session. The umbrella plan sanctions splitting this
unit into TWO locked plans if your measurements justify it.

## Where you work

- Worktree: `C:\Dev\repos\netscript\output\test-app\worktrees\repo-genesis\.genesis\netscript\.worktrees\wave5-apps-5d2-builders`
- Branch: `feat/package-quality-wave5-apps-5d2-builders` · Draft PR: **#35**
  (base: `feat/package-quality-wave5-apps-5d-fresh`)
- Run dir (seeded): `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/`

## Authority — read first, in order

1. BINDING umbrella target architecture:
   `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (branch
   `feat/package-quality-wave5-apps-5d-fresh`). Divergence = drift entry.
2. `.llm/harness/` (ARCHETYPE-3 + SCOPE-frontend + A4-Browser obligation,
   gate matrix, run-loop, `lessons/package-quality-archetype.md`). If
   `.claude/skills/netscript-doctrine/SKILL.md` is absent, `.llm/harness/`
   is the doctrine source.
3. RFC 12 (composable builder) in `.resources/rfcs/`; the 5d1 plan if
   already delivered (PR #34) — its conventions bind you.

## Skills to activate

`netscript-harness`, `netscript-doctrine`, `jsr-audit`, `deno-fresh`,
`frontend-design`, `ux-patterns`.

## Deep-dive directives (use your judgment hard here)

1. **Decomposition under caps with zero surface change** — map every public
   symbol of `./builders` first (`deno doc`), then design the file split
   (`builder` / `runtime` / `navigation` / `search-params` / `types`,
   `_internal/` for non-public helpers) so export specifiers and public type
   names are untouched. The 46K test file decomposes along the same seams.
2. **DSL benchmark** — compare `definePage` head-on with TanStack Start
   route/loader APIs, Next.js App Router (layouts, server actions,
   streaming), and Remix/React Router data APIs. Identify DX gaps (typed
   search params, navigation, pending UI, error/redirect ergonomics) and
   propose which gaps are in-scope polish vs RFC-deferred. E2E typesafety
   from loader to island props is the bar.
3. **Island bridge & partials** — `define-partial.tsx` + Fresh 2 partials:
   read `.llm/tmp/docs/fresh2-islands-partials.md`. How the builder hands
   typed data to islands is a seam 5d6 (query) builds on — design it
   explicitly.
4. **RFC 14 protection** — `definePage` extension points must anticipate
   unified mode without implementing it; audit which builder options would
   break under a non-Fresh adapter.
5. **Browser validation strategy** — A4-Browser: define which real routes in
   `apps/playground` (or a fixture app) prove the builder pipeline (SSR,
   navigation, pending states, error boundaries) during implementation.

## MEASURE-FIRST

Re-measure on your branch before locking: combined `deno doc --lint` for
`./builders`, `deno check --unstable-kv`, over-cap inventory, private-type
refs, dry-run. Root check excludes `packages/fresh` — measure directly.
Decide one plan vs two from the numbers (≤30 slices each).

## Concept of done (PLAN phase)

On PR #35, pushed: `research.md` (symbol map + market comparison with
sources), `design.md` (decomposition + DSL gap verdicts + island/RFC-14
seams), `plan.md` (PROPOSED slice lock with per-slice gates and budgets; or
two plans with an explicit boundary), `drift.md`, `context-pack.md`. Final
comment: **READY FOR PLAN-EVAL**. Fable 5 reviews the plan on the PR first.

## Routine (every milestone)

Commit per artifact milestone, never amend; trailer
`Co-Authored-By: <your model name> <noreply@anthropic.com>`; append-only run
docs with hashes in `commits.md`; push after every commit; PR comment on
#35 with a Stage / Artifacts / Findings / Drift / Commits table.

## Hard constraints

No implementation, no self-eval, no merging. Never touch lock files / no
`deno cache --reload`; restore dev-server-mutated root `deno.lock` via
`git checkout -- deno.lock`. Surface or dependency changes need an umbrella
drift entry flagged for the supervisor. Implementation later happens AFTER
5d1 lands — your plan must state its 5d1 dependencies (taxonomy, telemetry,
testing entrypoint) explicitly.
