# Topic C — Tutorials: complete ground-up rewrite

**Kind:** docs · **Milestone:** beta.7 (docs cut) · **Epic:** under `#232` · **Status:** new work (complete rewrite)

## §1 Owner's original brief (verbatim intent — PRESERVE, DO NOT DILUTE)

- **Rewrite the 4 tutorials from scratch** — **exercise-first, then doc** (the reader builds the
  thing first; prose follows the build).
- Follow the **eis-chat approach** (real project, real seams, the way the eis-chat docs are built).
- **Medusa-inspired writing** (the tone/structure quality bar).
- **Plus a new, minimal eis-chat tutorial** (a smaller end-to-end eis-chat-equivalent build).

## §2 Ratified decisions for this topic

- Ships on a **dedicated docs release cut at beta.7** (with Topic D), **not** a beta.1 gate (D3).
- The tutorials are **COMPLETE ground-up rewrites** — the current ones "**don't tell a story, don't
  cover a real project use case**." Rewrite around a **concrete real project** (eis-chat).
- Authoring lane: **Opus docs workflow** allowed (harness doc-authoring exception), **OpenHands
  validates per-domain** (generator ≠ certifier). Sonnet 5 only for trivial cleanup. Never Fable.

## §3 eis-chat reference (see `specs/02`)

- `docs/PRODUCT.md` = the real story (context-accumulator; Project>Channel>Session; VIF→CSB
  migration; PROSCO/Prolabel diagnosis; MCP grounding; charts). The concrete use-case — **no
  invented toy example needed**.
- `docs/ARCHITECTURE.md`, `docs/PHASE-1..7-*.md`, `docs/HANDOVER.md`, `docs/assets/01..05*.png` —
  structure, build order, and screenshots to anchor the exercise-first flow.
- eis-chat's own docs are also the **writing-quality reference** alongside Medusa.

## §4 Delegated to Fable

- Which real project backs each of the 4 rewrites (all eis-chat-derived, or a spread of real seams),
  and the exact shape of the "minimal eis-chat tutorial." Propose, record rationale.

## §5 Dependencies / constraints

- **Locked positioning & voice** (`specs/01`): AI-agent build-efficiency framing; **ban
  honesty/candor framing**; no throughput/unshipped claims.
- Must land **docs-only** (no framework source churn in the docs cut). Any framework change a
  tutorial exposes is a separate WSL Codex slice.
- Lume/Vento build landmines apply (comp-tag syntax, `function` keyword, `deno fmt` reflow) — pre-
  flight every page; verify via build + check:links.

## §6 What B (Sonnet 5 workflow) must research for this topic

- Current tutorial set: exact inventory + why each "doesn't tell a story" (concrete gap list).
  `analysis/C-tutorials/`.
- Medusa tutorial IA/tone teardown + `docs/site/_plan/research/competitors/medusa.md`. `matrix/` + `research/C-tutorials/`.
- eis-chat build sequence mapped to a teachable exercise-first arc. `analysis/`.

## §7 What Fable must produce for this topic

- Under `#232`: sub-issues for the 4 rewrites + the minimal eis-chat tutorial, each with an
  exercise-first outline, the backing real project, acceptance criteria, beta.7 milestone.
- Per-tutorial Opus-workflow authoring brief + OpenHands validation brief.
