# Supervisor Identity — claude-harness-profile-rfc-benchmark-shzhgv--scriptc-rfc-bench

Written at run start per `workflow/lane-policy.md` § Supervisor identity. A run dir without this
file is not activated. Other supervisors cross-peek a run by reading this file — it is how a run's
operating identity is discoverable without chat memory.

| Field | Value |
| --- | --- |
| Model | Claude Fable 5 (`claude-fable-5`) |
| Session | Claude Code Remote cloud session `session_013H2FUAx1v6BbP6PgLTNqH5` (https://claude.ai/code/session_013H2FUAx1v6BbP6PgLTNqH5) |
| Host | Claude Code Remote managed container, Linux 6.18.5-fc-v20 x86_64, 4-core Intel Xeon @ 2.10GHz, 15 GiB RAM |
| Checkout | /home/user/netscript |
| Worktree | /home/user/netscript (single checkout; cloud container has no worktree fanout) |
| Branch | claude/harness-profile-rfc-benchmark-shzhgv |
| Baseline | 2dd1a75ef55637816b80e04462cc26fa89631b12 (origin/main == HEAD at run start, 2026-08-19) |
| Run ID | `claude-harness-profile-rfc-benchmark-shzhgv--scriptc-rfc-bench` |

## Run intent

Benchmark a scriptc-compiled native binary task (via the existing `executable` TaskType) against
the `deno` TaskType baseline through the worker plugin's real dispatch path, then author
`rfcs/0000-scriptc-task-runtime-adapter.md` (status Draft) proposing — or rejecting, if the data
says so — a `scriptc` task runtime adapter for Background Processing. Handover prompt:
`/root/.claude/uploads/.../37df715b-handoverpromptscriptctaskruntimebench.md` (content mirrored in
`research.md`).

Profile: **ARCHETYPE-3-runtime-behavior** (benchmark/adapter investigation of
`@netscript/plugin-workers-core` executor behavior) + **SCOPE-docs** overlay (RFC deliverable).
No `packages/`/`plugins/` source changes are in scope; benchmark scaffolding lives in the run dir,
the RFC lives in `rfcs/`.

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` (orchestrator) | Claude · Anthropic · Fable 5 (cloud session) | Supervisor, research, plan, benchmark authorship, RFC authorship |
| `formal_plan_evaluation` | Cloud route: repository automation (`openhands` + `status:plan-eval` label on the draft PR) | PLAN-EVAL if selected |
| `formal_impl_evaluation` | Cloud route: repository automation (draft→ready transition) | Mandatory IMPL-EVAL — this session does not self-certify |

Reference `.llm/harness/workflow/lane-policy.md`; do not copy its complete route table here.

## Recorded lane/eval overrides

- **Orchestrator model override.** Canonical `planning_decisions` route is Opus 5 · high on the
  owner's local surface. This run was launched by the owner as a Claude Code Remote (cloud)
  session served by Fable 5; the launching surface *is* the owner's directive, recorded here per
  lane-policy "Selection and handoff rules". No local WSL/daemon surfaces exist in this container.
- **Implementation lane override (owner-directed).** Tier-D WSL Codex is unreachable from the
  cloud container (no WSL, no daemon, no `wsl.exe`). Benchmark scaffolding is run-dir-only
  throwaway code and the deliverable is an RFC (docs); under the CLAUDE.md
  documentation-authoring exception and the cloud-driven nature of this run, the supervisor
  session authors run-dir benchmark code and the RFC directly. No `packages/`/`plugins/` source is
  modified.
- **Evaluator route.** Native opposite-family local sessions (Codex Sol) are not launchable from
  this container. Per lane-policy, cloud PRs use repository automation for the phase triggers:
  `openhands` + `status:plan-eval` for PLAN-EVAL, draft→ready for IMPL-EVAL. This run records that
  route; the generator session never evaluates its own output.
- Mirrored in `drift.md` (D-1).

## Environment constraints discovered at bootstrap (mirrored in drift.md)

| Tool | Status |
| --- | --- |
| Deno | absent at start — installed during bootstrap (version pinned in worklog manifest) |
| clang | 18.1.3 present (scriptc backend requirement satisfied) |
| Node / npm | v22.22.2 / 10.9.7 (scriptc install path) |
| Docker daemon | **absent** — no containerized queue backends |
| .NET SDK / Aspire CLI | **absent** — `netscript init` scaffold + Aspire AppHost graph not runnable |

Consequence: the handover's Phase 1 (scaffolded `bench-app` + Aspire graph + installed worker
plugin) is not executable in this container. The run instead exercises the worker plugin's real
dispatch machinery (queue → `MultiRuntimeTaskExecutor` → adapter → subprocess → TaskResult)
in-process from the repo's own `@netscript/plugin-workers-core` + queue packages, with the
queue-provider substitution recorded as drift and stated plainly in the RFC's methodology and
limits sections. See `drift.md` D-2 and `research.md` § Feasibility.
