# Drift Log: typed SDK client contribution RFC

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-08 — Active desktop thread is not registered in runtime-controller state

- **What:** `deno task agentic:runtime status --worktree /home/codex/repos/ns-rfc-sdk-client`
  returned `MISSING_IDENTITY`, while the launch-generated run artifact identifies this live thread,
  rollout, worktree, requested/observed route, and full-access policy.
- **Source:** `.llm/tools/agentic/runtime`; `codex-thread-ids.md`; current session context.
- **Expected:** A daemon-attached session would also be discoverable by the desired-state runtime
  controller.
- **Actual:** The thread is mobile/desktop launch-attached but not present in controller session
  state (`sessions: 0`).
- **Severity:** minor.
- **Action:** accept for this docs-only generator run. Do not repair or relaunch: the owner forbids
  a rival session and the concrete launch identity is already recorded.
- **Evidence:** runtime command exit 3 with `MISSING_IDENTITY`; thread
  `019fe242-2bd9-7ff3-8044-bd9d09585397`; rollout path in `codex-thread-ids.md`.

## 2026-08-08 — Owner-directed review route differs from default formal evaluator lane

- **What:** The brief reserves cross-RFC review for the existing Claude Fable 5 session and a final
  Qwen adversarial pass, and forbids this generator from triggering PLAN-EVAL/IMPL-EVAL.
- **Source:** owner brief.
- **Expected:** Default local formal PLAN-EVAL uses the open-model route in `lane-policy.md`.
- **Actual:** Review orchestration and route identity are explicitly delegated to the root
  orchestrator.
- **Severity:** significant process override, owner-authorized.
- **Action:** stop at `status:plan-eval`, provide exact reviewer instructions, and let the root
  orchestrator record observed evaluator identities/verdicts.
- **Evidence:** `implement.md` § Required output 5; `supervisor.md` routes table.
