# Handover prompt — 5d5 PLAN phase (copy-paste below this line)

use harness

You are the PLAN-phase generator for **Wave 5d sub-gate 5/6: `./form`** —
the RFC 15 forms system of `@netscript/fresh` (26 files; over-cap:
`schema-adapter.ts` 16.3K, `types.ts` 16K, `field-descriptors.ts` 15.5K).
PLAN only: research → design → proposed slice lock. Zero implementation.
PLAN-EVAL is a separate session.

## Where you work

- Worktree: `C:\Dev\repos\netscript\output\test-app\worktrees\repo-genesis\.genesis\netscript\.worktrees\wave5-apps-5d5-form`
- Branch: `feat/package-quality-wave5-apps-5d5-form` · Draft PR: **#38**
  (base: `feat/package-quality-wave5-apps-5d-fresh`)
- Run dir (seeded): `.llm/tmp/run/feat-package-quality-wave5-apps--5d5-form/`

## Authority — read first, in order

1. BINDING umbrella target architecture:
   `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (branch
   `feat/package-quality-wave5-apps-5d-fresh`). Divergence = drift entry.
2. `.llm/harness/` (ARCHETYPE-3 + the A4-Browser obligation: real-route
   validation; gate matrix; run-loop). If
   `.claude/skills/netscript-doctrine/SKILL.md` is absent, `.llm/harness/`
   is the doctrine source.
3. RFC 15 in `.resources/rfcs/`; the fresh-ui form seams delivered by 5c:
   `packages/fresh-ui/registry/components/ui/form-field.tsx`,
   `registry/lib/control-props.ts`, and `packages/fresh-ui/docs/
   l0-conventions.md` (attribute contract). 5d1 plan (PR #34) error
   taxonomy + telemetry conventions bind you.

## Skills to activate

`netscript-harness`, `netscript-doctrine`, `jsr-audit`, `deno-fresh`,
`frontend-design`, `ux-patterns`.

## Deep-dive directives

1. **fresh ↔ fresh-ui seam** — RFC 15 forms must drive fresh-ui's
   `form-field`/`control-props` without either package importing the
   other's internals: fresh emits state (errors, pending, values) through a
   typed contract; fresh-ui renders it via its attribute contract
   (`data-*`/ARIA). Design that contract precisely — it is the marquee
   integration of the wave.
2. **Schema adapter** — `schema-adapter.ts` (16.3K): evaluate Standard
   Schema (zod/valibot/arktype interop) as the adapter target so NetScript
   doesn't hand-roll per-library glue. Validation must be E2E typed:
   contract → server pipeline → field descriptors → island state.
3. **Progressive enhancement** — forms must work without JS (intent/
   reply/CSRF/idempotency files exist for this) and upgrade with islands.
   Compare Remix/React Router actions, Next.js server actions +
   useActionState, and TanStack Form for the DX bar; identify gaps worth
   closing vs deferring.
4. **Decomposition** — map public symbols, split the three over-cap files
   along descriptor/adapter/state seams without changing export specifiers;
   `types.ts` likely splits by audience (author-facing vs internal).
5. **Browser validation strategy** — define the real playground routes that
   prove: no-JS submit, enhanced submit, server validation errors rendered
   through fresh-ui fields, pending/idempotency UX, CSRF.

## MEASURE-FIRST

On your branch: combined `deno doc --lint` for `./form`,
`deno check --unstable-kv`, over-cap inventory (577/519/475 baseline),
private-type refs, dry-run. Root check excludes `packages/fresh`. Slice
lock ≤30, justified by numbers.

## Concept of done (PLAN phase)

On PR #38, pushed: `research.md` (symbol map + seam analysis + market
comparison with sources), `design.md` (fresh↔fresh-ui contract + schema
adapter verdict + decomposition), `plan.md` (PROPOSED slice lock with
per-slice gates incl. browser-validation slices), `drift.md`,
`context-pack.md`. Final comment: **READY FOR PLAN-EVAL**. Fable 5 reviews
the plan on the PR first.

## Routine (every milestone)

Commit per artifact milestone, never amend; trailer
`Co-Authored-By: <your model name> <noreply@anthropic.com>`; append-only run
docs with hashes in `commits.md`; push after every commit; PR comment on
#38 with a Stage / Artifacts / Findings / Drift / Commits table.

## Hard constraints

No implementation, no self-eval, no merging. Never touch lock files / no
`deno cache --reload`; restore root `deno.lock` via `git checkout --
deno.lock`. Surface/dependency changes (incl. adding a Standard Schema dep)
need an umbrella drift entry flagged for the supervisor. Implementation
runs after 5d4 lands — state 5d1..5d4 dependencies explicitly.
