# Handover prompt — 5d6 PLAN phase (copy-paste below this line)

use harness

You are the PLAN-phase generator for **Wave 5d sub-gate 6/6: `./query` +
`./server` + the final package surface** of `@netscript/fresh` — the RFC 17
island query bridge over the 5b sdk, `defineFreshApp`, the curated root
barrel, the F-16 cardinality pass over all entrypoints, and the RFC 14
unified-mode seam audit. This unit CLOSES the wave: its last slices prove
the whole package (JSR dry-run, doc-lint 0 combined, lift `packages/fresh`
into the root quality gates). PLAN only: research → design → proposed slice
lock. Zero implementation. PLAN-EVAL is a separate session.

## Where you work

- Worktree: `C:\Dev\repos\netscript\output\test-app\worktrees\repo-genesis\.genesis\netscript\.worktrees\wave5-apps-5d6-query`
- Branch: `feat/package-quality-wave5-apps-5d6-query` · Draft PR: **#39**
  (base: `feat/package-quality-wave5-apps-5d-fresh`)
- Run dir (seeded): `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/`

## Authority — read first, in order

1. BINDING umbrella target architecture:
   `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (branch
   `feat/package-quality-wave5-apps-5d-fresh`) — you are its enforcement
   unit: your final slices verify the whole-package quality bar it defines.
2. `.llm/harness/` (ARCHETYPE-3 gate matrix, F-16/F-18, run-loop,
   `lessons/package-quality-archetype.md`). If
   `.claude/skills/netscript-doctrine/SKILL.md` is absent, `.llm/harness/`
   is the doctrine source.
3. RFC 17 (TanStack SDK integration) + RFC 14 (unified mode — seams only)
   in `.resources/rfcs/`; the merged 5b sdk surface (query factories,
   `createServiceClient` Transport seam); ALL prior 5d plans (PRs #34–#38)
   — their landed conventions and seams bind you.

## Skills to activate

`netscript-harness`, `netscript-doctrine`, `jsr-audit`, `deno-fresh`,
`aspire`.

## Deep-dive directives

1. **The query island bridge (RFC 17)** — `query/` (hooks, hydration,
   query-client, query-island) bridges server loaders to TanStack
   Query-style island state via the 5b sdk `createQueryFactories`. Design
   the dehydrate-on-server / hydrate-in-island flow with full typing from
   route contract (5d3) through builder (5d2) to island hook. Compare
   TanStack Start's server-function + Query integration as the bar.
2. **`defineFreshApp`** — `server/define-fresh-app.ts` is tiny today;
   design the final app-builder surface: plugin/middleware mounting,
   telemetry bootstrap (5d1 convention), streaming defaults (5d4), and the
   RFC 14 extension points (adapter seam so unified mode never breaks the
   alpha surface). Audit `server.ts` exports accordingly.
3. **Final surface pass** — F-16 cardinality over all 13 entrypoints
   (incl. 5d1's `./testing`), curated root `mod.ts` policy enforcement,
   F-18 sub-barrel discipline, kill remaining private-type-refs
   package-wide.
4. **Wave closeout slices** — whole-package combined doc-lint 0, dry-run
   PASS incl. slow types, doctested README/getting-started complete, lift
   `packages/fresh` into root check/fmt/lint excludes-union (mirror how sdk
   and fresh-ui were lifted), final consumer-import + Aspire runtime proof
   on the playground.

## MEASURE-FIRST

On your branch: combined `deno doc --lint` for `./query`, `./server`, `.`,
plus the whole-package residue after 5d1–5d5 plans' budgets;
`deno check --unstable-kv`; private-type refs; dry-run. Slice lock ≤30 —
your numbers depend on prior units' landings; state assumptions explicitly
and mark closeout slices as re-measured at implementation time.

## Concept of done (PLAN phase)

On PR #39, pushed: `research.md` (query-bridge + defineFreshApp analysis +
RFC 14 seam audit + market comparison with sources), `design.md` (final
surface + hydration flow + app-builder extension points), `plan.md`
(PROPOSED slice lock incl. the wave-closeout gate slices), `drift.md`,
`context-pack.md`. Final comment: **READY FOR PLAN-EVAL**. Fable 5 reviews
the plan on the PR first.

## Routine (every milestone)

Commit per artifact milestone, never amend; trailer
`Co-Authored-By: <your model name> <noreply@anthropic.com>`; append-only run
docs with hashes in `commits.md`; push after every commit; PR comment on
#39 with a Stage / Artifacts / Findings / Drift / Commits table.

## Hard constraints

No implementation, no self-eval, no merging. Never touch lock files / no
`deno cache --reload`; restore root `deno.lock` via `git checkout --
deno.lock`. Surface/dependency changes need an umbrella drift entry.
Implementation runs LAST, after 5d5 lands — your plan explicitly lists its
dependencies on every prior unit's landed seams.
