# Phase Registry — orchestrator-1443-plugin-ai-next-canary--supervisor

One PR, one issue (#1443). Phase groups below are capability-scoped slices of that single PR, each
delegated to a daemon-attached Codex session and reviewed by the Tier-A supervisor before sign-off.

| Group | Scope | Slices | Lane | Status |
| --- | --- | --- | --- | --- |
| G0 · Research & Plan | reproduce, mechanize, lock decisions | — | Opus 5 high (supervisor) | done |
| G1 · Plan-Gate | PLAN-EVAL against `gates/plan-gate.md` | — | Codex Sol high (`formal_plan_evaluation`) | pending |
| G2 · Protocol & host rule | manifest optionality; no synthesized service entrypoint | 1, 2 | Codex Sol high (`complex_implementation`) | blocked on G1 |
| G3 · Plugin truth & emitters | AI manifest; `ai/mod.ts`; `ai/deno.json` + preact/JSX | 3, 4, 5 | Codex Sol medium (`normal_implementation`) | blocked on G2 |
| G4 · Markdown surface | registry-sourced `ai/components/ui/markdown.tsx` | 6 | Codex Sol medium (`normal_implementation`) | blocked on G3 |
| G5 · Doctor invariants | configured-module + service-entrypoint checks | 7 | Codex Sol low (`light_implementation`) | blocked on G2 |
| G6 · Canonical E2E | runtime-schemas, `ai/**` check, appsettings + doctor-negative gates | 8 | Codex Sol medium (`normal_implementation`) | blocked on G3, G5 |
| G7 · Proof & release handoff | expensive E2E, leak-check, IMPL-EVAL, merge, canary handoff | 9 | Opus 5 high + Fable 5 medium (IMPL-EVAL) | blocked on G6 |

Effort selection follows `lane-policy.md` §"Sol effort selection": `high` only for genuinely complex
slices (G2 changes a published protocol and an AppHost-visible host rule), `medium` where mid-slice
research is likely, `low` for the mechanical doctor slice.

Never launch two writers in this worktree at once. Each group records its Codex thread id, cwd,
daemon route, and steering command in `worklog.md` before the supervisor waits on it.

## Escalations

None. `escalations/` is created on first use.
