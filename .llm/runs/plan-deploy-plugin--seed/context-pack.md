# Context pack — plan-deploy-plugin--seed

Resumable summary. Read `supervisor.md` first (identity, pipeline, overrides), then this.

## State (2026-07-18)

**Generator stage COMPLETE** (`worklog.md` ends `STAGE-COMPLETE: generator`). Branch
`plan/deploy-plugin` (worktree `/home/codex/repos/wt-deploy-plugin-seed`), baseline `290c68ef`,
all work pushed with explicit refspec. No PR, no issue/label/milestone mutation (kickoff
stop-lines). Commits: `d7879e68` bootstrap → `fed30572` research corpus → `bcec7e53` DP-0..2 →
`a178d31a` DP-3..5 → `96b6c47b` DP-6..8 → (closing commit) plan+worklog+context-pack.

## What this run is

Clean seed run for the **deploy plugin family** concept the owner ratified 2026-07-18
(supersedes #824's unified-runtime board; prior run `plan-unified-runtime--seed` in wt-g8-seed is
the evidence base, distilled into `research/prior-run-distillation.md`). Modified pipeline per
`kickoff.md`: this generator → supervisor-dispatched Sol-xhigh constructive adversarial → Kimi-K3
doc story → generator integrates. Formal PLAN-EVAL/ratification later, supervisor-decided.

## Artifact map

- `research/` — six cited corpus files + `research.md` synthesis (drift candidates D-C1…4).
- `design/canonical/DP-0…DP-8` — concept/goal frame; family graph (R-GRAPH-1…5); deploy-core
  (7-op port, emitter split, capability compiler, binding transport); adapter cards + shared
  conformance suite; plugin+host design (3 host extensions); selective-wrapping map; migration
  map M-1…18; contribution matrix; scaffold stories 0–4.
- `plan.md` — LD-1…12 locked, OF-1…8 owner forks, wave train W1–W5, 21-child board sketch, risks,
  gates, debt, deferred scope, downstream attack list (§10).

## Core design in one paragraph

Auth-parity family: thin `plugins/deploy` + `@netscript/plugin-deploy-core` (extraction of the
CLI kernel's existing 7-op port/registry/conventions — closes `DEPLOY-ARCHETYPE-7-CORE-SEED`,
flips F-DEPLOY-1/2 to gated) + A2 adapters (`deploy-aspire`, `deploy-baremetal`, `deploy-deno`
extracted; `deploy-container` with fly/koyeb/sevalla/coolify/dokploy subpaths new; cloudflare/
vercel/aws probe-gated). Deploy owns placement/artifacts/lifecycle; leaves own semantics
(bindings transported by name — the anti-god-object cut). Capability manifests + build-time
rejection make agnosticism honest; provider-optimized scaffolds (Stories 1–4) make
provider-first credible. Goal frame = three tiers (Deno-native process / Web-standard isolate /
Node-compat declared). Nitro: reference-only with an L-1-gated re-entry. Waves: W1 core, W2
adapters, W3 pluginization (needs the three `@netscript/plugin` host extensions), W4 container
path, W5 probe-gated clouds.

## For the resumed generator (integration stage)

1. Read Sol findings + Kimi doc-story outputs (locations per supervisor dispatch).
2. Triage findings with per-finding dispositions (seed-run stage-F discipline); amend DP docs in
   place; extend `drift.md`.
3. Author full issue bodies from the plan §5 sketch (board-parity template: `Part of #EPIC`,
   anti-scope boundary, `- [ ] gate:` predicates, `Dependencies:`/`Delivery shape:`) + filing
   manifest for stage H. Still drafts-only until owner ratifies.
4. Owner forks OF-1…OF-8 go in the decision brief; do not resolve them yourself.

## Standing constraints

Stop-lines verbatim in `kickoff.md` (drafts only; no product code; no self-dispatched stages;
push `HEAD:plan/deploy-plugin` only; HARD STOPs on release/milestone actions). Evaluator lanes
are open-models-only; generator ≠ evaluator.
