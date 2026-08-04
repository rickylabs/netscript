# Supervisor Identity — test-e2e-sqlite-runtime-tier--1158

Written at run start per `workflow/lane-policy.md` § Supervisor identity. A run dir without this
file is not activated. Other supervisors cross-peek a run by reading this file — it is how a run's
operating identity is discoverable without chat memory.

| Field    | Value                                                                                        |
| -------- | -------------------------------------------------------------------------------------------- |
| Model    | Claude Opus 5 (`claude-opus-5`)                                                              |
| Session  | `session_016dewo9Vp8tLwjeivARroL3` — https://claude.ai/code/session_016dewo9Vp8tLwjeivARroL3 |
| Host     | WSL2 Linux 6.18.33.2-microsoft-standard-WSL2, user `codex`                                   |
| Checkout | `/home/codex/repos/netscript`                                                                |
| Worktree | `/home/codex/repos/ns-1158`                                                                  |
| Branch   | `test/e2e-sqlite-runtime-tier-1158`                                                          |
| Baseline | `c6f243da` on `main` (2026-08-04)                                                            |
| Run ID   | `test-e2e-sqlite-runtime-tier--1158`                                                         |

Owner (Eric) is **remote**, steering this session through Remote Control. Reports are kept short and
decision-shaped.

## Routes in force

| Task lane                | Provider / model / effort                                                       | Role in this run                                   |
| ------------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------- |
| `planning_decisions`     | Claude · Anthropic · Opus 5 · this session                                      | Supervisor: research, plan, slice review, sign-off |
| `formal_evaluation`      | Claude · OpenRouter · `qwen/qwen3.7-max` (`claude-openrouter` → `claude-print`) | PLAN-EVAL (separate session), later IMPL-EVAL      |
| `complex_implementation` | Codex · OpenAI · GPT-5.6 Sol · high                                             | S1 (framework `--allow-ffi` fix), S6 (CI policy)   |
| `normal_implementation`  | Codex · OpenAI · GPT-5.6 Sol · medium                                           | S2–S5, S7 (e2e harness slices)                     |
| `review_codex_complex`   | Claude · Anthropic · Fable 5 · medium                                           | Adversarial review paired to the Sol·high slices   |
| `review_codex`           | Claude · Anthropic · Fable 5 · low                                              | Adversarial review paired to the Sol·medium slices |

Reference `.llm/harness/workflow/lane-policy.md`; do not copy its complete route table here.

## Recorded lane/eval overrides

- **Owner-authorized adversarial-check lane (2026-08-04).** In addition to the canonical routes, the
  owner authorized ad-hoc adversarial verification through the agentic toolchain (`claude-print` /
  `opencode`):
  - **`qwen/qwen3.7-max`** — quick checks (already the bound open evaluator preset; no change).
  - **`x-ai/grok-4.5`** (`codex-long-medium-grok-4-5` preset) — **complex** checks where extra
    verification on top of the supervisor _and_ Codex is warranted.

  **Escalation order (owner refinement, 2026-08-04):** reach for a **Claude Opus 5 sub-agent** first
  — dispatched _by the supervisor_, in-plan, no OpenRouter spend, and for Codex-authored work it is
  the canonical opposite-family reviewer under the `review_codex_*` ladder. Only escalate to the
  OpenRouter/OpenCode lanes above when a sub-agent is genuinely not enough. Two constraints survive
  the refinement: a sub-agent is **never** the formal PLAN-EVAL/IMPL-EVAL evaluator (that stays the
  open-model Qwen preset), and it must be dispatched by the **supervisor** — an implementation lane
  dispatching its own reviewer is the D-7 breach, not a review.

  This is an **explicit** owner approval, so it does not violate `lane-policy.md` invariant 4 (no
  _implicit_ paid or higher-effort escalation). It does **not** widen the **formal** PLAN-EVAL /
  IMPL-EVAL lane, which stays open-models-only on the bound Qwen preset. Owner's framing: "in
  principle you two should be enough — I let you judge." Judgement recorded per use in `drift.md`.

- **Supervisor model is Opus 5, not the canonical Fable 5 `planning_decisions` primary.** The owner
  started this session on Opus 5 through Remote Control after a GitHub Copilot cloud agent (Grok
  4.5) failed to produce anything on disk. Authorization: owner directive (session start). Mirrored
  in `drift.md` as D-1.
- No other overrides. The evaluator lane, the implementation lane (Tier-D WSL Codex through
  `.llm/tools/agentic/`), and the slice review gate are unchanged from `lane-policy.md`.
