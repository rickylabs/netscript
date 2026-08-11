# Supervisor Identity — plan-devtools-contribution--seed

Written at run start per `workflow/lane-policy.md` § Supervisor identity. A run dir without this
file is not activated. Other supervisors cross-peek a run by reading this file — it is how a run's
operating identity is discoverable without chat memory.

| Field | Value |
| --- | --- |
| Model | Claude Opus 5 (`claude-opus-5`), effort **high** |
| Session | `session_01DChBXWYP9LStvjQztUJV5b` — https://claude.ai/code/session_01DChBXWYP9LStvjQztUJV5b (native Claude Code, bypass permissions, Remote Control enabled on this session) |
| Host | WSL2 (Linux 6.18.33.2-microsoft-standard-WSL2), user `codex` |
| Checkout | `/home/codex/repos/netscript-547-lffix` (main checkout) |
| Worktree | `/home/codex/repos/ns-rfc-devtools-contribution` |
| Branch | `plan/devtools-contribution` |
| Baseline | `2256a67bf` — `docs(home): complete the capability outcome story (#1442)`, `origin/main` verified by `git fetch` on 2026-08-11 |
| Run ID | `plan-devtools-contribution--seed` |
| Run shape | Seed run (`workflow/seed-run.md`), stages A–I, **planning-only** |
| Profile | `SCOPE-docs.md` overlay + `SCOPE-frontend.md` overlay; archetypes described (not built): ARCHETYPE-5 (plugin) and the host package archetype for the proposed DevTools surfaces |

## Charter

Tier-A planning orchestrator for the **NetScript DevTools Contribution Architecture RFC**. Deliverable
is a canonical RFC under `docs/architecture/rfc/` plus a full seed-run planning corpus, design packs,
supersession map, draft filing manifest, and an owner decision brief. **No framework/product source
implementation. No board mutation before owner ratification in-turn.**

Charter source: `.llm/devtools-rfc-orchestrator-brief.md` (committed with the bootstrap).

## Routes in force

