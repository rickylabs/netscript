# Handover prompt — 5d3 PLAN phase (copy-paste below this line)

use harness

You are the PLAN-phase generator for **Wave 5d sub-gate 3/6: `./route`** —
the route manifest and contract runtime of `@netscript/fresh`
(`route/contract.ts` 21.2K, `route/mod.ts` 27K, `route/manifest.ts` 14.1K —
all over cap). PLAN only: research → design → proposed slice lock. Zero
implementation. PLAN-EVAL is a separate session.

## Where you work

- Worktree: `C:\Dev\repos\netscript\output\test-app\worktrees\repo-genesis\.genesis\netscript\.worktrees\wave5-apps-5d3-route`
- Branch: `feat/package-quality-wave5-apps-5d3-route` · Draft PR: **#36**
  (base: `feat/package-quality-wave5-apps-5d-fresh`)
- Run dir (seeded): `.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/`

## Authority — read first, in order

1. BINDING umbrella target architecture:
   `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (branch
   `feat/package-quality-wave5-apps-5d-fresh`). Divergence = drift entry.
2. `.llm/harness/` (ARCHETYPE-3 gate matrix incl. F-13 + runtime/Aspire
   validation, consumer-import test, run-loop). If
   `.claude/skills/netscript-doctrine/SKILL.md` is absent, `.llm/harness/`
   is the doctrine source.
3. RFC 12 + RFC 17 sections on routing/contracts in `.resources/rfcs/`;
   the 5d1 plan (PR #34) conventions bind you; coordinate seams with the
   5d2 plan (PR #35) — builders consume route contracts.

## Skills to activate

`netscript-harness`, `netscript-doctrine`, `jsr-audit`, `deno-fresh`,
`aspire` (runtime validation design).

## Deep-dive directives

1. **The contract runtime is the typesafety spine** — `contract.ts` carries
   the typed route params/responses story. Map every public symbol, then
   design the decomposition (validation, codegen-facing types, runtime
   matchers) without changing export specifiers. E2E typesafety: a route
   contract declared once must type the server handler, the client sdk call
   (5b `createServiceClient`), and the island props (5d6 query) — document
   that chain explicitly as the unit's north star.
2. **Manifest** — how routes are discovered/registered vs Fresh 2's own
   fsRoutes; what NetScript adds (contracts, telemetry route names) and what
   must stay thin wrapping (wrap, don't reinvent). Compare TanStack Router's
   route-tree typing and Next.js typed routes for the DX bar.
3. **oRPC alignment** — NetScript is contract-first (`contracts/versions/`);
   research how route contracts relate to the oRPC contracts used by
   services so the two contract worlds don't fork vocabularies.
4. **Runtime validation design** — A3: plan the Aspire-backed proof
   (playground app boots, routes resolve, contract violations surface
   correctly) and abort/cleanup behavior for handler lifecycles.

## MEASURE-FIRST

On your branch: combined `deno doc --lint` for `./route`,
`deno check --unstable-kv`, over-cap inventory (756/601/464 at baseline),
private-type refs, dry-run. Root check excludes `packages/fresh`. Slice lock
≤30, justified by the numbers.

## Concept of done (PLAN phase)

On PR #36, pushed: `research.md` (symbol map + contract-chain analysis +
market comparison with sources), `design.md` (decomposition + contract/
manifest target + oRPC alignment verdict), `plan.md` (PROPOSED slice lock
with per-slice gates incl. F-13 and runtime validation slices), `drift.md`,
`context-pack.md`. Final comment: **READY FOR PLAN-EVAL**. Fable 5 reviews
the plan on the PR first.

## Routine (every milestone)

Commit per artifact milestone, never amend; trailer
`Co-Authored-By: <your model name> <noreply@anthropic.com>`; append-only run
docs with hashes in `commits.md`; push after every commit; PR comment on
#36 with a Stage / Artifacts / Findings / Drift / Commits table.

## Hard constraints

No implementation, no self-eval, no merging. Never touch lock files / no
`deno cache --reload`; restore root `deno.lock` via `git checkout --
deno.lock` if a dev server mutates it. Surface/dependency changes need an
umbrella drift entry. Implementation runs after 5d2 lands — state your 5d1/
5d2 dependencies explicitly in the plan.
