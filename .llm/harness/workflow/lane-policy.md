# Lane Policy — Tiered Agent Model

Single source of truth for the harness agent-lane surface and its model bindings. Every harness run
assigns work to lanes from the table below; deviations are configuration, not doctrine, and are
recorded in the run dir's `supervisor.md` and `drift.md`.

## Tiers (model bindings)

| Tier | Agent (model binding) | Use for | Never for |
| --- | --- | --- | --- |
| A | **Fable 5 feature supervisor** | decisions, orchestration, briefs, run-dir upkeep, the GitHub surface, design authoring, per-slice review + sign-off commits | heavy implementation; self-certification; Workflow fan-out (too expensive) |
| B | **Opus 4.8 sub-agents** | deep research, analysis, reporting, doc/doctrine authoring (per the CLAUDE.md docs-authoring exception) | deciding scope; certifying their own output |
| C | **Sonnet-5-high dynamic Workflows** (steps may escalate to Opus where genuine intelligence is needed) | batch work across the codebase, parallel deep search, parallel refactor / mechanical edits | any run whose `workflow.js` is not persisted + committed in the run dir first; routing stages to Fable 5 |
| D | **WSL Codex GPT-5.5-high** (daemon-attached) | framework / plugin / harness-tool SOURCE edits, very long refactors, deterministic coding, housekeeping, side quests, parallel verification | detached / headless runs where supervision is expected |
| E | **OpenHands evaluator** (separate session) | PLAN-EVAL (minimax-M3) and IMPL-EVAL (qwen-3.7-max) per-domain verdicts | generation of any kind |

Model routing is fixed for the evaluator lane: **PLAN-EVAL runs minimax-M3, IMPL-EVAL runs
qwen-3.7-max**, each in a session separate from the generator, with the two-failure eval loop before
escalation. Never route Workflow (Tier C) stages to Fable 5 — Fable is the supervisor, not a
fan-out worker.

## Invariants (exactly two — everything else is configuration)

Only two rules are hard. Lane assignments, model elevation within a lane, and per-slice routing are
all configurable per run and may be overridden by owner directive, provided the override is recorded
in the run dir's `supervisor.md` and `drift.md`.

1. **Generator-session ≠ evaluator-session (the #306 invariant).** The session that generates a
   plan or an implementation may never be the session that evaluates it. This retires the old
   "Claude never implements / OpenHands is the only lane" dogma: which model implements is
   configuration, but the generator and the evaluator are always distinct sessions.

2. **Slice review gate (Amendment A1) — no implementation lane self-certifies.** After an
   implementation sub-agent lands a slice and its automated gates pass, the **Tier-A supervisor
   performs a substantive intelligence review of the slice content** — correctness, coherence with
   already-landed slices, doctrine-fit, and gaps / overreach — **before the commit that signs it
   off**. The sign-off commit is the supervisor's, not the implementer's. This gate is
   lane-agnostic and holds for **every** implementation tier with no exception:
   - **Tier B (Opus 4.8 sub-agents)** — the supervisor reviews the sub-agent's authored content
     before signing it off; a sub-agent's own "done" is not a sign-off.
   - **Tier C (Workflow-generated slices)** — the supervisor reviews the Workflow output (and the
     committed `workflow.js`) before signing it off; a green Workflow run is not a sign-off.
   - **Tier D (WSL Codex slices)** — the supervisor reviews the Codex slice before signing it off;
     daemon-green gates are not a sign-off.

   The concrete run-loop placement of this step (between automated gates and the sign-off commit)
   lives in `workflow/run-loop.md`.

## Selection rules

1. **Source-code slices** (`packages/`, `plugins/`, `.llm/tools` TypeScript) → **Tier D**,
   daemon-attached. Drive via `.llm/tools/agentic/` (`launch-codex-slice.ts`; steer with
   `codex-resume.ts`; watch with `codex-watch.ts` git + turn modes). Record per slice in
   `worklog.md`: worktree path, thread id, steering command.
2. **Batch / parallel mechanical work spanning many files** → **Tier C** Workflow. **HARD RULE:**
   copy the generated `workflow.js` into `<run-dir>/workflows/<slice>-workflow.js` and commit it
   **before** executing the workflow. A workflow whose script is not committed in the run dir does
   not run.
3. **Research / analysis / synthesis and doc prose** → **Tier B**. The sub-agent reports to the
   supervisor; the supervisor decides scope and signs off.
4. **Tier-D interface:** skills + `.llm/tools/agentic/` are the ONLY interface for driving Codex —
   never ad-hoc `wsl.exe`. Every brief (Workflow prompt, Codex brief, OpenHands trigger, sub-agent
   prompt) starts with `use harness` and carries a `## SKILL` chapter naming each relevant skill.
5. **Model routing:** never route Workflow stages to Fable 5; Fable is the Tier-A supervisor.

## Supervisor identity

Every run dir carries `supervisor.md`, written at run start, recording the supervising agent's:
model, session id / URL, host machine, checkout + worktree disk paths, branch, baseline SHA, and
the lane table in force for the run (including any recorded lane override). Other supervisors
cross-peek a run by reading this file — it is how a run's operating identity is discoverable without
chat memory. A run dir without `supervisor.md` is not activated.
