---
name: claude-manager
description: >
  Find, launch, steer, monitor, and repair Claude Code supervisor sessions for NetScript,
  including Zed Claude ACP sessions, native Remote Control with bounded OpenRouter delegation,
  OpenHands evaluator handoffs, and WSL-hosted Codex implementation agents.
---

# Claude Manager

Use this skill when the task involves Claude Code session orchestration rather than package code.
Claude is the supervisor. WSL Codex implements harness slices that must be visible from Codex
Desktop/mobile. Evaluation runs on the evaluator lane in `.llm/harness/workflow/lane-policy.md`:
normally a fresh native opposite-family Claude/Codex session; OpenRouter is reserved for a third
opinion or native-family quota exhaustion, and OpenHands for explicitly cloud-driven runs.

## Workflow

Native Claude sessions authenticated through the Anthropic client are the mobile-visible operator
surface. Claude sessions launched through `agentic:claude-openrouter-gateway` or another custom gateway are
separate inference-only provider-runner sessions: they may be forked, supervised, and recorded, but
must never be described as Remote Control or mobile-visible sessions. Claude Code 2.1.196 and newer
enforce this boundary by rejecting Remote Control when `ANTHROPIC_BASE_URL` is custom; an
interactive process staying alive is not attachment proof.

`agentic:claude-hybrid` keeps that boundary intact. It starts a native, Anthropic-authenticated
Remote Control supervisor and gives it the local `netscript-hybrid` MCP tool `delegate_openrouter`.
A tool call delegates one bounded task to OpenCode/OpenRouter; the approved default is
`z-ai/glm-5.3-flash` at `max`, with `qwen/qwen3.8-flash` also allowed. This is not transparent model substitution: Claude must still
have enough native quota to take a turn and call the tool. At zero Claude quota, use the
non-Remote-Control OpenRouter surface or OpenCode directly.

1. Re-baseline the worktree and branch first.
2. If the user says `use harness`, read `.agents/skills/netscript-harness/SKILL.md`. If a native
   Claude `/netscript-harness` skill is unavailable, load the repo file directly.
3. Use `claude --bg` for non-blocking launches. Use `--permission-mode bypassPermissions` in the
   trusted agentic environment unless the user asks for supervised permissions.
4. Prefer native Claude status surfaces before custom polling:
   - `claude agents --json` for running subagents.
   - `claude remote-control --spawn=worktree` for mobile/web steering of local Claude sessions.
   - `claude --help`, `claude remote-control --help`, and `claude agents --help` before relying on
     remembered CLI flags.
5. Keep wrappers and `.llm/tools` as deterministic fallbacks, not as competing sources of truth.
6. For implementation slices that need Codex mobile visibility, use the WSL Codex daemon path from
   `.agents/skills/codex-wsl-remote/SKILL.md`.
7. Use `deno task agentic:claude-openrouter-gateway -- --resume <id> --fork-session` for an isolated
   alternate-model fork. The launcher rejects Remote Control flags by design.
8. Use `deno task agentic:claude-hybrid -- --cwd <absolute-path> [--name <label>]` when the user
   needs native Remote Control plus explicit GLM Flash delegation. Require the launcher's registry
   evidence (matching PID and cwd plus a non-empty `bridgeSessionId`) before claiming attachment.
   The requested label need not equal Claude's derived registry name.

## Delegation Contract

- Claude supervisor sessions may gather state, write prompts, launch/check agents, and update
  harness artifacts.
- PLAN-EVAL and IMPL-EVAL use separate opposite-family sessions selected from the canonical
  `.llm/harness/workflow/lane-policy.md`; blocked routes are recorded in the run.
- Implementation slices use daemon-attached WSL Codex sessions with recorded thread id, worktree,
  daemon proof, and steering command.
- Do not count Claude internal subagents or plugin helper agents as NetScript implementation agents.
- Do not send a second implementation launch into the same worktree while one is active; steer the
  existing session instead.

## Reasoning Policy

