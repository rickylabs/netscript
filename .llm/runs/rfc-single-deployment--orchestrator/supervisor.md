# Supervisor Identity — rfc-single-deployment--orchestrator

Written at run start per `workflow/lane-policy.md` § Supervisor identity. A run dir without this
file is not activated. Other supervisors cross-peek a run by reading this file — it is how a run's
operating identity is discoverable without chat memory.

| Field | Value |
| --- | --- |
| Model | Claude Fable 5 (`claude-fable-5`), effort **high** |
| Session | `7f1fada7-805f-46cb-8ac4-5eb201bdc105` |
| Host | WSL2 (Linux 6.18.33.2-microsoft-standard), user `codex` |
| Checkout | `/home/codex/repos/netscript-beta10-cli` |
| Worktree | same as checkout (planning-only run — no code changes, no dedicated worktree) |
| Branch | `feat/beta10-cli-integration` |
| Baseline | `f391190f` @ `feat/beta10-cli-integration`, 2026-07-17 |
| Run ID | `rfc-single-deployment--orchestrator` |

**Charter:** `.llm/runs/rfc-single-deployment--orchestrator/kickoff.md` (owner-ratified
2026-07-17) — RFC for single-deployment (issue #820). Seed/RFC-shaped run: deliverable is an RFC
design + draft board adjustments, not code and not filed issues.

**POC study target:** `/home/codex/repos/eis-chat` @ `main` (`aeaf2df` = PR #150).

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` (orchestrator/generator) | Claude · Anthropic · Fable 5 · **high** | This session: forensics synthesis, gap analysis, RFC design authoring |
| `review_claude` (PLAN-EVAL adversarial evaluator) | Codex · OpenAI · GPT-5.6 Sol · **max** | Separate sessions via the agentic app-server client (drift.md entry 4): cycle 1 `019f6fa1-b09a-7542-a582-8cd60055eaca` → FAIL_PLAN (rev 2); cycle 2 `019f6fb5-8bf9-7ed0-9f8c-0568827a799a` → FAIL_PLAN (loop limit → `escalation.md`; **owner authorized continuation in-session 2026-07-17** — drift.md entry 5); cycle 3 `019f6fd5-eb50-7720-aa56-ba37e473cfd4` → FAIL_PLAN (rev 4); cycle 4 `019f6feb-5c94-7181-a30c-e2bc9a9a39a3` → FAIL_PLAN (rev 5); cycle 5 `019f7006-462d-7f32-b04d-67aec3f336e8` → FAIL_PLAN (rev 6); cycle 6 `019f701c-c73d-7671-bb67-75b37e747f34` → FAIL_PLAN (rev 7); cycle 7 `019f7034-bb62-7e61-82c5-4816ced88e95` → FAIL_PLAN (rev 8); cycle 8 `019f7052-f1f5-7261-8fec-10bd224a8488` → FAIL_PLAN (rev 9); cycle 9 `019f7078-cb51-7a03-af49-ee88858c5301` → FAIL_PLAN with 6/8 boxes PASS (`closure.md`). **Post-closure: owner re-opened for rev 10 (classification residual folded); cycle 10 is OWNER-LAUNCHED (recipe in context-pack.md) — the generator launches no further cycles. The #820 post was never made; zero board mutations across the run.** |
| Sub-research forensics | Codex · OpenAI · GPT-5.6 Sol · low/medium | Targeted forensics fan-out only; **do not swarm Fable** |

Reference `.llm/harness/workflow/lane-policy.md`; do not copy its complete route table here.

## Recorded lane/eval overrides

Kickoff-mandated effort raises over lane-policy defaults (authorization: kickoff.md,
owner-ratified 2026-07-17; mirrored in `drift.md`):

- Orchestrator lane runs Fable 5 **high** (lane-policy default for `planning_decisions` is low).
- PLAN-EVAL runs Sol **max** (lane-policy default for `review_claude` is xhigh).

Run-shape note: kickoff scopes deliverables to run-dir artifacts + one RFC comment on #820 after
PLAN-EVAL PASS. No dedicated seed branch/draft PR was requested; the run dir under
`feat/beta10-cli-integration` is the supervision surface (beta-10 orchestrator + owner resume this
session by id). Board mutations beyond the #820 comment are hard-stopped; board adjustments are
drafted as files only.

## Stop-lines (from kickoff, hard)

- NO implementation. NO framework code.
- NO filing/closing/re-milestoning of issues other than commenting on #820 — board changes stay
  DRAFTS until owner ratification (seed-run doctrine).
- NO merge/publish of anything.
- Public-repo hygiene: no eis-chat internal process details beyond its public repo; eis-chat
  PR/issue numbers may be referenced in the #820 comment (same owner).
