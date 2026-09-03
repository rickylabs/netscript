use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-cli/SKILL.md`,
`.agents/skills/deno-fresh/SKILL.md` (if present), and `.agents/skills/netscript-pr/SKILL.md`.

You are the lane (Codex · OpenAI · GPT-5.6 Sol · medium, `normal_implementation`) for **#1481**,
**PLAN-FIRST**. Read it in full: `gh issue view 1481 --repo rickylabs/netscript`, and RFC 0005 §5
(`rfcs/0005-devtools-contribution.md`) for the dual-exclusion posture it cites.

Worktree `/home/agent/projects/netscript/worktrees/007-leaf-1481`, branch
`fix/design-route-prod-gate`, based on `origin/main` `850cc7757`. Scope: `packages/cli/**`
(scaffold assets under `src/kernel/assets/app/routes/(design)/**`, `write-app-files.ts`,
`assets/manifest.ts`, the embedded barrel, and `packages/cli/e2e/**` for the gate) plus this run
dir. Nothing else without a recorded drift entry.

## Phase 1 — PLAN (stop after this; the supervisor dispatches a separate-session PLAN-EVAL)

Answer the issue's open question **before** choosing a mechanism, from evidence in the repo:
is `/design` intended to reach production users? Cite `docs/site/_plan/01-positioning-brief.md:31`
("`/design` token + component …"), the scaffold README/templates, and any doc that positions it as a
dev-only design-system explorer vs a product surface. Record the answer and its evidence in
`plan.md`. If the repo is silent, say so and propose the default (dev-only, opt-in for production)
as the ruling to be confirmed by the supervisor.

Then plan the mechanism against RFC 0005 §5's **two independent** exclusions:
1. structural — the `(design)` route group absent from a production build graph (e.g. the scaffold
   writer emits it only under a flag, or Fresh build excludes it); and
2. fail-safe runtime — a `_middleware`/layout-level refusal when `MODE !== 'development'` (or the
   project's equivalent signal) unless an explicit opt-in is set.
State which of the two you can deliver in this slice and record any divergence explicitly, as the
issue's third acceptance box requires. Note the #1657 E-1 lesson: **any template change requires
regenerating the embedded barrel** (`embedded.generated.ts`) through its generator — plan that step
and the check that proves it.

Plan the gate: an `e2e:cli` assertion (a `scaffold.*` gate in `packages/cli/e2e/src/application/
gates/scaffold/`) that a production build of a scaffolded app contains no `(design)` route output,
and how it is proven non-vacuous (plant the route back, gate fails). Name the existing gate that is
the closest pattern to copy.

Write `plan.md` (decision, evidence, mechanism, file list, RED/GREEN sequence, gates, risks) and
`context-pack.md`; commit as `plan(cli): …`; push; open a **draft** PR titled
`fix(scaffold): gate /design out of production builds` with `Refs #1481`, labels `type:fix`,
`area:cli`, `priority:p2`, `status:plan`, `orchestrator:fixes`, milestone `0.0.7`. Then STOP and
report the plan SHA. Do not implement until the supervisor returns PASS_PLAN on that SHA.

## Gates (for the later implementation phase — do not run now)

`run-deno-check.ts --root packages/cli/src --ext ts,tsx`, `deno test` over touched `packages/cli`
tests, lint/fmt over touched roots, the embedded-barrel freshness check, `quality:gate`,
`arch:check`. The runtime `e2e:cli` gate runs **hosted only** under `ci:full`; never locally without
a coordinator lease.

Progress in `.llm/runs/design-route-prod-gate--plan/worklog.md`.
