# Supervisor Identity — rfc-frontend-contribution-v2--rfc

Written at run start per `workflow/lane-policy.md` § Supervisor identity. A run dir without this
file is not activated. Other supervisors cross-peek a run by reading this file — it is how a run's
operating identity is discoverable without chat memory.

| Field | Value |
| --- | --- |
| Model | Delegated Unified Frontend RFC Author (`self` subagent under coordinator `f4a0a476-52b4-4a01-b49b-770a059482e0`) |
| Session | `5520f29f-da2d-4cc9-a6d9-045af1cecea9` |
| Host | Linux worktree container (user `agent`, non-interactive) |
| Checkout | `/home/agent/.t3/userdata/providers/antigravity/ac0a3dfd6dddb20962cecff6ee5fe65e19d3923be20e52c5ab52ff877f7e4c32/antigravity-acp/worktrees/f4a0a476-52b4-4a01-b49b-770a059482e0/subagent-Unified-Frontend-RFC-Author-self-6d6c2b5d-repo` |
| Worktree | Same worktree root (`subagent-Unified-Frontend-RFC-Author-self-6d6c2b5d-repo`) |
| Branch | `docs/rfc-frontend-contribution-v2` |
| Baseline | `f54542169` (`origin/main`, rebased cleanly from initial worktree `af5107b8d`, 2026-11-25) |
| Run ID | `rfc-frontend-contribution-v2--rfc` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `rfc_author` (current run) | Antigravity Google / parent-inherited `self` | Unified RFC authoring, Wave-0 probe packaging & re-verification, Draft PR opening |
| `implementation` (`0.0.10` W1–W3 builders, planned) | `antigravity/gemini-4-neon` / `xhigh` | Neon builders on Antigravity Google plan for acyclic W1/W2/W3 PRs |
| `plan_eval` (RFC adversarial review, queued) | Claude / `Fable 5.2` | Scheduled Friday 23:30 UTC adversarial RFC evaluation after Claude sub reset |
| `impl_eval` (PR review Pass 1, planned) | `Opus 5.5` / `xhigh` | Pass-1 PR implementation review (independent vendor/session from Neon builders) |
| `impl_eval` (PR review Pass 2, planned) | `Hydrogen` / `xhigh` | Pass-2 PR implementation review |

Reference [`.llm/harness/workflow/lane-policy.md`](../../harness/workflow/lane-policy.md); do not copy its complete route table here.

## Recorded lane/eval overrides

- **Zero Claude spend during RFC authoring:** Strictly no `claude` invocations or subagent spawns during RFC drafting; scheduled adversarial RFC evaluation (`Fable 5.2`) is explicitly deferred to Friday 23:30 after the Claude subscription reset.
- **Owner-directed builder & evaluator stack for `0.0.10`:** Implementation uses Neon builders (`antigravity/gemini-4-neon` at `xhigh`) instead of Codex defaults (`zero Codex` policy for this initiative), with adversarial RFC review by `Fable 5.2` and two-pass PR review by `Opus 5.5` (`xhigh`) and `Hydrogen` (`xhigh`). Preserves `lane-policy.md` § Independence and session rules (different vendor families and separate sessions between builders and evaluators). Mirrored in [`drift.md`](./drift.md) and [`worklog.md`](./worklog.md).
