# Supervisor Identity — beta4-cut-A-ai--impl

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex GPT-5 implementation agent |
| Session | WSL Codex implementation session |
| Host | WSL/Linux, `/home/codex/repos/netscript-388-ai` |
| Checkout | `/home/codex/repos/netscript-388-ai` |
| Worktree | `/home/codex/repos/netscript-388-ai` |
| Branch | `feat/ai-flagship-parity-388` |
| Baseline | `origin/main` @ `b3861077` per owner prompt; branch currently clean |
| Run ID | `beta4-cut-A-ai--impl` |

## Lane Table In Force

| Tier | Binding | Role in this run |
| --- | --- | --- |
| A | Fable 5 coordinator, external to this session | Supervisor per owner prompt |
| D | WSL Codex implementation agent | Implements #388 slices on `feat/ai-flagship-parity-388` |
| E | Separate evaluator session when callable | PLAN-EVAL / IMPL-EVAL separation |

## Recorded Lane/Eval Overrides

- The owner prompt delegates implementation to this WSL Codex session and requires harness. A separate
  local sub-agent is used only for the PLAN-EVAL artifact when no OpenHands launch surface is exposed
  directly in this session; this is recorded in `drift.md`.
