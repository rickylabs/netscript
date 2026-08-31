# Supervisor Identity — fix-sdk-browser-full-key-normalization--impl

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex, GPT-5 family (exact runtime model id is not exposed to the session) |
| Session | Current `/root` Codex session `01a05611-ee74-7ff2-9234-8e00691a3523` |
| Host | `ai-agents` / Linux / `agent` |
| Checkout | `/home/agent/projects/netscript` |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1824` |
| Branch | `fix/sdk-browser-full-key-normalization` |
| Baseline | `dea44991120a2c5da96a89df0f68d69c455c035e` (`origin/main`, 2026-08-31) |
| Run ID | `fix-sdk-browser-full-key-normalization--impl` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` | Current owner-provided Codex session; exact model/effort not exposed | Harness supervisor and sign-off |
| `light_implementation` | Current owner-provided Codex session; exact model/effort not exposed | Two bounded source/test slices |
| `review_codex_light` | Native Claude / Opus 5 / high requested | Independent per-slice substantive review |
| `formal_impl_evaluation` | Native Claude / Fable 5 / medium requested | Separate-session final IMPL-EVAL |

## Recorded lane/eval overrides

- The owner invoked this Codex session directly, so the canonical Opus supervisor identity and the
  exact Codex Sol/Luna implementation identity cannot be selected or attested here. The run keeps
  the opposite-family review and final-evaluator invariants. This is mirrored in `drift.md`.