Reference `.llm/harness/workflow/lane-policy.md`; the complete route table is not copied here.

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` | Anthropic · Claude **Opus 5** · high | This supervisor session: bootstrap, synthesis, plan lock, RFC authoring, triage, sign-off commits |
| `deep_analysis` | Anthropic · Claude **Fable 5** · medium | Stage-D deep-dive design packs — complex architecture/technical decisions, one sub-agent per topic |
| `claude_workflow` | Anthropic · Claude **Opus 5** · low | Stage-B parallel discovery/synthesis fan-out only, and only with the generated `workflow.js` committed under `<run-dir>/workflows/` **before** it executes |
| ~~`major_ui_ux_design` — GLM 5.2 xhigh~~ | **SUPERSEDED — lane unlaunchable** (drift D-10) | The `claude-design-glm-5-2` preset exists in policy but no launcher can execute it; `agentic:claude-openrouter` applies an open-**evaluator** guard that correctly excludes GLM |
| **Stage-D2 adversarial design pass** *(owner override, 2026-08-11)* | **OpenCode · OpenRouter · Qwen 3.8 Max (`qwen/qwen3.8-max`) · variant `max`** | **Explicit owner-approved route override.** Replaces GLM 5.2 **for Stage D2 only**. Read-only evaluator surface, own worktree, findings-only — **no edits by the evaluator**. Requested vs observed identity recorded in `drift.md` D-15 |
| `adversarial_design_eval` | OpenCode · OpenRouter · **Kimi K3** (`openrouter/moonshotai/kimi-k3`) · variant `high` | **ACTIVE — owner-directed lane split (2026-08-11, drift D-16).** Owns the **pure UI/UX** review: information architecture, state matrix, `DevToolsUiNode` vocabulary, contributor DX, hierarchy/density. Read-only surface, findings-only. **No visual artifacts exist** in a planning-only run, so its vision capability is unused and it reviews IA-as-text — stated rather than implied |
| Stage-F adversarial reviewer | Anthropic · Claude **Sonnet 5** · high — unoriented, separate session (**bound 2026-08-11**, see below) | Severity-tagged findings only; supervisor triages and commits fixes |
| `formal_plan_evaluation` | Codex · OpenAI · **GPT-5.6 Sol** · high (fresh daemon-attached WSL session, own worktree) | Formal PLAN-EVAL of record against an immutable commit, per `evaluator/plan-protocol.md` + `gates/plan-gate.md` |
| `formal_impl_evaluation` | — | **N/A.** This run produces no implementation. Recorded rather than skipped silently; the docs/RFC changeset instead takes the docs accuracy/link/format gates plus the opposite-family PLAN-EVAL above |

### Route prohibitions in force for this run

- **No OpenHands.** Cloud agent lanes are owner-paused (`lane-policy.md`, 2026-08-06) and the charter
  independently forbids them here.
- **OpenRouter is limited** to the stage-D2 design lanes and a genuinely authorized fallback/third
  opinion. As of the owner override (D-15/D-16) those lanes are **Qwen 3.8 Max** (architecture) and
  **Kimi K3** (pure UI/UX), both via OpenCode. Any other OpenRouter use is an override that must be
  recorded in `drift.md` **before** it happens.
- **No stage-D2 reviewer is ever the formal evaluator.** Qwen and Kimi produce advisory design
  evidence only; the Codex GPT-5.6 Sol PLAN-EVAL is the sole verdict of record. A `PASS`-shaped
  statement from a design lane carries no gate authority.

## Mutation boundary (planning-only)

| Surface | Writable in this run? |
| --- | --- |
| Branch `plan/devtools-contribution` + its commits | **Yes** |
| The run's own draft PR: body, phase comments, PR labels, PR milestone | **Yes** |
| `docs/architecture/rfc/**` (new RFC) and `.llm/runs/plan-devtools-contribution--seed/**` | **Yes** |
| Framework/product source (`packages/**`, `plugins/**`, `apps/**`) | **No — never** |
| GitHub issues, epics, milestones, repo label set, other PRs | **No — until the owner ratifies the decision brief in-turn (stage H)** |
| Merging this RFC PR | **No — the run never merges itself** |

## Recorded lane/eval overrides

- **IMPL-EVAL = N/A by run shape**, not by owner waiver: the run commits no implementation. The
  substitute assurance is (a) the formal Codex Sol high PLAN-EVAL at stage G and (b) the docs gate
  set on the RFC changeset. Mirrored in `drift.md`.
- **Stage-F reviewer bound to Claude Sonnet 5 · high.** `seed-run.md` § Stage F fixes three
  properties — unoriented, separate session, and a model **distinct from every lane that authored
  the plan** — and leaves the tier as per-run configuration. The authoring lanes here are **Opus 5**
  (supervisor spine, synthesis, plan lock) and **Fable 5** (stage-D packs and stage-E sections).
  Sonnet 5 is distinct from both. *(An earlier version of this note also listed GLM 5.2 as an
  authoring lane; **GLM never ran** — the lane was unlaunchable, D-10 — so it authored nothing.)*

  Codex GPT-5.6 Sol was considered and **rejected for stage F**: it is the stage-G formal evaluator,
  and spending it twice would collapse the review chain's diversity — the opposite-family look is
  worth more as the *verdict of record* than as a preliminary pass. The resulting chain is
  Opus → Fable → **Sonnet** → **Codex Sol**, with no model reviewing its own output — plus the
  advisory stage-D2 pair, **Qwen 3.8 Max** and **Kimi K3**, neither of which authored anything.

  OpenRouter was **not** used here: `lane-policy.md` and the charter confine it to the design lane
  plus an authorized fallback/third opinion, and a routine stage-F review is neither.
- **`major_ui_ux_*` GLM lanes are marked dormant** in `lane-policy.md` while the Dev Dashboard is
  paused (epic #400 → `0.0.1-beta.13`). This run reactivated the lane for its charter-mandated design
  pass. Authorization: the orchestrator brief's explicit instruction. Mirrored in `drift.md` D-1.
- **OWNER ROUTE OVERRIDE, 2026-08-11 — Stage D2 runs on Qwen 3.8 Max, not GLM 5.2.** The owner
  reviewed the D-10 escalation and ruled: **do not waive the adversarial design pass**; replace GLM
  5.2 with **`qwen/qwen3.8-max` at `max` reasoning**, launched through the repository agentic
  toolchain on a **fresh read-only evaluator surface** — natively via **OpenCode/OpenRouter**,
  because `agentic:claude-openrouter`'s open-evaluator guard does not admit Qwen.
  - **Scope of the override: Stage D2 only.** It does **not** touch the formal evaluator lane. The
    Codex GPT-5.6 Sol PLAN-EVAL remains the separate verdict of record, and the Qwen pass is
    advisory design evidence, never a Plan-Gate verdict.
  - The evaluator is **findings-only and makes no edits**; the supervisor adjudicates and amends.
  - Prompt, output, and receipt are persisted under this run.
  - Requested vs observed identity recorded in `drift.md` **D-15**.

## Hard invariants acknowledged

1. Generator session ≠ evaluator session. This session never evaluates its own plan.
2. No lane self-certifies. Every sub-agent/workflow output is substantively reviewed by this
   supervisor before its sign-off commit.
3. Stage-B Tier-C workflows commit `workflow.js` before executing.
4. Every claim in the corpus is cited (file path + line, `deno doc` surface, saved fetched artifact,
   or external URL). Uncited load-bearing claims are a legitimate PLAN-EVAL failure.
5. Stage G is a hard stop. No board mutation before `plan-eval.md` = `PASS` **and** owner ratification.