| Task                                                        | Effort   |
| ----------------------------------------------------------- | -------- |
| Mechanical status checks, prompt delivery, no-edit smokes   | `low`    |
| Daily supervision and ordinary implementation               | `medium` |
| Debugging, self-evaluation, ambiguous fixes                 | `high`   |
| Explicit user request or unusually complex/high-risk design | `xhigh`  |

## Claude Workflows / Ultracode Policy

Claude Code can orchestrate dynamic workflows for substantive tasks when Ultracode is enabled. This
is powerful but can burn tokens quickly, so use it only where the extra orchestration changes the
outcome.

- Use Claude workflows for high-value supervisor work: cross-PR synthesis, slice graph planning,
  evaluator prompt generation, workflow design, or ambiguity reduction before implementation.
- Do not use Claude workflows as the default NetScript implementation agent. WSL Codex remains the
  preferred implementation lane because it is daemon-attached, mobile-visible, and cheaper to steer
  slice-by-slice.
- Keep the evaluator a separate session on the evaluator lane from
  `.llm/harness/workflow/lane-policy.md` — normally native opposite-family Claude ⇄ Codex, with
  OpenRouter only for a third opinion/native quota limit and OpenHands only for explicitly
  cloud-driven work. Claude workflows may prepare evaluator inputs, but they do not replace
  PLAN-EVAL or IMPL-EVAL, and no session self-certifies.
- Route every Claude workflow, supervisor, and review session through the canonical lane table in
  `.llm/harness/workflow/lane-policy.md`. Do not reproduce model/effort defaults here or infer a
  paid escalation from workflow prose.
- A workflow output is acceptable only if it produces compact artifacts: updated harness plan, slice
  briefs, agent prompts, or decision records. It should not leave hidden untracked work.

## Commands

```powershell
deno task agentic:check-claude
deno task agentic:smoke-claude-remote -- --pretty
deno task agentic:claude-openrouter-gateway -- --cwd <path> [--resume <id> --fork-session]
deno task agentic:claude-hybrid -- --cwd <absolute-path> [--name <label>]
deno task agentic:sync-claude
```

Use `--live --prompt <file>` with `agentic:smoke-claude-remote` only when a real Claude background
session should be started.

## Common Pitfalls

- Assuming a repo skill is globally installed. Check `.claude/skills/` or read `.agents/skills/...`
  directly.
- Waiting for full session completion when the job is only to steer. Background launches should
  return quickly and provide a status handle.
- Treating a successful local process as mobile-visible. Require remote-control or daemon evidence.
- Describing hybrid delegation as a quota bypass. Claude still spends a supervisor/tool-call turn;
  only the explicitly delegated work runs on the OpenRouter worker.
- Adding `OPENROUTER_API_KEY` or Anthropic overrides to the Claude child. The launcher strips both
  provider boundaries; only the isolated OpenCode worker receives the resolved OpenRouter key.
- Treating `--name` equality as attachment proof. Claude may derive the registry name; require PID,
  cwd, and `bridgeSessionId` instead.
- Retrying a failed delegated task without reading its bounded error category. Check task/context
  size, timeout, OpenCode availability, and the configured OpenRouter env file for
  `invalid_request`, `timed_out`, `result_too_large`, or `worker_failed` respectively.
- Letting stale `.claude/skills` drift from `.agents/skills`; run `agentic:check-claude`.

## Checklist

- [ ] Current branch/worktree is verified.
- [ ] Harness skill was loaded for harnessed work.
- [ ] Evaluator surface is the lane-policy route: native opposite-family locally; OpenRouter only
      for third opinion/native quota limit; OpenHands only for explicitly cloud-driven runs.
- [ ] Implementation surface is WSL Codex when slice work must be mobile-visible.
- [ ] Claude remote-control or Codex daemon visibility is proven before claiming phone visibility.
- [ ] Hybrid sessions are described as native Claude supervision plus explicit worker delegation,
      never as transparent replacement or zero-quota Remote Control.
- [ ] Requested and observed worker identities are reported distinctly; observed identity is the
      bridge's OpenCode argv, not provider-side attestation.
